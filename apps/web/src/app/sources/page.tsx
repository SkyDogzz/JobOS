import Link from "next/link";
import type { ReactNode } from "react";
import { ArrowLeft, Building2, RadioTower, Users } from "lucide-react";
import { getCompanies, getContacts, getDiscoveredJobs, getJobSources } from "../../lib/api";
import { DiscoveredJobsPanel } from "./discovered-jobs-panel";
import { JobBoardParserForm } from "./job-board-parser-form";
import { SourceManagementForm } from "./source-management-form";

export default async function SourcesPage() {
  const [sources, companies, contacts, discoveredJobs] = await Promise.all([
    getJobSources().catch(() => []),
    getCompanies().catch(() => []),
    getContacts().catch(() => []),
    getDiscoveredJobs().catch(() => [])
  ]);

  return (
    <main className="min-h-screen bg-paper px-5 py-6 text-ink sm:px-8 lg:px-10">
      <div className="mx-auto max-w-6xl">
        <Link className="mb-6 inline-flex items-center gap-2 text-sm font-medium text-ink/65 hover:text-ink" href="/">
          <ArrowLeft size={16} />
          Dashboard
        </Link>
        <h1 className="mb-6 text-3xl font-semibold">Sources & Companies</h1>
        <JobBoardParserForm />
        <SourceManagementForm />
        <DiscoveredJobsPanel jobs={discoveredJobs} />
        <div className="mt-6 grid gap-5 lg:grid-cols-3">
          <Panel icon={<RadioTower size={18} />} title="Job Sources" items={sources.map((source) => [source.name, `${source.kind} · ${source.status}`])} />
          <Panel icon={<Building2 size={18} />} title="Companies" items={companies.map((company) => [company.name, company.website ?? "No website", `/companies/${company.id}`])} />
          <Panel icon={<Users size={18} />} title="Contacts" items={contacts.map((contact) => [contact.name, `${contact.title ?? "Contact"} · ${contact.companyName ?? "No company"}`])} />
        </div>
      </div>
    </main>
  );
}

function Panel({ icon, title, items }: { icon: ReactNode; title: string; items: string[][] }) {
  return (
    <section className="rounded border border-ink/10 bg-white p-5">
      <div className="mb-4 flex items-center gap-2">
        {icon}
        <h2 className="font-semibold">{title}</h2>
      </div>
      {items.length === 0 ? <p className="text-sm text-ink/55">Nothing saved yet.</p> : null}
      <div className="divide-y divide-ink/10">
        {items.map(([name, detail, href]) => (
          <article className="py-3" key={`${name}-${detail}`}>
            {href ? <Link className="font-medium hover:text-rust" href={href}>{name}</Link> : <p className="font-medium">{name}</p>}
            <p className="mt-1 text-sm text-ink/55">{detail}</p>
          </article>
        ))}
      </div>
    </section>
  );
}
