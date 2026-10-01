import Link from "next/link";
import { ArrowLeft, Plug } from "lucide-react";
import { getEmailConnections, getEmailMessages, getEmailSyncJobs } from "../../../lib/api";
import { IntegrationsClient } from "./integrations-client";

export default async function IntegrationsPage() {
  const [connections, jobs, messages] = await Promise.all([
    getEmailConnections().catch(() => []),
    getEmailSyncJobs().catch(() => []),
    getEmailMessages().catch(() => [])
  ]);

  return (
    <main className="min-h-screen bg-paper px-5 py-6 text-ink sm:px-8 lg:px-10">
      <div className="mx-auto max-w-6xl">
        <Link className="mb-6 inline-flex items-center gap-2 text-sm font-medium text-ink/65 hover:text-ink" href="/">
          <ArrowLeft size={16} />
          Dashboard
        </Link>
        <section className="mb-8 border-b border-ink/10 pb-6">
          <div className="flex items-center gap-2">
            <Plug size={20} />
            <h1 className="text-3xl font-semibold">Integrations</h1>
          </div>
          <p className="mt-2 text-ink/65">Email sync placeholders, metadata retention, and application-message classification.</p>
        </section>
        <IntegrationsClient initialConnections={connections} initialJobs={jobs} initialMessages={messages} />
      </div>
    </main>
  );
}
