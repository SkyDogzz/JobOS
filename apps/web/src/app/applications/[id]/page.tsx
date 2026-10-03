import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, BriefcaseBusiness, FileText, History, Users } from "lucide-react";
import { getApplicationDetail, getApplicationInterviews, getApplicationNotes, getApplicationTasks, getAuditEvents } from "../../../lib/api";
import { InterviewsPanel } from "./interviews-panel";
import { NotesTasksPanel } from "./notes-tasks-panel";
import { OffersPanel } from "./offers-panel";
import { StageControls } from "./stage-controls";

export default async function ApplicationDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [application, notes, tasks, interviews, activity] = await Promise.all([
    getApplicationDetail(id).catch(() => null),
    getApplicationNotes(id).catch(() => []),
    getApplicationTasks(id).catch(() => []),
    getApplicationInterviews(id).catch(() => []),
    getAuditEvents(`?applicationId=${id}`).catch(() => [])
  ]);

  if (!application) {
    notFound();
  }

  return (
    <main className="min-h-screen bg-paper px-5 py-6 text-ink sm:px-8 lg:px-10">
      <div className="mx-auto max-w-5xl">
        <Link className="mb-6 inline-flex items-center gap-2 text-sm font-medium text-ink/65 hover:text-ink" href="/">
          <ArrowLeft size={16} />
          Dashboard
        </Link>

        <section className="border-b border-ink/10 pb-6">
          <p className="text-sm font-semibold uppercase tracking-wider text-rust">{application.stage}</p>
          <h1 className="mt-2 text-3xl font-semibold">{application.jobTitle}</h1>
          <p className="mt-2 text-ink/65">{application.companyName ?? "No company"} · {application.jobLocation ?? "No location"}</p>
        </section>

        <div className="mt-8 grid gap-4 lg:grid-cols-[1fr_320px]">
          <section className="rounded border border-ink/10 bg-white p-5">
            <div className="mb-4 flex items-center gap-2">
              <BriefcaseBusiness size={18} />
              <h2 className="font-semibold">Job Snapshot</h2>
            </div>
            <p className="whitespace-pre-wrap text-sm leading-6 text-ink/70">{application.jobDescription}</p>
          </section>

          <aside className="space-y-4">
            <section className="rounded border border-ink/10 bg-white p-5">
              <div className="mb-4 flex items-center gap-2">
                <FileText size={18} />
                <h2 className="font-semibold">Selected CV</h2>
              </div>
              <p className="text-sm text-ink/65">{application.resumeVersionId ?? "No CV version selected"}</p>
            </section>

            <section className="rounded border border-ink/10 bg-white p-5">
              <StageControls applicationId={application.id} initialStage={application.stage} />
            </section>

            <section className="rounded border border-ink/10 bg-white p-5">
              <div className="mb-4 flex items-center gap-2">
                <Users size={18} />
                <h2 className="font-semibold">Recruiters</h2>
              </div>
              {application.contacts.length === 0 ? <p className="text-sm text-ink/55">No contacts linked yet.</p> : null}
              <div className="divide-y divide-ink/10">
                {application.contacts.map((contact) => (
                  <article className="py-3 text-sm" key={contact.id}>
                    <p className="font-medium">{contact.name}</p>
                    <p className="mt-1 text-ink/55">{contact.relationship ?? "recruiter"} · {contact.email ?? contact.title ?? "No details"}</p>
                    {contact.followUpAt ? <p className="mt-1 text-xs text-rust">Follow up {new Date(contact.followUpAt).toLocaleDateString()}</p> : null}
                  </article>
                ))}
              </div>
            </section>

            <section className="rounded border border-ink/10 bg-white p-5">
              <h2 className="mb-4 font-semibold">ATS Findings</h2>
              {application.analyses.length === 0 ? <p className="text-sm text-ink/55">No ATS scan yet.</p> : null}
              {application.analyses.slice(-1).map((analysis) => (
                <pre className="overflow-auto rounded bg-paper p-3 text-xs" key={analysis.id}>{JSON.stringify({ scores: analysis.scores, findings: analysis.findings }, null, 2)}</pre>
              ))}
            </section>

          </aside>
        </div>

        <NotesTasksPanel applicationId={application.id} initialNotes={notes} initialTasks={tasks} />
        <OffersPanel applicationId={application.id} initialOffers={application.offers} />
        <InterviewsPanel applicationId={application.id} initialInterviews={interviews} />

        <section className="mt-4 rounded border border-ink/10 bg-white p-5">
          <div className="mb-4 flex items-center gap-2">
            <History size={18} />
            <h2 className="font-semibold">Timeline</h2>
          </div>
          {activity.length === 0 ? <p className="text-sm text-ink/55">No events yet.</p> : null}
          <div className="space-y-3">
            {activity.map((event) => (
              <article className="rounded border border-ink/10 bg-paper p-3 text-sm" key={event.id}>
                <p className="font-medium">{event.title}</p>
                <p className="mt-1 text-ink/55">{event.description}</p>
                <p className="mt-1 text-xs uppercase text-ink/40">{event.eventType.replaceAll("_", " ")} · {new Date(event.createdAt).toLocaleString()}</p>
              </article>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}
