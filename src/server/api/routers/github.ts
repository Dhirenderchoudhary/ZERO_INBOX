import { createTRPCRouter, protectedProcedure } from "../trpc";
import { getTenant } from "../../lib/tenant";
import { z } from "zod";

export const githubRouter = createTRPCRouter({
  listRepos: protectedProcedure.query(async ({ ctx }) => {
    try {
      const tenant = getTenant(ctx.session.user.id);
      // Using Corsair's native GitHub (Octokit) wrapper
      const response = await tenant.github.api.repositories.list({
        sort: "updated",
        perPage: 20,
      });
      return response ?? [];
    } catch (error: any) {
      console.error("GitHub fetch error:", error?.message);
      return [];
    }
  }),
  setApiKey: protectedProcedure
    .input(z.object({ apiKey: z.string().min(1) }))
    .mutation(async ({ ctx, input }) => {
      const tenant = getTenant(ctx.session.user.id);
      await tenant.github.keys.set_api_key(input.apiKey);
      return { success: true };
    }),
});
