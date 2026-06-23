"use client";

import { useState, useEffect } from "react";
import { api } from "@/trpc/react";
import {
  HardDrive,
  Search,
  FileText,
  ExternalLink,
  Image as ImageIcon,
  FileSpreadsheet,
  FileIcon,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { Skeleton } from "@/components/ui/Skeleton";
import { motion, AnimatePresence } from "framer-motion";
import { Input } from "@/components/ui/input";
import { useDebounce } from "@/hooks/use-debounce";

export default function DrivePage() {
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 500);

  // Fix for the crashed service worker intercepting the redirect
  useEffect(() => {
    if (typeof navigator !== "undefined" && "serviceWorker" in navigator) {
      navigator.serviceWorker.getRegistrations().then((registrations) => {
        for (const registration of registrations) {
          registration.unregister();
        }
      });
    }
  }, []);

  const { data: recentFiles, isLoading: isLoadingRecent } =
    api.drive.listFiles.useQuery(undefined, {
      enabled: debouncedSearch.length === 0,
    });

  const { data: searchResults, isFetching: isSearching } =
    api.drive.searchFiles.useQuery(
      { query: debouncedSearch },
      { enabled: debouncedSearch.length > 0 },
    );

  const isLoading = isLoadingRecent || isSearching;
  const files = debouncedSearch.length > 0 ? searchResults : recentFiles;

  const getFileIcon = (mimeType: string) => {
    if (mimeType.includes("document"))
      return <FileText className="text-blue-500" />;
    if (mimeType.includes("spreadsheet"))
      return <FileSpreadsheet className="text-green-500" />;
    if (mimeType.includes("image"))
      return <ImageIcon className="text-purple-500" />;
    return <FileIcon className="text-slate-500" />;
  };

  return (
    <div className="bg-background flex h-full flex-col overflow-hidden">
      <header className="border-border/50 bg-background/95 sticky top-0 z-10 flex flex-col gap-4 border-b px-6 py-4 backdrop-blur">
        <div className="flex items-center gap-3">
          <div className="rounded-lg bg-indigo-500/10 p-2 text-indigo-500">
            <HardDrive size={24} />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Google Drive</h1>
            <p className="text-muted-foreground text-sm">
              Access and search your cloud files instantly
            </p>
          </div>
        </div>

        <div className="relative max-w-xl">
          <Search className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
          <Input
            placeholder="Search files by name..."
            className="bg-muted/50 border-border/50 pl-9 focus-visible:ring-indigo-500"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </header>

      <main className="bg-muted/10 flex-1 overflow-y-auto p-6">
        {isLoading ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {[...Array(8)].map((_, i) => (
              <Skeleton key={i} className="h-32 w-full rounded-xl" />
            ))}
          </div>
        ) : files?.length ? (
          <motion.div
            className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
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
            <AnimatePresence>
              {files.map((file: any) => (
                <motion.a
                  key={file.id}
                  href={file.webViewLink}
                  target="_blank"
                  rel="noreferrer"
                  variants={{
                    hidden: { opacity: 0, scale: 0.95 },
                    show: { opacity: 1, scale: 1 },
                  }}
                  layout
                  whileHover={{ y: -4, scale: 1.02 }}
                  className="bg-card border-border/50 group flex cursor-pointer flex-col justify-between rounded-xl border p-4 transition-all hover:border-indigo-500/50 hover:shadow-lg hover:shadow-indigo-500/5"
                >
                  <div>
                    <div className="mb-3 flex items-start justify-between gap-2">
                      <div className="bg-muted/50 rounded-lg p-2">
                        {getFileIcon(file.mimeType)}
                      </div>
                      <ExternalLink className="text-muted-foreground h-4 w-4 shrink-0 opacity-0 transition-opacity group-hover:text-indigo-500 group-hover:opacity-100" />
                    </div>
                    <h3 className="line-clamp-2 text-sm font-medium transition-colors group-hover:text-indigo-500">
                      {file.name}
                    </h3>
                  </div>
                  <div className="text-muted-foreground mt-4 text-xs font-medium">
                    Updated {formatDistanceToNow(new Date(file.modifiedTime))}{" "}
                    ago
                  </div>
                </motion.a>
              ))}
            </AnimatePresence>
          </motion.div>
        ) : (
          <div className="border-border/50 bg-card flex h-[60vh] flex-col items-center justify-center rounded-xl border border-dashed text-center">
            <HardDrive className="text-muted-foreground/50 mb-4 h-12 w-12" />
            <h3 className="text-lg font-semibold">No files found</h3>
            <p className="text-muted-foreground mt-1 mb-6 max-w-sm text-sm">
              {search
                ? `No results matching "${search}" in your Google Drive.`
                : "Your Google Drive seems empty or isn't connected properly."}
            </p>
            {!search && (
              <a
                href="/api/corsair/connect?plugin=googledrive"
                className="rounded-lg bg-indigo-500 px-6 py-2 font-medium text-white shadow-md transition-colors hover:bg-indigo-600"
              >
                Connect Google Drive
              </a>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
