"use client";

import { useState } from "react";
import { FileSearch, GitMerge, Save } from "lucide-react";
import { apiUrl, type DuplicateJobCandidate, type ParsedJobPosting } from "../../lib/api";

export function JobBoardParserForm() {
  const [parsed, setParsed] = useState<ParsedJobPosting | null>(null);
  const [duplicates, setDuplicates] = useState<DuplicateJobCandidate[]>([]);
  const [message, setMessage] = useState("");

  async function parse(formData: FormData) {
    setMessage("Parsing...");
    setDuplicates([]);
    const response = await fetch(`${apiUrl}/job-sources/parse`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        url: String(formData.get("url") ?? "") || undefined,
        html: String(formData.get("html") ?? "") || undefined,
        text: String(formData.get("text") ?? "") || undefined
      })
    });
    if (!response.ok) {
      setMessage("Could not parse that posting.");
      return;
    }
    const parsedJob = await response.json() as ParsedJobPosting;
    setParsed(parsedJob);

    const duplicateResponse = await fetch(`${apiUrl}/jobs/dedupe`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(parsedJob)
    });
    const duplicateJobs = duplicateResponse.ok ? await duplicateResponse.json() as DuplicateJobCandidate[] : [];
    setDuplicates(duplicateJobs);
    setMessage(duplicateJobs.length ? "Review possible duplicates before saving." : "Review the parsed job before saving.");
  }

  async function save() {
    if (!parsed) return;
    const response = await fetch(`${apiUrl}/jobs`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(parsed)
    });
    setMessage(response.ok ? "Job saved. Refreshing..." : "Could not save parsed job.");
    if (response.ok) window.location.reload();
  }

  async function merge(id: string) {
    if (!parsed) return;
    const response = await fetch(`${apiUrl}/jobs/${id}/merge`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ incoming: parsed, strategy: "update_existing" })
    });
    setMessage(response.ok ? "Duplicate merged. Refreshing..." : "Could not merge duplicate job.");
    if (response.ok) window.location.reload();
  }

  return (
    <section className="mb-5 rounded border border-ink/10 bg-white p-5">
      <div className="mb-4 flex items-center gap-2">
        <FileSearch size={18} />
        <h2 className="font-semibold">Parse Job Board Posting</h2>
      </div>
      <form action={parse} className="grid gap-3">
        <input className="h-10 rounded border border-ink/15 px-3 text-sm" name="url" placeholder="Job URL" />
        <textarea className="min-h-28 rounded border border-ink/15 p-3 text-sm" name="html" placeholder="Paste job page HTML" />
        <textarea className="min-h-20 rounded border border-ink/15 p-3 text-sm" name="text" placeholder="Or paste visible job text" />
        <button className="inline-flex w-fit items-center gap-2 rounded bg-ink px-3 py-2 text-sm font-medium text-white"><FileSearch size={15} />Parse posting</button>
      </form>
      {parsed ? (
        <div className="mt-4">
          <pre className="max-h-80 overflow-auto rounded bg-paper p-3 text-xs">{JSON.stringify(parsed, null, 2)}</pre>
          {duplicates.length ? (
            <div className="mt-3 space-y-2">
              {duplicates.map((job) => (
                <div key={job.id} className="rounded border border-ink/10 p-3 text-sm">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <p className="font-medium">{job.title}</p>
                      <p className="text-xs text-ink/60">{job.companyName ?? "Unknown company"} · {job.duplicateScore}% match</p>
                    </div>
                    <button className="inline-flex items-center gap-2 rounded border border-ink/15 px-3 py-2 text-xs font-medium" onClick={() => merge(job.id)} type="button"><GitMerge size={14} />Merge</button>
                  </div>
                  <p className="mt-2 text-xs text-ink/60">{job.duplicateReasons.join(", ")}</p>
                </div>
              ))}
            </div>
          ) : null}
          <button className="mt-3 inline-flex items-center gap-2 rounded border border-ink/15 px-3 py-2 text-sm font-medium" onClick={save} type="button"><Save size={15} />Save parsed job</button>
        </div>
      ) : null}
      {message ? <p className="mt-3 text-sm text-ink/60">{message}</p> : null}
    </section>
  );
}
