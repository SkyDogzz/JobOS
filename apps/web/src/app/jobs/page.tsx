import Link from "next/link";
import { ArrowLeft, BriefcaseBusiness } from "lucide-react";
import { getJobs } from "../../lib/api";

export default async function JobsPage() {
  const jobs = await getJobs().catch(() => []);

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
        {jobs.length === 0 ? <p className="rounded border border-dashed border-ink/20 bg-white p-5 text-sm text-ink/55">No saved jobs yet.</p> : null}
        <div className="grid gap-3">
          {jobs.map((job) => (
            <article className="rounded border border-ink/10 bg-white p-5" key={job.id}>
              <p className="text-lg font-semibold">{job.title}</p>
              <p className="mt-1 text-sm text-ink/60">{job.companyName ?? "No company"} · {job.location ?? "No location"}</p>
              <p className="mt-3 text-sm leading-6 text-ink/65">{job.description}</p>
            </article>
          ))}
        </div>
      </div>
    </main>
  );
}

