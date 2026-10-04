import Link from "next/link";
import { ArrowLeft, ServerCog, ShieldCheck } from "lucide-react";
import { getAdminAudit, getAdminFailedJobs, getAdminSyncHealth, getAdminUsers, getBackgroundJobs } from "../../lib/api";

export default async function OperationsPage() {
  const jobs = await getBackgroundJobs().catch(() => []);
  const failures = jobs.filter((job) => ["failed", "dead_lettered"].includes(job.status));
  const [adminUsers, adminAudit, adminFailures, syncHealth] = await Promise.all([
    getAdminUsers().catch(() => []),
    getAdminAudit().catch(() => []),
    getAdminFailedJobs().catch(() => []),
    getAdminSyncHealth().catch(() => null)
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
            <ServerCog size={20} />
            <h1 className="text-3xl font-semibold">Operations</h1>
          </div>
          <p className="mt-2 text-ink/65">Recent background jobs, retries, idempotency keys, and dead-letter status.</p>
        </section>

        <section className="grid gap-4 sm:grid-cols-3">
          <Metric label="Jobs" value={jobs.length} />
          <Metric label="Failures" value={failures.length} />
          <Metric label="Queued" value={jobs.filter((job) => job.status === "queued").length} />
        </section>

        <section className="mt-6 rounded border border-ink/10 bg-white p-5">
          <h2 className="mb-4 font-semibold">Background Jobs</h2>
          {jobs.length === 0 ? <p className="text-sm text-ink/55">No background jobs recorded yet.</p> : null}
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] text-left text-sm">
              <thead className="border-b border-ink/10 text-ink/55">
                <tr>
                  <th className="py-2 pr-4">Queue</th>
                  <th className="py-2 pr-4">Job</th>
                  <th className="py-2 pr-4">Status</th>
                  <th className="py-2 pr-4">Attempts</th>
                  <th className="py-2 pr-4">Idempotency</th>
                  <th className="py-2">Updated</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-ink/10">
                {jobs.map((job) => (
                  <tr key={job.id}>
                    <td className="py-3 pr-4 font-medium">{job.queueName}</td>
                    <td className="py-3 pr-4">{job.jobName}</td>
                    <td className="py-3 pr-4">{job.status}</td>
                    <td className="py-3 pr-4">{job.attempts}/{job.maxAttempts}</td>
                    <td className="py-3 pr-4 text-ink/55">{job.idempotencyKey}</td>
                    <td className="py-3">{new Date(job.finishedAt ?? job.createdAt).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className="mt-6 rounded border border-ink/10 bg-white p-5">
          <div className="mb-4 flex items-center gap-2">
            <ShieldCheck size={18} />
            <h2 className="font-semibold">Admin Support</h2>
          </div>
          {adminUsers.length === 0 && adminAudit.length === 0 && adminFailures.length === 0 && !syncHealth ? (
            <p className="text-sm text-ink/55">Admin support token is not configured for this runtime.</p>
          ) : (
            <div className="grid gap-5 lg:grid-cols-2">
              <AdminList title="User lookup" rows={adminUsers.map((user) => `${user.email} ${user.name ?? ""}`)} />
              <AdminList title="Audit trail" rows={adminAudit.map((event) => `${event.kind} ${event.jobTitle}`)} />
              <AdminList title="Failed jobs" rows={adminFailures.map((job) => `${job.queueName}/${job.jobName} ${job.status}`)} />
              <AdminList title="Sync health" rows={[`Email sync jobs: ${syncHealth?.email.length ?? 0}`, `Calendar sync jobs: ${syncHealth?.calendar.length ?? 0}`]} />
            </div>
          )}
        </section>
      </div>
    </main>
  );
}

function AdminList({ title, rows }: { title: string; rows: string[] }) {
  return (
    <div className="rounded border border-ink/10 p-4">
      <h3 className="mb-3 text-sm font-semibold">{title}</h3>
      {rows.length === 0 ? <p className="text-sm text-ink/55">No records.</p> : null}
      <ul className="space-y-2 text-sm text-ink/70">
        {rows.slice(0, 6).map((row, index) => <li key={`${title}-${index}`}>{row}</li>)}
      </ul>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: number }) {
  return (
    <article className="rounded border border-ink/10 bg-white p-5">
      <p className="text-sm text-ink/60">{label}</p>
      <p className="mt-3 text-3xl font-semibold">{value}</p>
    </article>
  );
}
