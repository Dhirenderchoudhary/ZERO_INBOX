"use client";

import { api } from "@/trpc/react";
import { GitBranch, ExternalLink, Star } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { Skeleton } from "@/components/ui/Skeleton";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import { toast } from "sonner";

export default function GithubPage() {
  const [token, setToken] = useState("");
  const trpcUtils = api.useUtils();
  const { data: repos, isLoading } = api.github.listRepos.useQuery();
  const setApiKey = api.github.setApiKey.useMutation({
    onSuccess: () => {
      toast.success("GitHub Token Saved");
      trpcUtils.github.listRepos.invalidate();
    },
    onError: () => toast.error("Failed to save token"),
  });

  return (
    <div className="flex h-full flex-col overflow-y-auto p-6">
      <div className="mb-6 flex items-center gap-3">
        <div className="bg-muted flex h-12 w-12 items-center justify-center rounded-xl">
          <GitBranch className="text-foreground h-6 w-6" />
        </div>
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            GitHub Repositories
          </h1>
          <p className="text-muted-foreground text-sm">
            Your connected GitHub repositories via Corsair
          </p>
        </div>
      </div>

      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[...Array(6)].map((_, i) => (
            <Skeleton key={i} className="h-32 w-full rounded-xl" />
          ))}
        </div>
      ) : repos?.length ? (
        <motion.div
          className="grid gap-4 md:grid-cols-2 lg:grid-cols-3"
          initial="hidden"
          animate="show"
          variants={{
            hidden: { opacity: 0 },
            show: {
              opacity: 1,
              transition: { staggerChildren: 0.05 },
            },
          }}
        >
          {repos.map((repo: any) => (
            <motion.a
              key={repo.id}
              href={repo.htmlUrl}
              target="_blank"
              rel="noreferrer"
              variants={{
                hidden: { opacity: 0, scale: 0.95 },
                show: { opacity: 1, scale: 1 },
              }}
              whileHover={{ y: -4 }}
              className="glass-panel group flex flex-col justify-between rounded-xl p-4"
            >
              <div>
                <div className="flex items-start justify-between gap-2">
                  <h3 className="truncate font-medium text-blue-500 group-hover:underline dark:text-blue-400">
                    {repo.fullName}
                  </h3>
                  <ExternalLink className="text-muted-foreground h-4 w-4 shrink-0 opacity-0 transition-opacity group-hover:opacity-100" />
                </div>
                {repo.description && (
                  <p className="text-muted-foreground mt-2 line-clamp-2 text-sm">
                    {repo.description}
                  </p>
                )}
              </div>
              <div className="text-muted-foreground mt-4 flex items-center gap-4 text-xs">
                <div className="flex items-center gap-1">
                  <span className="h-2 w-2 rounded-full bg-blue-500"></span>
                  {repo.language || "Unknown"}
                </div>
                <div className="flex items-center gap-1">
                  <Star className="h-3 w-3" />
                  {repo.stargazersCount}
                </div>
                <div>
                  Updated {formatDistanceToNow(new Date(repo.updatedAt))} ago
                </div>
              </div>
            </motion.a>
          ))}
        </motion.div>
      ) : (
        <div className="border-border/70 bg-muted/20 flex h-64 flex-col items-center justify-center rounded-xl border border-dashed text-center">
          <GitBranch className="text-muted-foreground mb-4 h-8 w-8" />
          <h3 className="font-semibold">No repositories found</h3>
          <p className="text-muted-foreground mb-6 text-sm">
            You need to connect your GitHub account using a Personal Access
            Token.
          </p>
          <div className="mx-auto flex w-full max-w-sm items-center gap-2">
            <Input
              type="password"
              placeholder="ghp_..."
              value={token}
              onChange={(e) => setToken(e.target.value)}
              className="bg-background/50"
            />
            <Button
              onClick={() => setApiKey.mutate({ apiKey: token })}
              disabled={!token || setApiKey.isPending}
            >
              Save Token
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
