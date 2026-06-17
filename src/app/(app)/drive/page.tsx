"use client";

import { api } from "@/trpc/react";
import { HardDrive, File, ImageIcon, Folder } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { Skeleton } from "@/components/ui/Skeleton";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";

function getFileIcon(mimeType: string) {
  if (mimeType === "application/vnd.google-apps.folder")
    return <Folder className="h-5 w-5 text-blue-500" />;
  if (mimeType.startsWith("image/"))
    return <ImageIcon className="h-5 w-5 text-purple-500" />;
  return <File className="h-5 w-5 text-emerald-500" />;
}

export default function DrivePage() {
  const { data: files, isLoading } = api.drive.listFiles.useQuery();

  return (
    <div className="flex h-full flex-col overflow-y-auto p-6">
      <div className="mb-6 flex items-center gap-3">
        <div className="bg-muted flex h-12 w-12 items-center justify-center rounded-xl">
          <HardDrive className="text-foreground h-6 w-6" />
        </div>
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            Google Drive
          </h1>
          <p className="text-muted-foreground text-sm">
            Recent files connected via Corsair
          </p>
        </div>
      </div>

      {isLoading ? (
        <div className="flex flex-col gap-2">
          {[...Array(8)].map((_, i) => (
            <Skeleton key={i} className="h-14 w-full rounded-xl" />
          ))}
        </div>
      ) : files?.length ? (
        <motion.div
          className="flex flex-col gap-2"
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
          {files.map((file: any) => (
            <motion.a
              key={file.id}
              href={file.webViewLink}
              target="_blank"
              rel="noreferrer"
              variants={{
                hidden: { opacity: 0, y: 10 },
                show: { opacity: 1, y: 0 },
              }}
              whileHover={{ scale: 1.01 }}
              className="glass-panel flex items-center gap-4 rounded-xl p-3"
            >
              <div className="bg-muted/50 flex h-10 w-10 shrink-0 items-center justify-center rounded-lg">
                {file.iconLink ? (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img src={file.iconLink} alt="Icon" className="h-5 w-5" />
                ) : (
                  getFileIcon(file.mimeType)
                )}
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="truncate font-medium">{file.name}</h3>
                <p className="text-muted-foreground truncate text-xs">
                  {file.mimeType}
                </p>
              </div>
              <div className="text-muted-foreground hidden shrink-0 text-xs sm:block">
                {file.modifiedTime
                  ? formatDistanceToNow(new Date(file.modifiedTime), {
                      addSuffix: true,
                    })
                  : ""}
              </div>
            </motion.a>
          ))}
        </motion.div>
      ) : (
        <div className="border-border/70 bg-muted/20 flex h-64 flex-col items-center justify-center rounded-xl border border-dashed text-center">
          <HardDrive className="text-muted-foreground mb-4 h-8 w-8" />
          <h3 className="font-semibold">No files found</h3>
          <p className="text-muted-foreground mb-4 text-sm">
            Or you need to reconnect your Google Drive account.
          </p>
          <Button
            onClick={() =>
              (window.location.href = "/api/corsair/connect?plugin=googledrive")
            }
          >
            Connect Google Drive
          </Button>
        </div>
      )}
    </div>
  );
}
