"use client";

import { Check, Clock, Search, X } from "lucide-react";
import type { DiscoveredJobSummary } from "../../lib/api";

const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

export function DiscoveredJobsPanel({ jobs }: { jobs: DiscoveredJobSummary[] }) {
  async function action(path: string) {
    await fetch(`${apiUrl}${path}`, { method: "POST", credentials: "include", headers: { "Content-Type": "application/json" }, body: path.endsWith("/snooze") ? JSON.stringify({ snoozedUntil: new Date(Date.now() + 604800000).toISOString() }) : undefined });
    window.location.reload();
  }

  async function runCheck() {
    await fetch(`${apiUrl}/job-sources/checks/run`, { method: "POST", credentials: "include", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ fixtures: [] }) });
    window.location.reload();
  }

  return (
    <section className="mt-6 rounded border border-ink/10 bg-white p-5">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Search size={18} />
          <h2 className="font-semibold">Discovery Queue</h2>
        </div>
        <button className="rounded border border-ink/15 px-3 py-2 text-sm font-medium hover:bg-paper" onClick={runCheck} type="button">Run checks</button>
      </div>
      {jobs.length === 0 ? <p className="text-sm text-ink/55">No discovered jobs awaiting review.</p> : null}
      <div className="divide-y divide-ink/10">
        {jobs.slice(0, 8).map((job) => (
          <article className="grid gap-3 py-4 md:grid-cols-[1fr_auto]" key={job.id}>
            <div>
              <p className="font-medium">{job.title}</p>
              <p className="mt-1 text-sm text-ink/55">{job.companyName ?? job.sourceName ?? "Unknown source"} · {job.status}</p>
              <p className="mt-2 text-xs text-ink/55">Reliability {job.reliabilityScore} · Duplicate {job.duplicateScore} · Relevance {job.relevanceScore}</p>
            </div>
            <div className="flex items-center gap-2">
              <button aria-label="Approve" className="rounded border border-ink/15 p-2 hover:bg-paper" onClick={() => action(`/job-sources/discovered/${job.id}/approve`)} type="button"><Check size={16} /></button>
              <button aria-label="Snooze" className="rounded border border-ink/15 p-2 hover:bg-paper" onClick={() => action(`/job-sources/discovered/${job.id}/snooze`)} type="button"><Clock size={16} /></button>
              <button aria-label="Dismiss" className="rounded border border-ink/15 p-2 hover:bg-paper" onClick={() => action(`/job-sources/discovered/${job.id}/dismiss`)} type="button"><X size={16} /></button>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
