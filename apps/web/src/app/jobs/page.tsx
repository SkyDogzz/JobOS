import Link from "next/link";
import { ArrowLeft, BriefcaseBusiness } from "lucide-react";
import { getCompanies, getJobs, getJobSources, getSavedJobFilters } from "../../lib/api";
import { JobFilterForm } from "./job-filter-form";

export default async function JobsPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const params = await searchParams;
  const query = new URLSearchParams(Object.entries(params).flatMap(([key, value]) => typeof value === "string" ? [[key, value]] : [])).toString();
  const [jobs, companies, sources, filters] = await Promise.all([
    getJobs(query ? `?${query}` : "").catch(() => []),
    getCompanies().catch(() => []),
    getJobSources().catch(() => []),
    getSavedJobFilters().catch(() => [])
  ]);

  return (
    <main className="min-h-screen bg-paper px-5 py-6 text-ink sm:px-8 lg:px-10">
      <div className="mx-auto max-w-5xl">
        <Link className="mb-6 inline-flex items-center gap-2 text-sm font-medium text-ink/65 hover:text-ink" href="/">
          <ArrowLeft size={16} />
          Dashboard
        </Link>
        <div className="mb-6 flex items-center gap-2">
          <BriefcaseBusiness size={20} />
          <h1 className="text-3xl font-semibold">Saved Jobs</h1>
        </div>
        <JobFilterForm companies={companies} sources={sources} />
        {filters.length > 0 ? (
          <div className="mb-5 flex flex-wrap gap-2">
            {filters.map((filter) => (
              <Link className="rounded border border-ink/15 bg-white px-3 py-2 text-sm hover:text-tide" href={`/jobs?${new URLSearchParams(filter.filters as Record<string, string>).toString()}`} key={filter.id}>{filter.name}</Link>
            ))}
          </div>
        ) : null}
        {jobs.length === 0 ? <p className="rounded border border-dashed border-ink/20 bg-white p-5 text-sm text-ink/55">No saved jobs yet.</p> : null}
        <div className="grid gap-3">
          {jobs.map((job) => (
            <article className="rounded border border-ink/10 bg-white p-5" key={job.id}>
              <Link className="text-lg font-semibold hover:text-tide" href={`/jobs/${job.id}`}>{job.title}</Link>
              <p className="mt-1 text-sm text-ink/60">{job.companyName ?? "No company"} · {job.location ?? "No location"}</p>
              <p className="mt-3 text-sm leading-6 text-ink/65">{job.description}</p>
            </article>
          ))}
        </div>
      </div>
    </main>
  );
}
