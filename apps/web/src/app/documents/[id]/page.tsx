import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Download, FileText } from "lucide-react";
import { getDocumentDetail, getDocumentExport } from "../../../lib/api";

export default async function DocumentDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [document, preview] = await Promise.all([
    getDocumentDetail(id).catch(() => null),
    getDocumentExport(id, "markdown").catch(() => null)
  ]);
  if (!document) notFound();

  const metadata = typeof document.content.metadata === "object" && document.content.metadata ? document.content.metadata : {};

  return (
    <main className="min-h-screen bg-paper px-5 py-6 text-ink sm:px-8 lg:px-10">
      <div className="mx-auto max-w-4xl">
        <Link className="mb-6 inline-flex items-center gap-2 text-sm font-medium text-ink/65 hover:text-ink" href="/documents">
          <ArrowLeft size={16} />
          Documents
        </Link>
        <section className="rounded border border-ink/10 bg-white p-5">
          <div className="mb-4 flex items-center gap-2">
            <FileText size={20} />
            <h1 className="text-2xl font-semibold">{document.name}</h1>
          </div>
          <p className="text-sm text-ink/55">{document.kind} · {document.applicationId ?? "Unassigned"}</p>
          <div className="mt-4 flex flex-wrap gap-2">
            {(["markdown", "pdf", "docx"] as const).map((format) => (
              <a className="inline-flex items-center gap-2 rounded border border-ink/15 px-3 py-2 text-sm font-medium hover:bg-paper" href={`${process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000"}/documents/${document.id}/export?format=${format}`} key={format}>
                <Download size={15} />
                {format.toUpperCase()}
              </a>
            ))}
          </div>
          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            <div>
              <h2 className="mb-2 font-semibold">Metadata</h2>
              <pre className="overflow-auto rounded bg-paper p-3 text-xs">{JSON.stringify(metadata, null, 2)}</pre>
            </div>
            <div>
              <h2 className="mb-2 font-semibold">Preview</h2>
              <pre className="max-h-96 overflow-auto rounded bg-paper p-3 text-xs">{preview?.content ?? JSON.stringify(document.content, null, 2)}</pre>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
