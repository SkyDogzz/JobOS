"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, Loader2, Plus, XCircle } from "lucide-react";
import { apiUrl } from "../../../lib/api";

interface SubmitState {
  status: "idle" | "success" | "error";
  message: string;
}

export function ResumeVersionForm({ resumeId }: { resumeId: string }) {
  const router = useRouter();
  const [isSaving, setIsSaving] = useState(false);
  const [submitState, setSubmitState] = useState<SubmitState>({ status: "idle", message: "" });

  async function createVersion(formData: FormData) {
    setIsSaving(true);
    setSubmitState({ status: "idle", message: "" });

    try {
      const response = await fetch(`${apiUrl}/resumes/${resumeId}/versions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: String(formData.get("title") ?? ""),
          content: {
            summary: String(formData.get("summary") ?? ""),
            skills: String(formData.get("skills") ?? "")
              .split(",")
              .map((skill) => skill.trim())
              .filter(Boolean)
          }
        })
      });

      if (!response.ok) {
        const body = await response.json().catch(() => null) as { message?: string } | null;
        throw new Error(body?.message ?? "Could not create CV version.");
      }

      setSubmitState({ status: "success", message: "New CV version created." });
      router.refresh();
    } catch (error) {
      setSubmitState({ status: "error", message: error instanceof Error ? error.message : "Could not create CV version." });
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <form action={createVersion} className="rounded border border-ink/10 bg-white p-5">
      <h2 className="mb-4 font-semibold">New Version</h2>
      <StatusMessage state={submitState} />
      <label className="mb-3 block text-sm">
        <span className="mb-1 block font-medium text-ink/70">Title</span>
        <input className="h-10 w-full rounded border border-ink/15 px-3" name="title" placeholder="Backend-focused v2" required />
      </label>
      <label className="mb-3 block text-sm">
        <span className="mb-1 block font-medium text-ink/70">Summary</span>
        <textarea className="min-h-24 w-full rounded border border-ink/15 px-3 py-2" name="summary" placeholder="What changed in this version" />
      </label>
      <label className="mb-3 block text-sm">
        <span className="mb-1 block font-medium text-ink/70">Skills</span>
        <input className="h-10 w-full rounded border border-ink/15 px-3" name="skills" placeholder="TypeScript, NestJS, PostgreSQL" />
      </label>
      <button
        className="inline-flex h-10 w-full items-center justify-center gap-2 rounded bg-ink px-4 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:bg-ink/35"
        disabled={isSaving}
        type="submit"
      >
        {isSaving ? <Loader2 className="animate-spin" size={16} /> : <Plus size={16} />}
        {isSaving ? "Saving" : "Create version"}
      </button>
    </form>
  );
}

function StatusMessage({ state }: { state: SubmitState }) {
  if (state.status === "success") {
    return (
      <div className="mb-4 flex items-center gap-2 rounded border border-moss/30 bg-moss/10 px-3 py-2 text-sm text-moss">
        <CheckCircle2 size={16} />
        {state.message}
      </div>
    );
  }

  if (state.status === "error") {
    return (
      <div className="mb-4 flex items-center gap-2 rounded border border-rust/30 bg-rust/10 px-3 py-2 text-sm text-rust">
        <XCircle size={16} />
        {state.message}
      </div>
    );
  }

  return null;
}
