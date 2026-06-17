"use client";

import dynamic from "next/dynamic";

// Dynamically import Agentation with SSR disabled to prevent hydration errors
// since it relies heavily on the window/document APIs
const Agentation = dynamic(
  () => import("agentation").then((mod) => mod.Agentation),
  { ssr: false },
);

export function AgentationWrapper() {
  return <Agentation />;
}
