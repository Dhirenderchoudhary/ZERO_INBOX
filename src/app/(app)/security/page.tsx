import { ShieldCheck, Key, Activity, Globe, Database } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default function SecurityPage() {
  return (
    <div className="bg-background h-full overflow-y-auto p-4 sm:p-6 lg:p-8">
      <div className="mx-auto max-w-4xl space-y-8">
        <div>
          <h1 className="mb-2 text-3xl font-bold tracking-tight">
            Security & Trust
          </h1>
          <p className="text-muted-foreground">
            Review your security posture, OAuth connections, and audit logs.
          </p>
        </div>

        <div className="grid gap-6">
          <Card className="border-border bg-card/40 overflow-hidden shadow-sm backdrop-blur-xl transition-all hover:shadow-md">
            <div className="from-primary/5 pointer-events-none absolute inset-0 bg-gradient-to-r via-transparent to-transparent" />
            <CardHeader className="relative pb-4">
              <CardTitle className="flex items-center gap-2 text-lg">
                <ShieldCheck className="text-primary" size={20} /> Trust Posture
                <Badge className="bg-primary/10 text-primary border-primary/20 hover:bg-primary/20 ml-2 font-mono text-[10px]">
                  VERIFIED
                </Badge>
              </CardTitle>
              <CardDescription>
                OAuth, least privilege scopes, and auditability.
              </CardDescription>
            </CardHeader>
            <CardContent className="relative space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="border-border/50 bg-secondary/30 flex gap-3 rounded-xl border p-4">
                  <div className="bg-primary/10 text-primary mt-1 flex size-8 shrink-0 items-center justify-center rounded-lg">
                    <Key size={16} />
                  </div>
                  <div>
                    <h3 className="text-foreground text-sm font-medium">
                      OAuth Scopes
                    </h3>
                    <p className="text-muted-foreground mt-1 text-xs">
                      Google OAuth connected with scoped access for Gmail and
                      Calendar actions.
                    </p>
                  </div>
                </div>

                <div className="border-border/50 bg-secondary/30 flex gap-3 rounded-xl border p-4">
                  <div className="bg-primary/10 text-primary mt-1 flex size-8 shrink-0 items-center justify-center rounded-lg">
                    <Activity size={16} />
                  </div>
                  <div>
                    <h3 className="text-foreground text-sm font-medium">
                      Full Auditability
                    </h3>
                    <p className="text-muted-foreground mt-1 text-xs">
                      Every automated action is logged, reviewable, and
                      reversible instantly.
                    </p>
                  </div>
                </div>

                <div className="border-border/50 bg-secondary/30 flex gap-3 rounded-xl border p-4">
                  <div className="bg-primary/10 text-primary mt-1 flex size-8 shrink-0 items-center justify-center rounded-lg">
                    <Database size={16} />
                  </div>
                  <div>
                    <h3 className="text-foreground text-sm font-medium">
                      Data Encryption
                    </h3>
                    <p className="text-muted-foreground mt-1 text-xs">
                      Stored securely using Neon PostgreSQL with end-to-end
                      encryption in transit.
                    </p>
                  </div>
                </div>

                <div className="border-border/50 bg-secondary/30 flex gap-3 rounded-xl border p-4">
                  <div className="bg-primary/10 text-primary mt-1 flex size-8 shrink-0 items-center justify-center rounded-lg">
                    <Globe size={16} />
                  </div>
                  <div>
                    <h3 className="text-foreground text-sm font-medium">
                      Edge Network
                    </h3>
                    <p className="text-muted-foreground mt-1 text-xs">
                      Deployed globally to edge networks for zero-latency
                      routing and DDoS protection.
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
