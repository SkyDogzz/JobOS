"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { CalendarClock, Inbox, Loader2, Play, Plus } from "lucide-react";
import type {
  CalendarConnectionSummary,
  CalendarEventSummary,
  CalendarSyncJobSummary,
  EmailConnectionSummary,
  EmailMessageSummary,
  EmailSyncJobSummary
} from "../../../lib/api";
import { apiUrl } from "../../../lib/api";

export function IntegrationsClient({
  initialCalendarConnections,
  initialCalendarEvents,
  initialCalendarJobs,
  initialConnections,
  initialJobs,
  initialMessages
}: {
  initialCalendarConnections: CalendarConnectionSummary[];
  initialCalendarEvents: CalendarEventSummary[];
  initialCalendarJobs: CalendarSyncJobSummary[];
  initialConnections: EmailConnectionSummary[];
  initialJobs: EmailSyncJobSummary[];
  initialMessages: EmailMessageSummary[];
}) {
  const router = useRouter();
  const [calendarConnections, setCalendarConnections] = useState(initialCalendarConnections);
  const [calendarJobs, setCalendarJobs] = useState(initialCalendarJobs);
  const [connections, setConnections] = useState(initialConnections);
  const [jobs, setJobs] = useState(initialJobs);
  const [messages, setMessages] = useState(initialMessages);
  const [message, setMessage] = useState("");
  const [pending, setPending] = useState<string | null>(null);
  const [isRefreshing, startRefresh] = useTransition();

  function refresh() {
    startRefresh(() => router.refresh());
  }

  async function createConnection(formData: FormData) {
    setPending("connection");
    setMessage("");
    try {
      const providerMessagesJson = String(formData.get("providerMessages") ?? "").trim();
      const providerMessages = providerMessagesJson ? JSON.parse(providerMessagesJson) : [];
      const response = await fetch(`${apiUrl}/integrations/email/connections`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          provider: String(formData.get("provider") ?? ""),
          accountEmail: String(formData.get("accountEmail") ?? ""),
          excludeBodies: formData.get("excludeBodies") === "on",
          syncState: { providerMessages }
        })
      });
      if (!response.ok) throw new Error("Could not save email connection.");
      const connection = await response.json() as EmailConnectionSummary;
      setConnections((current) => [connection, ...current]);
      setMessage("Email connection saved.");
      refresh();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Could not save email connection.");
    } finally {
      setPending(null);
    }
  }

  async function queueSync(connectionId: string) {
    setPending(connectionId);
    setMessage("");
    try {
      const response = await fetch(`${apiUrl}/integrations/email/sync-jobs`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ connectionId })
      });
      if (!response.ok) throw new Error("Could not queue sync.");
      const job = await response.json() as EmailSyncJobSummary;
      setJobs((current) => [job, ...current]);
      setMessage("Email sync completed.");
      refresh();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Could not queue sync.");
    } finally {
      setPending(null);
    }
  }

  async function classify(id: string, classification: string) {
    setPending(id);
    try {
      const response = await fetch(`${apiUrl}/integrations/email/messages/${id}/classification`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ classification, classificationReason: "Reviewed in settings." })
      });
      if (!response.ok) throw new Error("Could not classify message.");
      const updated = await response.json() as EmailMessageSummary;
      setMessages((current) => current.map((item) => item.id === id ? updated : item));
      setMessage("Message classification updated.");
      refresh();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Could not classify message.");
    } finally {
      setPending(null);
    }
  }

  async function createCalendarConnection(formData: FormData) {
    setPending("calendar-connection");
    setMessage("");
    try {
      const providerEventsJson = String(formData.get("providerEvents") ?? "").trim();
      const providerEvents = providerEventsJson ? JSON.parse(providerEventsJson) : [];
      const response = await fetch(`${apiUrl}/integrations/calendar/connections`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          provider: String(formData.get("provider") ?? ""),
          accountEmail: String(formData.get("accountEmail") ?? ""),
          calendarName: String(formData.get("calendarName") ?? ""),
          syncState: { providerEvents }
        })
      });
      if (!response.ok) throw new Error("Could not save calendar connection.");
      const connection = await response.json() as CalendarConnectionSummary;
      setCalendarConnections((current) => [connection, ...current]);
      setMessage("Calendar connection saved.");
      refresh();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Could not save calendar connection.");
    } finally {
      setPending(null);
    }
  }

  async function queueCalendarSync(connectionId: string) {
    setPending(`calendar-${connectionId}`);
    setMessage("");
    try {
      const response = await fetch(`${apiUrl}/integrations/calendar/sync-jobs`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ connectionId })
      });
      if (!response.ok) throw new Error("Could not queue calendar sync.");
      const job = await response.json() as CalendarSyncJobSummary;
      setCalendarJobs((current) => [job, ...current]);
      setMessage("Calendar sync completed.");
      refresh();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Could not queue calendar sync.");
    } finally {
      setPending(null);
    }
  }

  return (
    <div className="grid gap-5">
      <div className="grid gap-5 lg:grid-cols-[22rem_1fr]">
        <section className="rounded border border-ink/10 bg-white p-5">
          <div className="mb-4 flex items-center gap-2">
            <Inbox size={18} />
            <h2 className="font-semibold">Email Connection</h2>
          </div>
          <form action={createConnection} className="grid gap-3">
            <select className="h-10 rounded border border-ink/15 px-3 text-sm" name="provider" defaultValue="gmail">
              <option value="gmail">Gmail</option>
              <option value="outlook">Outlook</option>
              <option value="imap">IMAP</option>
            </select>
            <input className="h-10 rounded border border-ink/15 px-3 text-sm" name="accountEmail" placeholder="you@example.com" required type="email" />
            <label className="flex items-center gap-2 text-sm text-ink/70">
              <input defaultChecked name="excludeBodies" type="checkbox" />
              Exclude message bodies
            </label>
            <textarea
              className="min-h-32 rounded border border-ink/15 px-3 py-2 font-mono text-xs"
              name="providerMessages"
              placeholder='[{"providerMessageId":"msg-1","fromAddress":"recruiter@example.com","subject":"Interview invite","snippet":"Can you meet Tuesday?","receivedAt":"2026-10-05T12:00:00.000Z"}]'
            />
            <button className="inline-flex h-10 items-center justify-center gap-2 rounded bg-ink px-3 text-sm font-semibold text-white" disabled={pending === "connection"} type="submit">
              {pending === "connection" ? <Loader2 className="animate-spin" size={15} /> : <Plus size={15} />}
              Save
            </button>
          </form>
          {message || isRefreshing ? <p className="mt-3 text-xs text-ink/55">{isRefreshing ? "Refreshing." : message}</p> : null}
        </section>

        <section className="rounded border border-ink/10 bg-white p-5">
          <h2 className="mb-4 font-semibold">Email Sync</h2>
          {connections.length === 0 ? <p className="text-sm text-ink/55">No email connections yet.</p> : null}
          <div className="divide-y divide-ink/10">
            {connections.map((connection) => (
              <article className="flex items-center justify-between gap-3 py-3 text-sm" key={connection.id}>
                <div>
                  <p className="font-medium">{connection.provider} · {connection.accountEmail}</p>
                  <p className="mt-1 text-ink/55">
                    {connection.status} · bodies {connection.excludeBodies ? "excluded" : "stored"}
                    {connection.lastSyncedAt ? ` · synced ${new Date(connection.lastSyncedAt).toLocaleString()}` : ""}
                  </p>
                </div>
                <button className="inline-flex size-9 items-center justify-center rounded border border-ink/10 bg-paper" disabled={pending === connection.id} onClick={() => queueSync(connection.id)} type="button">
                  {pending === connection.id ? <Loader2 className="animate-spin" size={15} /> : <Play size={15} />}
                </button>
              </article>
            ))}
          </div>

          <div className="mt-6 border-t border-ink/10 pt-5">
            <h2 className="mb-4 font-semibold">Sync Jobs</h2>
            {jobs.length === 0 ? <p className="text-sm text-ink/55">No sync jobs queued yet.</p> : null}
            <div className="divide-y divide-ink/10">
              {jobs.slice(0, 5).map((job) => (
                <article className="py-3 text-sm" key={job.id}>
                  <p className="font-medium">{job.provider} · {job.status}</p>
                  <p className="mt-1 text-ink/55">{job.accountEmail} · {(job.finishedAt ?? job.startedAt) ? new Date(job.finishedAt ?? job.startedAt ?? job.createdAt).toLocaleString() : new Date(job.createdAt).toLocaleString()}</p>
                </article>
              ))}
            </div>
          </div>

          <div className="mt-6 border-t border-ink/10 pt-5">
            <h2 className="mb-4 font-semibold">Message Classification</h2>
            {messages.length === 0 ? <p className="text-sm text-ink/55">No messages imported yet.</p> : null}
            <div className="divide-y divide-ink/10">
              {messages.slice(0, 8).map((item) => (
                <article className="py-3 text-sm" key={item.id}>
                  <p className="font-medium">{item.subject ?? "No subject"}</p>
                  <p className="mt-1 text-ink/55">{item.fromAddress ?? "Unknown sender"} · {item.classification}</p>
                  <select className="mt-2 h-9 rounded border border-ink/15 bg-white px-2 text-xs" disabled={pending === item.id} onChange={(event) => classify(item.id, event.target.value)} value={item.classification}>
                    <option value="unclassified">Unclassified</option>
                    <option value="application_related">Application related</option>
                    <option value="recruiter">Recruiter</option>
                    <option value="interview">Interview</option>
                    <option value="offer">Offer</option>
                    <option value="rejection">Rejection</option>
                    <option value="other">Other</option>
                  </select>
                </article>
              ))}
            </div>
          </div>
        </section>
      </div>

      <div className="grid gap-5 lg:grid-cols-[22rem_1fr]">
        <section className="rounded border border-ink/10 bg-white p-5">
          <div className="mb-4 flex items-center gap-2">
            <CalendarClock size={18} />
            <h2 className="font-semibold">Calendar Connection</h2>
          </div>
          <form action={createCalendarConnection} className="grid gap-3">
            <select className="h-10 rounded border border-ink/15 px-3 text-sm" name="provider" defaultValue="google_calendar">
              <option value="google_calendar">Google Calendar</option>
              <option value="outlook_calendar">Outlook Calendar</option>
              <option value="ics">ICS Feed</option>
            </select>
            <input className="h-10 rounded border border-ink/15 px-3 text-sm" name="accountEmail" placeholder="you@example.com" required type="email" />
            <input className="h-10 rounded border border-ink/15 px-3 text-sm" name="calendarName" placeholder="Job search calendar" />
            <textarea
              className="min-h-32 rounded border border-ink/15 px-3 py-2 font-mono text-xs"
              name="providerEvents"
              placeholder='[{"providerEventId":"interview-1","title":"Recruiter screen","startsAt":"2026-10-05T16:00:00.000Z","endsAt":"2026-10-05T16:30:00.000Z"}]'
            />
            <button className="inline-flex h-10 items-center justify-center gap-2 rounded bg-ink px-3 text-sm font-semibold text-white" disabled={pending === "calendar-connection"} type="submit">
              {pending === "calendar-connection" ? <Loader2 className="animate-spin" size={15} /> : <Plus size={15} />}
              Save
            </button>
          </form>
        </section>

        <section className="rounded border border-ink/10 bg-white p-5">
          <h2 className="mb-4 font-semibold">Calendar Sync</h2>
          {calendarConnections.length === 0 ? <p className="text-sm text-ink/55">No calendar connections yet.</p> : null}
          <div className="divide-y divide-ink/10">
            {calendarConnections.map((connection) => (
              <article className="flex items-center justify-between gap-3 py-3 text-sm" key={connection.id}>
                <div>
                  <p className="font-medium">{connection.provider} · {connection.accountEmail}</p>
                  <p className="mt-1 text-ink/55">{connection.calendarName ?? "Default calendar"} · {connection.status}</p>
                </div>
                <button className="inline-flex size-9 items-center justify-center rounded border border-ink/10 bg-paper" disabled={pending === `calendar-${connection.id}`} onClick={() => queueCalendarSync(connection.id)} type="button">
                  {pending === `calendar-${connection.id}` ? <Loader2 className="animate-spin" size={15} /> : <Play size={15} />}
                </button>
              </article>
            ))}
          </div>

          <div className="mt-6 border-t border-ink/10 pt-5">
            <h2 className="mb-4 font-semibold">Calendar Events</h2>
            {initialCalendarEvents.length === 0 ? <p className="text-sm text-ink/55">No calendar events linked yet.</p> : null}
            <div className="divide-y divide-ink/10">
              {initialCalendarEvents.slice(0, 8).map((event) => (
                <article className="py-3 text-sm" key={event.id}>
                  <p className="font-medium">{event.title} · {event.status}</p>
                  <p className="mt-1 text-ink/55">{new Date(event.startsAt).toLocaleString()} · {event.conflictStatus}</p>
                </article>
              ))}
            </div>
          </div>

          <div className="mt-6 border-t border-ink/10 pt-5">
            <h2 className="mb-4 font-semibold">Calendar Jobs</h2>
            {calendarJobs.length === 0 ? <p className="text-sm text-ink/55">No calendar sync jobs queued yet.</p> : null}
            <div className="divide-y divide-ink/10">
              {calendarJobs.slice(0, 5).map((job) => (
                <article className="py-3 text-sm" key={job.id}>
                  <p className="font-medium">{job.provider} · {job.status}</p>
                  <p className="mt-1 text-ink/55">{job.accountEmail} · {new Date(job.createdAt).toLocaleString()}</p>
                </article>
              ))}
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
