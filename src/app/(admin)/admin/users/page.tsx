import { db } from "@/server/db";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { format } from "date-fns";

export const dynamic = "force-dynamic";

export default async function AdminUsersPage() {
  const allUsers = await db.query.user.findMany({
    orderBy: (users, { desc }) => [desc(users.createdAt)],
  });

  return (
    <div className="p-8">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-foreground text-3xl font-bold tracking-tight">
            Users Management
          </h1>
          <p className="text-muted-foreground mt-1">
            View and manage all registered users in Zero Inbox.
          </p>
        </div>
        <Badge variant="outline" className="px-3 py-1 text-sm">
          {allUsers.length} Total Users
        </Badge>
      </div>

      <Card className="border-border/50 shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg">All Users</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="border-border/50 overflow-x-auto rounded-md border">
            <table className="w-full caption-bottom text-sm">
              <thead className="bg-muted/50 [&_tr]:border-b">
                <tr className="hover:bg-muted/50 data-[state=selected]:bg-muted border-b transition-colors">
                  <th className="text-muted-foreground h-12 px-4 text-left align-middle font-medium">
                    User ID
                  </th>
                  <th className="text-muted-foreground h-12 px-4 text-left align-middle font-medium">
                    Name
                  </th>
                  <th className="text-muted-foreground h-12 px-4 text-left align-middle font-medium">
                    Email
                  </th>
                  <th className="text-muted-foreground h-12 px-4 text-left align-middle font-medium">
                    Role
                  </th>
                  <th className="text-muted-foreground h-12 px-4 text-left align-middle font-medium">
                    Joined
                  </th>
                </tr>
              </thead>
              <tbody className="[&_tr:last-child]:border-0">
                {allUsers.map((u) => (
                  <tr
                    key={u.id}
                    className="hover:bg-muted/30 data-[state=selected]:bg-muted border-b transition-colors"
                  >
                    <td className="text-muted-foreground p-4 align-middle font-mono text-xs">
                      {u.id.slice(0, 8)}...
                    </td>
                    <td className="text-foreground p-4 align-middle font-medium">
                      {u.name}
                    </td>
                    <td className="text-muted-foreground p-4 align-middle">
                      {u.email}
                    </td>
                    <td className="p-4 align-middle">
                      <Badge
                        variant={u.role === "admin" ? "default" : "secondary"}
                        className={
                          u.role === "admin"
                            ? "bg-indigo-500 hover:bg-indigo-600"
                            : "bg-muted text-muted-foreground"
                        }
                      >
                        {u.role}
                      </Badge>
                    </td>
                    <td className="text-muted-foreground p-4 align-middle text-sm">
                      {format(new Date(u.createdAt), "MMM d, yyyy")}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
