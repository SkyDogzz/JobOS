import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, BriefcaseBusiness, Users } from "lucide-react";
import { getJobDetail } from "../../../lib/api";

export default async function JobDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const job = await getJobDetail(id).catch(() => null);
  if (!job) notFound();

  return (
    <main className="min-h-screen bg-paper px-5 py-6 text-ink sm:px-8 lg:px-10">
      <div className="mx-auto max-w-5xl">
        <Link className="mb-6 inline-flex items-center gap-2 text-sm font-medium text-ink/65 hover:text-ink" href="/jobs">
          <ArrowLeft size={16} />
          Jobs
        </Link>
        <section className="border-b border-ink/10 pb-6">
          <div className="mb-3 flex items-center gap-2">
            <BriefcaseBusiness size={20} />
            <h1 className="text-3xl font-semibold">{job.title}</h1>
          </div>
          <p className="text-ink/65">{job.companyName ?? "No company"} · {job.location ?? "No location"}</p>
        </section>
        <div className="mt-8 grid gap-5 lg:grid-cols-[1fr_22rem]">
          <section className="rounded border border-ink/10 bg-white p-5">
            <h2 className="mb-4 font-semibold">Description</h2>
            <p className="whitespace-pre-wrap text-sm leading-6 text-ink/70">{job.description}</p>
          </section>
          <aside className="rounded border border-ink/10 bg-white p-5">
            <h2 className="mb-4 font-semibold">Best CV Suggestions</h2>
            {job.matches.length === 0 ? <p className="text-sm text-ink/55">Run matching to see suggestions.</p> : null}
            <div className="divide-y divide-ink/10">
              {job.matches.slice(0, 5).map((match) => (
                <article className="py-3" key={match.id}>
                  <p className="font-medium">{match.resumeName ?? "CV"} · {match.score}</p>
                  <p className="mt-1 text-sm text-ink/55">{match.resumeTitle ?? match.resumeVersionId}</p>
                </article>
              ))}
            </div>
            <div className="mt-6 border-t border-ink/10 pt-5">
              <div className="mb-3 flex items-center gap-2">
                <Users size={17} />
                <h2 className="font-semibold">Company Contacts</h2>
              </div>
              {job.contacts.length === 0 ? <p className="text-sm text-ink/55">No contacts linked to this company.</p> : null}
              <div className="divide-y divide-ink/10">
                {job.contacts.map((contact) => (
                  <article className="py-3 text-sm" key={contact.id}>
                    <p className="font-medium">{contact.name}</p>
                    <p className="mt-1 text-ink/55">{contact.title ?? "Contact"} · {contact.email ?? "No email"}</p>
                    {contact.followUpAt ? <p className="mt-1 text-xs text-rust">Follow up {new Date(contact.followUpAt).toLocaleDateString()}</p> : null}
                  </article>
                ))}
              </div>
            </div>
          </aside>
        </div>
      </div>
    </main>
  );
}
