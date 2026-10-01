import Link from "next/link";
import { ArrowLeft, Download } from "lucide-react";
import { apiUrl, getAccountExportSummary } from "../../../lib/api";

export default async function ExportSettingsPage() {
  const bundle = await getAccountExportSummary().catch(() => null);

  return (
    <main className="min-h-screen bg-paper px-5 py-6 text-ink sm:px-8 lg:px-10">
      <div className="mx-auto max-w-4xl">
        <Link className="mb-6 inline-flex items-center gap-2 text-sm font-medium text-ink/65 hover:text-ink" href="/settings">
          <ArrowLeft size={16} />
          Settings
        </Link>
        <section className="mb-8 border-b border-ink/10 pb-6">
          <h1 className="text-3xl font-semibold">Data Export</h1>
          <p className="mt-2 max-w-2xl text-sm text-ink/60">Machine-readable account bundle for profile, jobs, applications, documents, tasks, and generated artifacts.</p>
        </section>
        {!bundle ? <p className="rounded border border-rust/20 bg-rust/10 p-4 text-sm text-rust">Export data is unavailable.</p> : null}
        {bundle ? (
          <section className="grid gap-5">
            <div className="grid gap-3 sm:grid-cols-3">
              <Metric label="Jobs" value={bundle.jobs.length} />
              <Metric label="Applications" value={bundle.applications.length} />
              <Metric label="Documents" value={bundle.documents.length} />
            </div>
            <a className="inline-flex w-fit items-center gap-2 rounded bg-ink px-4 py-2 text-sm font-semibold text-white" href={`${apiUrl}/account/export`}>
              <Download size={16} />
              Download JSON
            </a>
            <p className="text-xs text-ink/45">Format {bundle.formatVersion} generated {new Date(bundle.exportedAt).toLocaleString()}.</p>
          </section>
        ) : null}
      </div>
    </main>
  );
}

function Metric({ label, value }: { label: string; value: number }) {
  return (
    <article className="rounded border border-ink/10 bg-white p-4">
      <p className="text-sm text-ink/55">{label}</p>
      <p className="mt-2 text-2xl font-semibold">{value}</p>
    </article>
  );
}
