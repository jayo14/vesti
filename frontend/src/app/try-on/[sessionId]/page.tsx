"use client";

import { useParams } from "next/navigation";
import { StudioSection } from "@/components/studio/studio-section";
import type { Generation } from "@/lib/types";

export default function TryOnSessionPage() {
  const params = useParams<{ sessionId: string }>();

  // Load the generation by ID — the StudioSection renders the result
  // if useStudioStore().resultImage is populated.
  // TODO: Fetch generation data from API and populate store.
  // For now, just render the studio with the sessionId for future use.
  void params.sessionId;

  return <StudioSection />;
}
