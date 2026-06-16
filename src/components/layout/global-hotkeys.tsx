"use client";

import { useHotkeys } from "react-hotkeys-hook";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

export function GlobalHotkeys() {
  const router = useRouter();

  // CMD+K to open search or AI agent
  useHotkeys(
    ["meta+k", "ctrl+k"],
    (e) => {
      e.preventDefault();
      router.push("/agent");
      toast("Command Palette opened");
    },
    { enableOnFormTags: false },
  );

  // C to compose
  useHotkeys(
    "c",
    (e) => {
      e.preventDefault();
      toast.info("Compose feature coming soon!");
    },
    { enableOnFormTags: false },
  );

  // I to go to inbox
  useHotkeys(
    "i",
    (e) => {
      e.preventDefault();
      router.push("/inbox");
    },
    { enableOnFormTags: false },
  );

  // / to search
  useHotkeys(
    "/",
    (e) => {
      e.preventDefault();
      // Would focus a global search input if we had one
      router.push("/inbox?q=search");
      toast("Search focused");
    },
    { enableOnFormTags: false },
  );

  return null;
}
