"use client";

import { useMemo, useState } from "react";
import type { Dispatch, SetStateAction } from "react";
import { useRouter } from "next/navigation";
import { AlertTriangle, CheckCircle2, Loader2, Plus, Wand2, XCircle } from "lucide-react";
import { apiUrl, type DashboardJob } from "../../../lib/api";

interface DraftJob {
  title: string;
  companyName: string;
  location: string;
  sourceUrl: string;
  sourceName: string;
  remotePolicy: string;
  salaryText: string;
  description: string;
}

interface SubmitState {
  status: "idle" | "success" | "error";
  message: string;
}

const emptyDraft: DraftJob = {
  title: "",
  companyName: "",
  location: "",
  sourceUrl: "",
  sourceName: "manual",
  remotePolicy: "",
  salaryText: "",
  description: ""
};

export function ManualImportForm({ existingJobs }: { existingJobs: DashboardJob[] }) {
  const router = useRouter();
  const [rawText, setRawText] = useState("");
  const [draft, setDraft] = useState<DraftJob>(emptyDraft);
  const [submitState, setSubmitState] = useState<SubmitState>({ status: "idle", message: "" });
  const [isParsing, setIsParsing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const duplicate = useMemo(() => {
    const normalizedTitle = normalize(draft.title);
    const normalizedCompany = normalize(draft.companyName);
    const normalizedUrl = normalize(draft.sourceUrl);

    if (!normalizedTitle) return null;

    return existingJobs.find((job) => {
      const sameTitle = normalize(job.title) === normalizedTitle;
      const sameCompany = normalizedCompany && normalize(job.companyName ?? "") === normalizedCompany;
      const sameUrl = normalizedUrl && normalize(job.sourceUrl ?? "") === normalizedUrl;
      return sameTitle && (sameCompany || sameUrl);
    }) ?? null;
  }, [draft.companyName, draft.sourceUrl, draft.title, existingJobs]);

  function parsePosting() {
    setIsParsing(true);
    setSubmitState({ status: "idle", message: "" });
    const parsed = parseJobPosting(rawText);
    setDraft((current) => ({ ...current, ...parsed }));
    setIsParsing(false);
  }

  async function saveJob() {
    setIsSaving(true);
    setSubmitState({ status: "idle", message: "" });

    try {
      const payload = Object.fromEntries(
        Object.entries(draft)
          .map(([key, value]) => [key, value.trim()])
          .filter(([, value]) => value)
      );
      const response = await fetch(`${apiUrl}/jobs`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        const body = await response.json().catch(() => null) as { message?: string } | null;
        throw new Error(body?.message ?? "Could not save imported job.");
      }

      setRawText("");
      setDraft(emptyDraft);
      setSubmitState({ status: "success", message: "Imported job saved." });
      router.refresh();
    } catch (error) {
      setSubmitState({ status: "error", message: error instanceof Error ? error.message : "Could not save imported job." });
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div className="grid gap-5 lg:grid-cols-[1fr_1fr]">
      <section className="rounded border border-ink/10 bg-white p-5">
        <div className="mb-4 flex items-center justify-between gap-3">
          <h2 className="font-semibold">Paste Posting</h2>
          <button
            className="inline-flex h-9 items-center gap-2 rounded bg-ink px-3 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:bg-ink/35"
            disabled={!rawText.trim() || isParsing}
            onClick={parsePosting}
            type="button"
          >
            {isParsing ? <Loader2 className="animate-spin" size={16} /> : <Wand2 size={16} />}
            Parse
          </button>
        </div>
        <textarea
          className="min-h-[28rem] w-full rounded border border-ink/15 px-3 py-2 text-sm leading-6"
          onChange={(event) => setRawText(event.target.value)}
          placeholder="Paste the job post, URL, requirements, salary, and location."
          value={rawText}
        />
      </section>

      <section className="rounded border border-ink/10 bg-white p-5">
        <div className="mb-4 flex items-center justify-between gap-3">
          <h2 className="font-semibold">Confirm Job</h2>
          <button
            className="inline-flex h-9 items-center gap-2 rounded bg-rust px-3 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:bg-rust/40"
            disabled={isSaving || !draft.title.trim() || !draft.description.trim()}
            onClick={saveJob}
            type="button"
          >
            {isSaving ? <Loader2 className="animate-spin" size={16} /> : <Plus size={16} />}
            Save
          </button>
        </div>

        <StatusMessage state={submitState} />
        {duplicate ? (
          <div className="mb-4 flex items-start gap-2 rounded border border-rust/25 bg-rust/10 px-3 py-2 text-sm text-rust">
            <AlertTriangle className="mt-0.5 shrink-0" size={16} />
            <span>Possible duplicate: {duplicate.title} at {duplicate.companyName ?? "unknown company"}.</span>
          </div>
        ) : null}

        <div className="grid gap-3">
          <Input label="Title" name="title" draft={draft} setDraft={setDraft} required />
          <Input label="Company" name="companyName" draft={draft} setDraft={setDraft} />
          <Input label="Location" name="location" draft={draft} setDraft={setDraft} />
          <Input label="Source URL" name="sourceUrl" draft={draft} setDraft={setDraft} />
          <Input label="Source" name="sourceName" draft={draft} setDraft={setDraft} />
          <Input label="Remote policy" name="remotePolicy" draft={draft} setDraft={setDraft} />
          <Input label="Salary" name="salaryText" draft={draft} setDraft={setDraft} />
          <label className="block text-sm">
            <span className="mb-1 block font-medium text-ink/70">Description</span>
            <textarea
              className="min-h-36 w-full rounded border border-ink/15 px-3 py-2"
              onChange={(event) => setDraft((current) => ({ ...current, description: event.target.value }))}
              required
              value={draft.description}
            />
          </label>
        </div>
      </section>
    </div>
  );
}

function Input({
  label,
  name,
  draft,
  setDraft,
  required
}: {
  label: string;
  name: keyof DraftJob;
  draft: DraftJob;
  setDraft: Dispatch<SetStateAction<DraftJob>>;
  required?: boolean;
}) {
  return (
    <label className="block text-sm">
      <span className="mb-1 block font-medium text-ink/70">{label}</span>
      <input
        className="h-10 w-full rounded border border-ink/15 px-3"
        onChange={(event) => setDraft((current) => ({ ...current, [name]: event.target.value }))}
        required={required}
        value={draft[name]}
      />
    </label>
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

function parseJobPosting(text: string): Partial<DraftJob> {
  const lines = text.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
  const url = text.match(/https?:\/\/\S+/)?.[0]?.replace(/[),.]+$/, "") ?? "";
  const title = firstValue(lines, [/^title:\s*(.+)$/i, /^role:\s*(.+)$/i, /^position:\s*(.+)$/i]) ?? lines[0] ?? "";
  const companyName = firstValue(lines, [/^company:\s*(.+)$/i, /^organization:\s*(.+)$/i]) ?? inferCompany(lines);
  const location = firstValue(lines, [/^location:\s*(.+)$/i]) ?? inferLocation(lines);
  const salaryText = firstValue(lines, [/^salary:\s*(.+)$/i, /^compensation:\s*(.+)$/i]) ?? inferSalary(text);
  const remotePolicy = inferRemotePolicy(text);

  return {
    title,
    companyName,
    location,
    sourceUrl: url,
    sourceName: url ? new URL(url).hostname.replace(/^www\./, "") : "manual",
    remotePolicy,
    salaryText,
    description: text.trim()
  };
}

function firstValue(lines: string[], patterns: RegExp[]) {
  for (const line of lines) {
    for (const pattern of patterns) {
      const match = line.match(pattern);
      if (match?.[1]) return match[1].trim();
    }
  }

  return "";
}

function inferCompany(lines: string[]) {
  const atLine = lines.find((line) => /\sat\s/i.test(line));
  return atLine?.split(/\sat\s/i)[1]?.trim() ?? "";
}

function inferLocation(lines: string[]) {
  const locationLine = lines.find((line) => /(remote|hybrid|on-site|onsite|new york|san francisco|london|paris|berlin)/i.test(line));
  return locationLine ?? "";
}

function inferSalary(text: string) {
  return text.match(/(?:\$|EUR|USD|GBP|€)\s?[\d,.]+(?:\s?[-–]\s?(?:\$|EUR|USD|GBP|€)?\s?[\d,.]+)?(?:k|K)?/u)?.[0] ?? "";
}

function inferRemotePolicy(text: string) {
  if (/hybrid/i.test(text)) return "hybrid";
  if (/remote/i.test(text)) return "remote";
  if (/on-site|onsite/i.test(text)) return "onsite";
  return "";
}

function normalize(value: string) {
  return value.trim().toLowerCase().replace(/\s+/g, " ");
}
