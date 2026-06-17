import { createTRPCRouter, protectedProcedure } from "../trpc";
import { getTenant } from "../../lib/tenant";

export const driveRouter = createTRPCRouter({
  listFiles: protectedProcedure.query(async ({ ctx }) => {
    try {
      const tenant = getTenant(ctx.session.user.id);
      // Using Corsair's native Google Drive wrapper
      const response = await tenant.googledrive.api.files.list({
        pageSize: 30,
        orderBy: "modifiedTime desc",
      });
      return response.files ?? [];
    } catch (error: any) {
      console.error("Drive fetch error:", error?.message);
      return [];
    }
  }),
});
