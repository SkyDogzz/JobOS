"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { Save, Search } from "lucide-react";
import { apiUrl, type CompanySummary, type JobSourceSummary } from "../../lib/api";

export function JobFilterForm({ companies, sources }: { companies: CompanySummary[]; sources: JobSourceSummary[] }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [message, setMessage] = useState("");

  function apply(formData: FormData) {
    const params = new URLSearchParams();
    for (const key of ["q", "companyId", "location", "remotePolicy", "salaryText", "sourceId", "stage"]) {
      const value = String(formData.get(key) ?? "").trim();
      if (value) params.set(key, value);
    }
    router.push(`/jobs${params.size ? `?${params.toString()}` : ""}`);
  }

  async function save(formData: FormData) {
    const filters: Record<string, string> = {};
    for (const key of ["q", "companyId", "location", "remotePolicy", "salaryText", "sourceId", "stage"]) {
      const value = String(formData.get(key) ?? "").trim();
      if (value) filters[key] = value;
    }
    const name = String(formData.get("filterName") ?? "").trim() || "Saved job filter";
    const response = await fetch(`${apiUrl}/jobs/filters`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, filters })
    });
    setMessage(response.ok ? "Filter saved." : "Could not save filter.");
  }

  return (
    <form className="mb-5 rounded border border-ink/10 bg-white p-4" action={apply}>
      <div className="grid gap-3 md:grid-cols-4">
        <input className="h-10 rounded border border-ink/15 px-3 text-sm" name="q" placeholder="Search jobs" defaultValue={searchParams.get("q") ?? ""} />
        <select className="h-10 rounded border border-ink/15 px-3 text-sm" name="companyId" defaultValue={searchParams.get("companyId") ?? ""}>
          <option value="">Any company</option>
          {companies.map((company) => <option key={company.id} value={company.id}>{company.name}</option>)}
        </select>
        <select className="h-10 rounded border border-ink/15 px-3 text-sm" name="sourceId" defaultValue={searchParams.get("sourceId") ?? ""}>
          <option value="">Any source</option>
          {sources.map((source) => <option key={source.id} value={source.id}>{source.name}</option>)}
        </select>
        <select className="h-10 rounded border border-ink/15 px-3 text-sm" name="stage" defaultValue={searchParams.get("stage") ?? ""}>
          <option value="">Any stage</option>
          {["wishlist", "saved", "applied", "screening", "interviewing", "offer", "rejected", "withdrawn", "accepted"].map((stage) => <option key={stage} value={stage}>{stage}</option>)}
        </select>
        <input className="h-10 rounded border border-ink/15 px-3 text-sm" name="location" placeholder="Location" defaultValue={searchParams.get("location") ?? ""} />
        <input className="h-10 rounded border border-ink/15 px-3 text-sm" name="remotePolicy" placeholder="Remote policy" defaultValue={searchParams.get("remotePolicy") ?? ""} />
        <input className="h-10 rounded border border-ink/15 px-3 text-sm" name="salaryText" placeholder="Salary" defaultValue={searchParams.get("salaryText") ?? ""} />
        <input className="h-10 rounded border border-ink/15 px-3 text-sm" name="filterName" placeholder="Filter name" />
      </div>
      <div className="mt-3 flex gap-2">
        <button className="inline-flex items-center gap-2 rounded bg-ink px-3 py-2 text-sm font-medium text-white"><Search size={15} />Apply</button>
        <button className="inline-flex items-center gap-2 rounded border border-ink/15 px-3 py-2 text-sm font-medium" formAction={save}><Save size={15} />Save filter</button>
      </div>
      {message ? <p className="mt-2 text-sm text-ink/60">{message}</p> : null}
    </form>
  );
}
