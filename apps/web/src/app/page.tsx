import { BriefcaseBusiness, ChartNoAxesCombined, FileText, Search } from "lucide-react";
import { getDashboardData } from "../lib/api";

export const dynamic = "force-dynamic";

const navGroups = [
  ["Search", "Discover", "Saved Jobs", "Companies"],
  ["Applications", "Pipeline", "Applications", "Interviews", "Tasks"],
  ["Documents", "CVs", "Cover Letters", "Documents"],
  ["Tools", "ATS Scanner", "Job Matcher", "Interview Prep"],
  ["Network", "Companies", "Contacts"],
  ["Insights", "Analytics"]
];

export default async function DashboardPage() {
  const { jobs, applications, resumes, apiAvailable } = await getDashboardData();
  const activeApplications = applications.filter((application) => !["rejected", "withdrawn", "accepted"].includes(application.stage));
  const stages = ["saved", "applied", "interviewing"];
  const metrics = [
    ["Saved jobs", String(jobs.length)],
    ["Active applications", String(activeApplications.length)],
    ["Resume versions", String(resumes.filter((resume) => resume.versionId).length)],
    ["API status", apiAvailable ? "Live" : "Offline"]
  ];

  return (
    <main className="min-h-screen lg:grid lg:grid-cols-[280px_1fr]">
      <aside className="border-b border-ink/10 bg-white px-5 py-6 lg:min-h-screen lg:border-b-0 lg:border-r">
        <div className="mb-8 flex items-center gap-3">
          <div className="grid size-10 place-items-center rounded bg-ink text-white">
            <BriefcaseBusiness size={20} />
          </div>
          <div>
            <p className="text-lg font-semibold">JobOS</p>
            <p className="text-sm text-ink/60">Job search command center</p>
          </div>
        </div>
        <nav className="space-y-6">
          {navGroups.map(([group, ...items]) => (
            <section key={group}>
              <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-ink/45">{group}</p>
              <div className="grid gap-1">
                {items.map((item) => (
                  <a className="rounded px-3 py-2 text-sm font-medium text-ink/75 hover:bg-paper" href="#" key={item}>
                    {item}
                  </a>
                ))}
              </div>
            </section>
          ))}
        </nav>
      </aside>
      <section className="px-5 py-6 sm:px-8 lg:px-10">
        <div className="mb-8 flex flex-col gap-4 border-b border-ink/10 pb-6 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-3xl font-semibold">Dashboard</h1>
            <p className="mt-2 max-w-2xl text-ink/65">
              Track applications, documents, interviews, and follow-ups from one canonical record backed by Postgres.
            </p>
          </div>
          <button className="inline-flex h-10 items-center gap-2 rounded bg-rust px-4 text-sm font-semibold text-white">
            <Search size={16} />
            Discover jobs
          </button>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {metrics.map(([label, value]) => (
            <article className="rounded border border-ink/10 bg-white p-5" key={label}>
              <p className="text-sm text-ink/60">{label}</p>
              <p className="mt-3 text-3xl font-semibold">{value}</p>
            </article>
          ))}
        </div>
        <div className="mt-8 grid gap-4 xl:grid-cols-2">
          <section className="rounded border border-ink/10 bg-white p-5">
            <div className="mb-4 flex items-center gap-2">
              <FileText size={18} />
              <h2 className="font-semibold">Application Pipeline</h2>
            </div>
            <div className="grid grid-cols-3 gap-3 text-sm">
              {stages.map((stage) => (
                <div className="min-h-32 rounded border border-ink/10 bg-paper p-3" key={stage}>
                  <p className="mb-3 font-semibold capitalize">{stage}</p>
                  <div className="space-y-2">
                    {applications.filter((application) => application.stage === stage).slice(0, 3).map((application) => (
                      <div className="rounded bg-white p-2 text-xs shadow-sm" key={application.id}>
                        <p className="font-medium">{application.jobTitle}</p>
                        <p className="text-ink/55">{application.companyName ?? "No company"}</p>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </section>
          <section className="rounded border border-ink/10 bg-white p-5">
            <div className="mb-4 flex items-center gap-2">
              <ChartNoAxesCombined size={18} />
              <h2 className="font-semibold">Funnel Snapshot</h2>
            </div>
            <div className="space-y-3 text-sm text-ink/70">
              {[
                ["Jobs", jobs.length, "bg-tide/70"],
                ["Applications", applications.length, "bg-moss/70"],
                ["Resumes", resumes.length, "bg-rust/70"]
              ].map(([label, value, color]) => (
                <div key={label as string}>
                  <div className="mb-1 flex justify-between">
                    <span>{label}</span>
                    <span>{value}</span>
                  </div>
                  <div className={`h-3 rounded ${color as string}`} style={{ width: `${Math.max(Number(value) * 20, 8)}%` }} />
                </div>
              ))}
            </div>
          </section>
        </div>
      </section>
    </main>
  );
}
