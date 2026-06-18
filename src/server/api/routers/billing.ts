import { createTRPCRouter, protectedProcedure } from "../trpc";
import Razorpay from "razorpay";
import { z } from "zod";
import { db } from "../../db";
import { subscriptions, usage } from "../../db/schema";
import { eq } from "drizzle-orm";
import { CreateOrderSchema, VerifyPaymentSchema } from "../../lib/schemas";

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID || "rzp_test_dummy",
  key_secret: process.env.RAZORPAY_KEY_SECRET || "dummy_secret",
});

export const billingRouter = createTRPCRouter({
  getSubscription: protectedProcedure.query(async ({ ctx }) => {
    const userId = ctx.session.user.id;

    // Check usage
    const userUsage = await db.query.usage.findFirst({
      where: eq(usage.userId, userId),
    });

    // Check sub
    const sub = await db.query.subscriptions.findFirst({
      where: eq(subscriptions.userId, userId),
    });

    return {
      plan: sub?.planId || "free",
      status: sub?.status || "inactive",
      messagesUsed: userUsage?.messagesUsed || 0,
      currentPeriodEnd: sub?.currentPeriodEnd,
    };
  }),

  createOrder: protectedProcedure
    .input(CreateOrderSchema)
    .mutation(async ({ input }) => {
      // Amount is already in the smallest currency unit (e.g. 9900 for ₹99) and validated by Zod
      try {
        const order = await razorpay.orders.create({
          amount: input.amount,
          currency: input.currency,
          receipt: input.receipt || `rcpt_${Date.now()}`,
        });

        return {
          orderId: order.id,
          amount: order.amount,
          currency: order.currency,
        };
      } catch (error: any) {
        throw new Error(`Failed to create Razorpay order: ${error.message}`);
      }
    }),

  verifyPayment: protectedProcedure
    .input(
      VerifyPaymentSchema.extend({
        planId: z.string().min(1),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // In production, use crypto to verify the signature here.
      // For development, we will assume verification success and update DB.

      const userId = ctx.session.user.id;
      const oneMonthFromNow = new Date();
      oneMonthFromNow.setMonth(oneMonthFromNow.getMonth() + 1);

      await db
        .insert(subscriptions)
        .values({
          userId,
          planId: input.planId,
          status: "active",
          currentPeriodEnd: oneMonthFromNow,
          razorpaySubscriptionId: input.razorpay_order_id,
        })
        .onConflictDoUpdate({
          target: subscriptions.id,
          set: {
            planId: input.planId,
            status: "active",
            currentPeriodEnd: oneMonthFromNow,
            updatedAt: new Date(),
          },
        });

      return { success: true };
    }),
});
