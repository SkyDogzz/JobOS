"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { BriefcaseBusiness, ChartNoAxesCombined, CheckCircle2, FileText, Loader2, Plus, Search, XCircle } from "lucide-react";
import type { DashboardApplication, DashboardData, DashboardJob, DashboardResume } from "../lib/api";

const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

const navGroups = [
  ["Search", "Discover", "Saved Jobs", "Companies"],
  ["Applications", "Pipeline", "Applications", "Interviews", "Tasks"],
  ["Documents", "CVs", "Cover Letters", "Documents"],
  ["Tools", "ATS Scanner", "Job Matcher", "Interview Prep"],
  ["Network", "Companies", "Contacts"],
  ["Insights", "Analytics"]
];

const stages = ["saved", "applied", "interviewing"] as const;

interface DashboardClientProps {
  initialData: DashboardData;
}

interface SubmitState {
  status: "idle" | "success" | "error";
  message: string;
}

export function DashboardClient({ initialData }: DashboardClientProps) {
  const router = useRouter();
  const [jobs, setJobs] = useState(initialData.jobs);
  const [applications, setApplications] = useState(initialData.applications);
  const [resumes, setResumes] = useState(initialData.resumes);
  const [apiAvailable, setApiAvailable] = useState(initialData.apiAvailable);
  const [submitState, setSubmitState] = useState<SubmitState>({ status: "idle", message: "" });
  const [pendingForm, setPendingForm] = useState<"job" | "resume" | "application" | null>(null);
  const [isRefreshing, startRefresh] = useTransition();

  const activeApplications = applications.filter((application) => !["rejected", "withdrawn", "accepted"].includes(application.stage));
  const metrics = [
    ["Saved jobs", String(jobs.length)],
    ["Active applications", String(activeApplications.length)],
    ["Resume versions", String(resumes.filter((resume) => resume.versionId).length)],
    ["API status", apiAvailable ? "Live" : "Offline"]
  ];

  const latestResumeVersions = useMemo(
    () => resumes.filter((resume) => resume.versionId),
    [resumes]
  );

  async function submitJson<T>(path: string, payload: Record<string, unknown>): Promise<T> {
    const response = await fetch(`${apiUrl}${path}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      const body = await response.json().catch(() => null) as { message?: string } | null;
      throw new Error(body?.message ?? `Request failed: ${path}`);
    }

    return response.json() as Promise<T>;
  }

  function refreshServerSnapshot() {
    startRefresh(() => {
      router.refresh();
    });
  }

  async function handleJobSubmit(formData: FormData) {
    setPendingForm("job");
    setSubmitState({ status: "idle", message: "" });

    try {
      const job = await submitJson<DashboardJob>("/jobs", {
        title: String(formData.get("title") ?? ""),
        companyName: String(formData.get("companyName") ?? ""),
        description: String(formData.get("description") ?? ""),
        location: String(formData.get("location") ?? ""),
        sourceName: "manual"
      });

      setJobs((current) => [...current, job]);
      setApiAvailable(true);
      setSubmitState({ status: "success", message: "Job saved." });
      refreshServerSnapshot();
    } catch (error) {
      setApiAvailable(false);
      setSubmitState({ status: "error", message: error instanceof Error ? error.message : "Could not save job." });
    } finally {
      setPendingForm(null);
    }
  }

  async function handleResumeSubmit(formData: FormData) {
    setPendingForm("resume");
    setSubmitState({ status: "idle", message: "" });

    try {
      const resume = await submitJson<{ id: string; name: string; currentVersion: { id: string; title: string } }>("/resumes", {
        name: String(formData.get("name") ?? ""),
        title: String(formData.get("title") ?? ""),
        content: {
          summary: String(formData.get("summary") ?? "")
        }
      });

      setResumes((current) => [
        ...current,
        {
          id: resume.id,
          name: resume.name,
          versionId: resume.currentVersion.id,
          versionTitle: resume.currentVersion.title
        }
      ]);
      setApiAvailable(true);
      setSubmitState({ status: "success", message: "Resume version created." });
      refreshServerSnapshot();
    } catch (error) {
      setApiAvailable(false);
      setSubmitState({ status: "error", message: error instanceof Error ? error.message : "Could not create resume." });
    } finally {
      setPendingForm(null);
    }
  }

  async function handleApplicationSubmit(formData: FormData) {
    setPendingForm("application");
    setSubmitState({ status: "idle", message: "" });

    try {
      const jobId = String(formData.get("jobId") ?? "");
      const resumeVersionId = String(formData.get("resumeVersionId") ?? "");
      const application = await submitJson<{ id: string; stage: string; jobId: string; resumeVersionId: string | null }>("/applications", {
        jobId,
        resumeVersionId: resumeVersionId || undefined,
        stage: String(formData.get("stage") ?? "saved")
      });
      const job = jobs.find((item) => item.id === application.jobId);

      setApplications((current) => [
        ...current,
        {
          id: application.id,
          stage: application.stage,
          jobTitle: job?.title ?? "Unknown job",
          companyName: job?.companyName ?? null
        }
      ]);
      setApiAvailable(true);
      setSubmitState({ status: "success", message: "Application added to pipeline." });
      refreshServerSnapshot();
    } catch (error) {
      setApiAvailable(false);
      setSubmitState({ status: "error", message: error instanceof Error ? error.message : "Could not create application." });
    } finally {
      setPendingForm(null);
    }
  }

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

        <StatusBanner apiAvailable={apiAvailable} isRefreshing={isRefreshing} submitState={submitState} />

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {metrics.map(([label, value]) => (
            <article className="rounded border border-ink/10 bg-white p-5" key={label}>
              <p className="text-sm text-ink/60">{label}</p>
              <p className="mt-3 text-3xl font-semibold">{value}</p>
            </article>
          ))}
        </div>

        <div className="mt-8 grid gap-4 xl:grid-cols-3">
          <CreateJobForm isPending={pendingForm === "job"} onSubmit={handleJobSubmit} />
          <CreateResumeForm isPending={pendingForm === "resume"} onSubmit={handleResumeSubmit} />
          <CreateApplicationForm
            isPending={pendingForm === "application"}
            jobs={jobs}
            resumes={latestResumeVersions}
            onSubmit={handleApplicationSubmit}
          />
        </div>

        <div className="mt-8 grid gap-4 xl:grid-cols-2">
          <Pipeline applications={applications} />
          <Funnel jobs={jobs} applications={applications} resumes={resumes} />
        </div>
      </section>
    </main>
  );
}

function StatusBanner({ apiAvailable, isRefreshing, submitState }: { apiAvailable: boolean; isRefreshing: boolean; submitState: SubmitState }) {
  if (submitState.status === "success") {
    return (
      <div className="mb-4 flex items-center gap-2 rounded border border-moss/30 bg-moss/10 px-4 py-3 text-sm text-moss">
        <CheckCircle2 size={16} />
        {submitState.message}
      </div>
    );
  }

  if (submitState.status === "error" || !apiAvailable) {
    return (
      <div className="mb-4 flex items-center gap-2 rounded border border-rust/30 bg-rust/10 px-4 py-3 text-sm text-rust">
        <XCircle size={16} />
        {submitState.message || "API is offline. Forms are disabled until the backend is reachable."}
      </div>
    );
  }

  if (isRefreshing) {
    return (
      <div className="mb-4 flex items-center gap-2 rounded border border-tide/30 bg-tide/10 px-4 py-3 text-sm text-tide">
        <Loader2 className="animate-spin" size={16} />
        Refreshing dashboard data.
      </div>
    );
  }

  return null;
}

function CreateJobForm({ isPending, onSubmit }: { isPending: boolean; onSubmit: (formData: FormData) => void }) {
  return (
    <form action={onSubmit} className="rounded border border-ink/10 bg-white p-5">
      <FormTitle title="Save Job" />
      <Input label="Title" name="title" placeholder="Backend Engineer" required />
      <Input label="Company" name="companyName" placeholder="Acme" required />
      <Input label="Location" name="location" placeholder="Remote" />
      <Textarea label="Description" name="description" placeholder="Paste the role summary or requirements" required />
      <SubmitButton isPending={isPending} label="Save job" />
    </form>
  );
}

function CreateResumeForm({ isPending, onSubmit }: { isPending: boolean; onSubmit: (formData: FormData) => void }) {
  return (
    <form action={onSubmit} className="rounded border border-ink/10 bg-white p-5">
      <FormTitle title="Create CV" />
      <Input label="Name" name="name" placeholder="Master CV" required />
      <Input label="Version title" name="title" placeholder="Master CV v1" />
      <Textarea label="Summary" name="summary" placeholder="Short canonical summary for this version" />
      <SubmitButton isPending={isPending} label="Create CV" />
    </form>
  );
}

function CreateApplicationForm({
  isPending,
  jobs,
  resumes,
  onSubmit
}: {
  isPending: boolean;
  jobs: DashboardJob[];
  resumes: DashboardResume[];
  onSubmit: (formData: FormData) => void;
}) {
  const disabled = jobs.length === 0;

  return (
    <form action={onSubmit} className="rounded border border-ink/10 bg-white p-5">
      <FormTitle title="Add Application" />
      <label className="mb-3 block text-sm">
        <span className="mb-1 block font-medium text-ink/70">Job</span>
        <select className="h-10 w-full rounded border border-ink/15 bg-white px-3" disabled={disabled} name="jobId" required>
          <option value="">Select job</option>
          {jobs.map((job) => (
            <option key={job.id} value={job.id}>{job.title} · {job.companyName ?? "No company"}</option>
          ))}
        </select>
      </label>
      <label className="mb-3 block text-sm">
        <span className="mb-1 block font-medium text-ink/70">CV version</span>
        <select className="h-10 w-full rounded border border-ink/15 bg-white px-3" name="resumeVersionId">
          <option value="">No CV selected</option>
          {resumes.map((resume) => (
            <option key={resume.versionId ?? resume.id} value={resume.versionId ?? ""}>{resume.name} · {resume.versionTitle ?? "version"}</option>
          ))}
        </select>
      </label>
      <label className="mb-3 block text-sm">
        <span className="mb-1 block font-medium text-ink/70">Stage</span>
        <select className="h-10 w-full rounded border border-ink/15 bg-white px-3" name="stage" defaultValue="saved">
          <option value="saved">Saved</option>
          <option value="applied">Applied</option>
          <option value="interviewing">Interviewing</option>
        </select>
      </label>
      {disabled ? <p className="mb-3 text-sm text-ink/55">Save a job before creating an application.</p> : null}
      <SubmitButton disabled={disabled} isPending={isPending} label="Add application" />
    </form>
  );
}

function Pipeline({ applications }: { applications: DashboardApplication[] }) {
  return (
    <section className="rounded border border-ink/10 bg-white p-5">
      <div className="mb-4 flex items-center gap-2">
        <FileText size={18} />
        <h2 className="font-semibold">Application Pipeline</h2>
      </div>
      {applications.length === 0 ? <EmptyState text="No applications yet." /> : null}
      <div className="grid grid-cols-3 gap-3 text-sm">
        {stages.map((stage) => (
          <div className="min-h-32 rounded border border-ink/10 bg-paper p-3" key={stage}>
            <p className="mb-3 font-semibold capitalize">{stage}</p>
            <div className="space-y-2">
              {applications.filter((application) => application.stage === stage).slice(0, 4).map((application) => (
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
  );
}

function Funnel({ jobs, applications, resumes }: { jobs: DashboardJob[]; applications: DashboardApplication[]; resumes: DashboardResume[] }) {
  return (
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
            <div className={`h-3 rounded ${color as string}`} style={{ width: `${Math.min(Math.max(Number(value) * 20, 8), 100)}%` }} />
          </div>
        ))}
      </div>
    </section>
  );
}

function FormTitle({ title }: { title: string }) {
  return (
    <div className="mb-4 flex items-center gap-2">
      <Plus size={16} />
      <h2 className="font-semibold">{title}</h2>
    </div>
  );
}

function Input({ label, name, placeholder, required }: { label: string; name: string; placeholder: string; required?: boolean }) {
  return (
    <label className="mb-3 block text-sm">
      <span className="mb-1 block font-medium text-ink/70">{label}</span>
      <input className="h-10 w-full rounded border border-ink/15 px-3" name={name} placeholder={placeholder} required={required} />
    </label>
  );
}

function Textarea({ label, name, placeholder, required }: { label: string; name: string; placeholder: string; required?: boolean }) {
  return (
    <label className="mb-3 block text-sm">
      <span className="mb-1 block font-medium text-ink/70">{label}</span>
      <textarea className="min-h-24 w-full rounded border border-ink/15 px-3 py-2" name={name} placeholder={placeholder} required={required} />
    </label>
  );
}

function SubmitButton({ disabled, isPending, label }: { disabled?: boolean; isPending: boolean; label: string }) {
  return (
    <button
      className="inline-flex h-10 w-full items-center justify-center gap-2 rounded bg-ink px-4 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:bg-ink/35"
      disabled={disabled || isPending}
      type="submit"
    >
      {isPending ? <Loader2 className="animate-spin" size={16} /> : <Plus size={16} />}
      {isPending ? "Saving" : label}
    </button>
  );
}

function EmptyState({ text }: { text: string }) {
  return <p className="mb-4 rounded border border-dashed border-ink/20 bg-paper p-3 text-sm text-ink/55">{text}</p>;
}
