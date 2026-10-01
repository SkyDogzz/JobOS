import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, BriefcaseBusiness, Building2, Users } from "lucide-react";
import { getCompanyDetail } from "../../../lib/api";

export default async function CompanyDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const company = await getCompanyDetail(id).catch(() => null);
  if (!company) notFound();

  return (
    <main className="min-h-screen bg-paper px-5 py-6 text-ink sm:px-8 lg:px-10">
      <div className="mx-auto max-w-5xl">
        <Link className="mb-6 inline-flex items-center gap-2 text-sm font-medium text-ink/65 hover:text-ink" href="/sources">
          <ArrowLeft size={16} />
          Sources
        </Link>
        <section className="border-b border-ink/10 pb-6">
          <div className="mb-3 flex items-center gap-2">
            <Building2 size={20} />
            <h1 className="text-3xl font-semibold">{company.name}</h1>
          </div>
          <p className="text-ink/65">{company.website ?? "No website"}</p>
          {company.description ? <p className="mt-3 max-w-3xl text-sm leading-6 text-ink/65">{company.description}</p> : null}
        </section>

        <div className="mt-8 grid gap-5 lg:grid-cols-2">
          <section className="rounded border border-ink/10 bg-white p-5">
            <div className="mb-4 flex items-center gap-2">
              <Users size={18} />
              <h2 className="font-semibold">Contacts</h2>
            </div>
            {company.contacts.length === 0 ? <p className="text-sm text-ink/55">No contacts saved for this company.</p> : null}
            <div className="divide-y divide-ink/10">
              {company.contacts.map((contact) => (
                <article className="py-3 text-sm" key={contact.id}>
                  <p className="font-medium">{contact.name}</p>
                  <p className="mt-1 text-ink/55">{contact.title ?? "Contact"} · {contact.email ?? "No email"}</p>
                  {contact.followUpAt ? <p className="mt-1 text-xs text-rust">Follow up {new Date(contact.followUpAt).toLocaleDateString()}</p> : null}
                </article>
              ))}
            </div>
          </section>

          <section className="rounded border border-ink/10 bg-white p-5">
            <div className="mb-4 flex items-center gap-2">
              <BriefcaseBusiness size={18} />
              <h2 className="font-semibold">Jobs</h2>
            </div>
            {company.jobs.length === 0 ? <p className="text-sm text-ink/55">No jobs saved for this company.</p> : null}
            <div className="divide-y divide-ink/10">
              {company.jobs.map((job) => (
                <article className="py-3 text-sm" key={job.id}>
                  <Link className="font-medium hover:text-rust" href={`/jobs/${job.id}`}>{job.title}</Link>
                  <p className="mt-1 text-ink/55">{job.location ?? "No location"}</p>
                </article>
              ))}
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}
