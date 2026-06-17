import "dotenv/config";
import { corsair } from "./src/server/corsair";

async function run() {
  const userId = "bxOmEKg79xNpXuEJTWVzqEi4kRobAznZ"; // Using the user ID from previous logs
  const tenant = corsair.withTenant(userId);

  console.log("Testing GitHub API...");
  try {
    const ghRes = await tenant.github.api.repositories.list({
      sort: "updated",
      perPage: 5,
    });
    console.log("GitHub Success:", ghRes.length, "repos");
  } catch (e: any) {
    console.error("GitHub Error:", e.message);
  }

  console.log("\nTesting Drive API...");
  try {
    const driveRes = await tenant.googledrive.api.files.list({
      pageSize: 5,
      orderBy: "modifiedTime desc",
    });
    console.log("Drive Success:", driveRes.files?.length, "files");
  } catch (e: any) {
    console.error("Drive Error:", e.message);
  }

  console.log("\nTesting Gmail Fallback Sync...");
  try {
    const response = await tenant.gmail.api.messages.list({ maxResults: 5 });
    const liveMessages = response.messages ?? [];
    console.log("Gmail list success, messages:", liveMessages.length);
    const fetched = await Promise.all(
      liveMessages.map(async (msg: any) => {
        if (!msg.id) return null;
        const full = await tenant.gmail.api.messages.get({
          id: msg.id,
          format: "metadata",
        });
        return full;
      }),
    );
    console.log("Gmail get success, fetched:", fetched.length);
  } catch (e: any) {
    console.error("Gmail Error:", e.message);
  }
}

run().catch(console.error);
