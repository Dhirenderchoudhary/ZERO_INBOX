"use client";

import { useState } from "react";
import { api } from "@/trpc/react";
import { CreditCard, CheckCircle2, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/Skeleton";
import { format } from "date-fns";

declare global {
  interface Window {
    Razorpay: any;
  }
}

export default function BillingPage() {
  const [isProcessing, setIsProcessing] = useState(false);
  const trpcUtils = api.useUtils();

  const { data: subData, isLoading } = api.billing.getSubscription.useQuery();

  const createOrder = api.billing.createOrder.useMutation();
  const verifyPayment = api.billing.verifyPayment.useMutation({
    onSuccess: () => {
      toast.success("Successfully upgraded to Pro!");
      trpcUtils.billing.getSubscription.invalidate();
    },
    onError: () => {
      toast.error("Payment verification failed.");
    },
  });

  const handleUpgrade = async () => {
    setIsProcessing(true);
    try {
      const order = await createOrder.mutateAsync({ 
        amount: 9900,
        currency: "INR" 
      });

      const options = {
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || "rzp_test_dummy",
        amount: order.amount,
        currency: order.currency,
        name: "Zero Inbox Pro",
        description: "Unlimited AI Email Triage",
        order_id: order.orderId,
        handler: function (response: any) {
          verifyPayment.mutate({
            razorpay_payment_id: response.razorpay_payment_id,
            razorpay_order_id: response.razorpay_order_id,
            razorpay_signature: response.razorpay_signature,
            planId: "pro",
          });
        },
        theme: {
          color: "#6366f1",
        },
      };

      const rzp = new window.Razorpay(options);
      rzp.on("payment.failed", function (_response: any) {
        toast.error("Payment failed. Please try again.");
      });
      rzp.open();
    } catch {
      toast.error("Could not initiate checkout.");
    } finally {
      setIsProcessing(false);
    }
  };

  if (isLoading) {
    return (
      <div className="h-full flex-1 space-y-6 p-8">
        <Skeleton className="h-10 w-64" />
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <Skeleton className="h-96 w-full" />
          <Skeleton className="h-96 w-full" />
        </div>
      </div>
    );
  }

  const isPro = subData?.plan === "pro" && subData?.status === "active";

  return (
    <div className="mx-auto flex h-full w-full max-w-5xl flex-1 flex-col p-8">
      <div className="mb-8">
        <h1 className="text-foreground flex items-center gap-3 text-3xl font-bold tracking-tight">
          <div className="rounded-lg bg-indigo-500/10 p-2 text-indigo-500">
            <CreditCard size={24} />
          </div>
          Billing & Usage
        </h1>
        <p className="text-muted-foreground mt-2">
          Manage your subscription and monitor AI token usage.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
        {/* Usage Card */}
        <Card className="border-border/50 flex flex-col shadow-sm">
          <CardHeader>
            <CardTitle>Current Usage</CardTitle>
            <CardDescription>
              Your AI operations this billing cycle
            </CardDescription>
          </CardHeader>
          <CardContent className="flex-1 space-y-6">
            <div>
              <div className="mb-2 flex justify-between text-sm">
                <span className="font-medium">AI Triage Operations</span>
                <span className="text-muted-foreground">
                  {subData?.messagesUsed || 0} / {isPro ? "Unlimited" : "100"}
                </span>
              </div>
              <div className="bg-muted h-3 w-full overflow-hidden rounded-full">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${isPro ? "w-full bg-indigo-500" : "bg-foreground"}`}
                  style={{
                    width: isPro
                      ? "100%"
                      : `${Math.min(((subData?.messagesUsed || 0) / 100) * 100, 100)}%`,
                  }}
                />
              </div>
              {!isPro && (
                <p className="text-muted-foreground mt-2 text-xs">
                  Upgrade to Pro for unlimited background triage.
                </p>
              )}
            </div>

            {isPro && subData?.currentPeriodEnd && (
              <div className="rounded-lg border border-indigo-500/20 bg-indigo-500/5 p-4">
                <p className="text-sm font-medium text-indigo-500">
                  Pro Active
                </p>
                <p className="text-muted-foreground mt-1 text-xs">
                  Your subscription renews on{" "}
                  {format(new Date(subData.currentPeriodEnd), "PPP")}.
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Plans Card */}
        <Card
          className={`relative flex flex-col overflow-hidden border-2 shadow-sm transition-all ${isPro ? "border-border/50" : "border-indigo-500/50 shadow-indigo-500/10"}`}
        >
          {!isPro && (
            <div className="absolute top-0 right-0 rounded-bl-lg bg-indigo-500 px-3 py-1 text-xs font-bold text-white">
              RECOMMENDED
            </div>
          )}
          <CardHeader>
            <div className="mb-2 flex items-center gap-2">
              <Zap
                className={isPro ? "text-muted-foreground" : "text-indigo-500"}
                size={20}
              />
              <CardTitle>Zero Inbox Pro</CardTitle>
            </div>
            <div className="text-3xl font-bold">
              ₹99
              <span className="text-muted-foreground text-sm font-normal">
                /mo
              </span>
            </div>
            <CardDescription>
              Unleash the full power of the AI agent
            </CardDescription>
          </CardHeader>
          <CardContent className="flex-1">
            <ul className="space-y-3">
              {[
                "Unlimited background email triage",
                "Advanced GitHub repository insights",
                "Google Drive native search & AI index",
                "Priority model access (GPT-4o)",
              ].map((feature, i) => (
                <li key={i} className="flex items-center gap-3 text-sm">
                  <CheckCircle2 className="text-indigo-500" size={16} />
                  <span>{feature}</span>
                </li>
              ))}
            </ul>
          </CardContent>
          <CardFooter>
            {isPro ? (
              <Button variant="outline" className="w-full" disabled>
                Current Plan
              </Button>
            ) : (
              <Button
                className="w-full bg-indigo-500 text-white hover:bg-indigo-600"
                onClick={handleUpgrade}
                disabled={isProcessing || createOrder.isPending}
              >
                {isProcessing ? "Processing..." : "Upgrade to Pro"}
              </Button>
            )}
          </CardFooter>
        </Card>
      </div>

      {/* Razorpay Script injection */}
      <script src="https://checkout.razorpay.com/v1/checkout.js" async></script>
    </div>
  );
}
