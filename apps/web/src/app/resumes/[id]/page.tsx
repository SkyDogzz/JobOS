import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, FileText } from "lucide-react";
import { getResumeDetail } from "../../../lib/api";
import { ResumeVersionForm } from "./resume-version-form";
import { ResumeImportForm } from "./resume-import-form";

export default async function ResumeDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const resume = await getResumeDetail(id).catch(() => null);

  if (!resume) {
    notFound();
  }

  return (
    <main className="min-h-screen bg-paper px-5 py-6 text-ink sm:px-8 lg:px-10">
      <div className="mx-auto max-w-5xl">
        <Link className="mb-6 inline-flex items-center gap-2 text-sm font-medium text-ink/65 hover:text-ink" href="/resumes">
          <ArrowLeft size={16} />
          CVs
        </Link>
        <div className="mb-6 flex items-center gap-2">
          <FileText size={20} />
          <h1 className="text-3xl font-semibold">{resume.name}</h1>
        </div>

        <div className="grid gap-5 lg:grid-cols-[1fr_22rem]">
          <section className="rounded border border-ink/10 bg-white p-5">
            <div className="mb-4 flex items-center justify-between gap-3">
              <h2 className="font-semibold">Versions</h2>
              <span className="text-sm text-ink/55">{resume.versions.length} total</span>
            </div>
            {resume.versions.length === 0 ? <p className="rounded border border-dashed border-ink/20 bg-paper p-4 text-sm text-ink/55">No versions yet.</p> : null}
            <div className="divide-y divide-ink/10">
              {resume.versions.map((version) => {
                const linkedCount = resume.applications.filter((application) => application.resumeVersionId === version.id).length;

                return (
                  <article className="py-4" key={version.id}>
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                      <div>
                        <p className="font-semibold">v{version.versionNumber}: {version.title}</p>
                        <p className="mt-1 text-sm text-ink/55">{new Date(version.createdAt).toLocaleDateString()}</p>
                      </div>
                      <span className="rounded border border-ink/10 px-2 py-1 text-xs text-ink/60">
                        {linkedCount} linked application{linkedCount === 1 ? "" : "s"}
                      </span>
                    </div>
                    <pre className="mt-3 overflow-auto rounded bg-paper p-3 text-xs leading-5 text-ink/70">{JSON.stringify(version.content, null, 2)}</pre>
                  </article>
                );
              })}
            </div>
          </section>

          <div className="grid gap-5">
            <ResumeVersionForm resumeId={resume.id} />
            <ResumeImportForm resumeId={resume.id} />
            <section className="rounded border border-ink/10 bg-white p-5">
              <h2 className="mb-4 font-semibold">ATS & Matches</h2>
              {resume.analyses.length === 0 && resume.matches.length === 0 ? <p className="text-sm text-ink/55">No ATS scans or matches yet.</p> : null}
              {resume.analyses.slice(0, 3).map((analysis) => (
                <article className="border-t border-ink/10 py-3 text-sm" key={analysis.id}>
                  <p className="font-medium">ATS scan</p>
                  <pre className="mt-2 overflow-auto rounded bg-paper p-2 text-xs">{JSON.stringify(analysis.scores, null, 2)}</pre>
                </article>
              ))}
              {resume.matches.slice(0, 3).map((match) => (
                <article className="border-t border-ink/10 py-3 text-sm" key={match.id}>
                  <p className="font-medium">Match score {match.score}</p>
                  <pre className="mt-2 overflow-auto rounded bg-paper p-2 text-xs">{JSON.stringify(match.recommendations, null, 2)}</pre>
                </article>
              ))}
            </section>
            <section className="rounded border border-ink/10 bg-white p-5">
              <h2 className="mb-4 font-semibold">Applications Using This CV</h2>
              {resume.applications.length === 0 ? <p className="rounded border border-dashed border-ink/20 bg-paper p-3 text-sm text-ink/55">No applications linked yet.</p> : null}
              <div className="divide-y divide-ink/10">
                {resume.applications.map((application) => (
                  <Link className="block py-3 hover:text-tide" href={`/applications/${application.id}`} key={application.id}>
                    <p className="font-medium">{application.jobTitle}</p>
                    <p className="mt-1 text-sm text-ink/55">{application.companyName ?? "No company"} · {application.stage}</p>
                  </Link>
                ))}
              </div>
            </section>
          </div>
        </div>
      </div>
    </main>
  );
}
