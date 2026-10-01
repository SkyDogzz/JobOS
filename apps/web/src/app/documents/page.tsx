import Link from "next/link";
import { ArrowLeft, FileText, Sparkles } from "lucide-react";
import { getAiArtifacts, getDocuments } from "../../lib/api";

export default async function DocumentsPage() {
  const [documents, artifacts] = await Promise.all([
    getDocuments().catch(() => []),
    getAiArtifacts().catch(() => [])
  ]);

  return (
    <main className="min-h-screen bg-paper px-5 py-6 text-ink sm:px-8 lg:px-10">
      <div className="mx-auto max-w-6xl">
        <Link className="mb-6 inline-flex items-center gap-2 text-sm font-medium text-ink/65 hover:text-ink" href="/">
          <ArrowLeft size={16} />
          Dashboard
        </Link>
        <div className="mb-6 flex items-center gap-2">
          <FileText size={20} />
          <h1 className="text-3xl font-semibold">Document Library</h1>
        </div>
        <div className="grid gap-5 lg:grid-cols-[1fr_24rem]">
          <section className="rounded border border-ink/10 bg-white p-5">
            <h2 className="mb-4 font-semibold">Approved Documents</h2>
            {documents.length === 0 ? <p className="rounded border border-dashed border-ink/20 bg-paper p-4 text-sm text-ink/55">No approved documents yet.</p> : null}
            <div className="divide-y divide-ink/10">
              {documents.map((document) => (
                <Link className="block py-4 hover:text-tide" href={`/documents/${document.id}`} key={document.id}>
                  <p className="font-semibold">{document.name}</p>
                  <p className="mt-1 text-sm text-ink/55">{document.kind} · {document.applicationId ?? "Unassigned"}</p>
                </Link>
              ))}
            </div>
          </section>
          <aside className="rounded border border-ink/10 bg-white p-5">
            <div className="mb-4 flex items-center gap-2">
              <Sparkles size={18} />
              <h2 className="font-semibold">Generated Artifacts</h2>
            </div>
            {artifacts.length === 0 ? <p className="text-sm text-ink/55">No generated artifacts yet.</p> : null}
            <div className="divide-y divide-ink/10">
              {artifacts.slice(0, 8).map((artifact) => (
                <article className="py-3 text-sm" key={artifact.id}>
                  <p className="font-medium">{artifact.purpose}</p>
                  <p className="mt-1 text-ink/55">{artifact.provider} · {artifact.model}</p>
                  <p className="mt-1 truncate text-xs text-ink/45">{artifact.promptHash}</p>
                </article>
              ))}
            </div>
          </aside>
        </div>
      </div>
    </main>
  );
}

