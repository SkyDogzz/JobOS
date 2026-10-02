"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

const stages = ["saved", "applied", "screening", "interviewing", "offer", "rejected", "withdrawn", "accepted"];

export function StageControls({ applicationId, initialStage }: { applicationId: string; initialStage: string }) {
  const router = useRouter();
  const [stage, setStage] = useState(initialStage);
  const [message, setMessage] = useState("");
  const [isPending, startTransition] = useTransition();

  async function updateStage(nextStage: string) {
    const previous = stage;
    setStage(nextStage);
    setMessage("");

    try {
      const response = await fetch(`${apiUrl}/applications/${applicationId}/stage`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ stage: nextStage })
      });

      if (!response.ok) {
        throw new Error("Stage update failed.");
      }

      setMessage("Stage updated.");
      startTransition(() => router.refresh());
    } catch {
      setStage(previous);
      setMessage("Could not update stage.");
    }
  }

  return (
    <label className="block text-sm">
      <span className="mb-1 block font-medium text-ink/70">Stage</span>
      <select className="h-10 w-full rounded border border-ink/15 bg-white px-3" disabled={isPending} onChange={(event) => updateStage(event.target.value)} value={stage}>
        {stages.map((item) => <option key={item} value={item}>{item}</option>)}
      </select>
      {message ? <p className="mt-2 text-xs text-ink/55">{message}</p> : null}
    </label>
  );
}
