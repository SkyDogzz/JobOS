import Link from "next/link";
import { ArrowLeft, ChartNoAxesCombined } from "lucide-react";
import { getFunnelAnalytics, getOperationsAnalytics, getSourcePerformanceAnalytics } from "../../lib/api";

export default async function AnalyticsPage() {
  const [funnel, sourcePerformance, operations] = await Promise.all([
    getFunnelAnalytics().catch(() => null),
    getSourcePerformanceAnalytics().catch(() => null),
    getOperationsAnalytics().catch(() => null)
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
            <ChartNoAxesCombined size={20} />
            <h1 className="text-3xl font-semibold">Analytics</h1>
          </div>
          <p className="mt-2 text-ink/65">Application funnel, source quality, follow-up discipline, and document outcomes.</p>
        </section>

        {!funnel ? <p className="rounded border border-rust/20 bg-rust/10 p-4 text-sm text-rust">Analytics API is unavailable.</p> : null}
        {funnel ? (
          <div className="grid gap-5">
            <section className="grid gap-4 md:grid-cols-4">
              <Metric label="Applications" value={funnel.totalApplications} />
              <Metric label="Active" value={funnel.activeApplications} />
              <Metric label="Closed" value={funnel.terminalApplications} />
              <Metric label="Oldest Active Days" value={funnel.aging.oldestActiveAgeDays} />
            </section>
            <section className="rounded border border-ink/10 bg-white p-5">
              <h2 className="mb-4 font-semibold">Application Funnel</h2>
              <div className="space-y-3">
                {funnel.stageCounts.map((item) => (
                  <div key={item.stage}>
                    <div className="mb-1 flex justify-between text-sm">
                      <span className="capitalize">{item.stage}</span>
                      <span>{item.count} · avg {item.averageAgeDays}d</span>
                    </div>
                    <div className="h-3 rounded bg-paper">
                      <div className="h-3 rounded bg-tide" style={{ width: `${Math.min(Math.max(item.count * 12, item.count ? 8 : 0), 100)}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </section>
            <section className="grid gap-5 lg:grid-cols-2">
              <div className="rounded border border-ink/10 bg-white p-5">
                <div className="mb-4 flex items-center justify-between gap-4">
                  <h2 className="font-semibold">Interview Outcomes</h2>
                  <span className="text-sm text-ink/55">{operations?.interviews.totalInterviews ?? 0} scheduled</span>
                </div>
                {!operations ? <p className="text-sm text-ink/60">No interview analytics yet.</p> : null}
                {operations ? (
                  <div className="grid gap-4">
                    <dl className="grid gap-3 text-sm sm:grid-cols-3">
                      <Rate label="Conversion" value={operations.interviews.interviewConversionRate} />
                      <Rate label="Offer" value={operations.interviews.offerConversionRate} />
                      <Rate label="Outcomes" value={operations.interviews.outcomeCaptureRate} />
                    </dl>
                    <div className="space-y-2">
                      {operations.interviews.outcomes.map((item) => (
                        <div key={item.outcome} className="flex justify-between rounded bg-paper px-3 py-2 text-sm">
                          <span className="capitalize">{item.outcome}</span>
                          <span className="font-medium">{item.count}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : null}
              </div>
              <div className="rounded border border-ink/10 bg-white p-5">
                <div className="mb-4 flex items-center justify-between gap-4">
                  <h2 className="font-semibold">Follow-up Discipline</h2>
                  <span className="text-sm text-ink/55">{operations?.tasks.openTasks ?? 0} open tasks</span>
                </div>
                {!operations ? <p className="text-sm text-ink/60">No task analytics yet.</p> : null}
                {operations ? (
                  <dl className="grid gap-3 text-sm sm:grid-cols-3">
                    <Rate label="Complete" value={operations.tasks.completionRate} />
                    <Rate label="On Time" value={operations.tasks.onTimeCompletionRate} />
                    <Rate label="Due Dates" value={operations.tasks.dueDateCoverageRate} />
                    <Rate label="Overdue" value={operations.tasks.overdueTasks} suffix="" />
                    <Rate label="Due Soon" value={operations.tasks.dueSoonTasks} suffix="" />
                    <Rate label="Upcoming" value={operations.tasks.upcomingTasks} suffix="" />
                  </dl>
                ) : null}
              </div>
            </section>
            <section className="rounded border border-ink/10 bg-white p-5">
              <div className="mb-4 flex items-center justify-between gap-4">
                <h2 className="font-semibold">Source Performance</h2>
                <span className="text-sm text-ink/55">{sourcePerformance?.totalSources ?? 0} ranked sources</span>
              </div>
              {!sourcePerformance?.sources.length ? <p className="text-sm text-ink/60">No source performance data yet.</p> : null}
              <div className="grid gap-3">
                {sourcePerformance?.sources.map((source) => (
                  <article key={source.sourceId ?? source.sourceName} className="rounded border border-ink/10 bg-paper p-4">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <h3 className="font-medium">{source.sourceName}</h3>
                        <p className="mt-1 text-sm text-ink/60">{source.qualityNote}</p>
                        {source.sourceNotes ? <p className="mt-1 text-sm text-ink/55">Notes: {source.sourceNotes}</p> : null}
                      </div>
                      <div className="text-right">
                        <p className="text-2xl font-semibold">{source.rankScore}</p>
                        <p className="text-xs uppercase tracking-wide text-ink/55">quality rank</p>
                      </div>
                    </div>
                    <dl className="mt-4 grid gap-2 text-sm sm:grid-cols-5">
                      <Rate label="Apps" value={source.applicationCount} suffix="" />
                      <Rate label="Response" value={source.responseRate} />
                      <Rate label="Interview" value={source.interviewRate} />
                      <Rate label="Offer" value={source.offerRate} />
                      <Rate label="Reject" value={source.rejectionRate} />
                    </dl>
                  </article>
                ))}
              </div>
            </section>
          </div>
        ) : null}
      </div>
    </main>
  );
}

function Rate({ label, value, suffix = "%" }: { label: string; value: number; suffix?: string }) {
  return (
    <div>
      <dt className="text-ink/55">{label}</dt>
      <dd className="font-medium">{value}{suffix}</dd>
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
