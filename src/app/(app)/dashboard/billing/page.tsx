import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function BillingPage() {
  return (
    <div className="h-full overflow-y-auto p-4 sm:p-6 lg:p-8">
      <div className="mx-auto flex max-w-4xl flex-col gap-6">
        <div>
          <h2 className="text-3xl font-semibold tracking-tight">
            Billing & Usage
          </h2>
          <p className="text-muted-foreground mt-2">
            Manage your subscription plan and monitor your usage limits.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Free Plan</CardTitle>
              <CardDescription>
                You are currently on the Free Tier.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-3xl font-bold">
                $0{" "}
                <span className="text-muted-foreground text-sm font-normal">
                  / month
                </span>
              </div>
              <ul className="space-y-2 text-sm">
                <li>✓ 20 AI Actions / month</li>
                <li>✓ Basic email triage</li>
                <li>✓ Standard support</li>
              </ul>
              <Button className="mt-4 w-full" disabled>
                Current Plan
              </Button>
            </CardContent>
          </Card>

          <Card className="border-primary border-2">
            <CardHeader>
              <CardTitle>Pro Plan</CardTitle>
              <CardDescription>
                Upgrade for unlimited agent capability.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-3xl font-bold">
                $10{" "}
                <span className="text-muted-foreground text-sm font-normal">
                  / month
                </span>
              </div>
              <ul className="space-y-2 text-sm">
                <li>✓ 500 AI Actions / month</li>
                <li>✓ Voice-to-text enabled</li>
                <li>✓ Priority processing</li>
              </ul>
              {/* Note: This would typically trigger a Razorpay checkout modal */}
              <Button className="mt-4 w-full">Upgrade to Pro</Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
