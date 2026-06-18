import { createTRPCRouter, protectedProcedure } from "../trpc";
import { getTenant } from "../../lib/tenant";
import { z } from "zod";

export const driveRouter = createTRPCRouter({
  listFiles: protectedProcedure.query(async ({ ctx }) => {
    try {
      const tenant = getTenant(ctx.session.user.id);
      const response = await tenant.googledrive.api.files.list({
        pageSize: 30,
        orderBy: "modifiedTime desc",
        fields:
          "files(id, name, mimeType, modifiedTime, webViewLink, iconLink)",
      } as any);
      return response.files ?? [];
    } catch (error: any) {
      console.error("Drive fetch error:", error?.message);
      return [];
    }
  }),

  searchFiles: protectedProcedure
    .input(z.object({ query: z.string().min(1) }))
    .query(async ({ ctx, input }) => {
      try {
        const tenant = getTenant(ctx.session.user.id);
        const response = await tenant.googledrive.api.files.list({
          q: `name contains '${input.query.replace(/'/g, "\\'")}'`,
          pageSize: 20,
          orderBy: "modifiedTime desc",
          fields:
            "files(id, name, mimeType, modifiedTime, webViewLink, iconLink)",
        } as any);
        return response.files ?? [];
      } catch (error: any) {
        console.error("Drive search error:", error?.message);
        return [];
      }
    }),
});
