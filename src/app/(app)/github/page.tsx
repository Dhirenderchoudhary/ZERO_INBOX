import { GitBranch } from "lucide-react";

export default function GithubPage() {
  return (
    <div className="flex h-full flex-col items-center justify-center p-6 text-center">
      <div className="bg-muted flex h-20 w-20 items-center justify-center rounded-full">
        <GitBranch className="text-muted-foreground h-10 w-10" />
      </div>
      <h1 className="mt-6 text-2xl font-semibold">GitHub Integration Active</h1>
      <p className="text-muted-foreground mt-2 max-w-md">
        Your GitHub account is connected via Corsair. You can now use the
        FlowMail AI Agent to natively list your repositories, query your pull
        requests, and create new issues autonomously.
      </p>
    </div>
  );
}
