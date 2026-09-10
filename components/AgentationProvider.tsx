"use client";

import dynamic from "next/dynamic";

const Agentation = dynamic(
  () => import("agentation").then((mod) => ({ default: mod.Agentation })),
  { ssr: false }
);

export default function AgentationProvider() {
  if (process.env.NODE_ENV !== "development") {
    return null;
  }

  return (
    <Agentation
      endpoint={
        process.env.NEXT_PUBLIC_AGENTATION_ENDPOINT || "http://localhost:4747"
      }
    />
  );
}
