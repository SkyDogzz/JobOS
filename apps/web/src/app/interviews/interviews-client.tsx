"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { CalendarClock, Loader2, Plus } from "lucide-react";
import type { ApplicationInterview, DashboardApplication } from "../../lib/api";

const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

export function InterviewsClient({
  initialApplications,
  initialInterviews
}: {
  initialApplications: DashboardApplication[];
  initialInterviews: ApplicationInterview[];
}) {
  const router = useRouter();
  const [interviews, setInterviews] = useState(initialInterviews);
  const [message, setMessage] = useState("");
  const [pending, setPending] = useState(false);
  const [isRefreshing, startRefresh] = useTransition();

  async function scheduleInterview(formData: FormData) {
    setPending(true);
    setMessage("");
    try {
      const startsAt = String(formData.get("startsAt") ?? "");
      const participants = String(formData.get("participants") ?? "")
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean);
      const response = await fetch(`${apiUrl}/interviews`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          applicationId: String(formData.get("applicationId") ?? ""),
          startsAt: new Date(startsAt).toISOString(),
          format: String(formData.get("format") ?? ""),
          location: String(formData.get("location") ?? ""),
          participants,
          preparationNotes: String(formData.get("preparationNotes") ?? "")
        })
      });

      if (!response.ok) throw new Error("Could not schedule interview.");
      const interview = await response.json() as ApplicationInterview;
      setInterviews((current) => [...current, interview]);
      setMessage("Interview scheduled and prep task created.");
      startRefresh(() => router.refresh());
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Could not schedule interview.");
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="grid gap-5 lg:grid-cols-[22rem_1fr]">
      <section className="rounded border border-ink/10 bg-white p-5">
        <div className="mb-4 flex items-center gap-2">
          <CalendarClock size={18} />
          <h2 className="font-semibold">Schedule</h2>
        </div>
        <form action={scheduleInterview} className="grid gap-3">
          <select className="h-10 rounded border border-ink/15 px-3 text-sm" name="applicationId" required>
            <option value="">Select application</option>
            {initialApplications.map((application) => (
              <option key={application.id} value={application.id}>{application.jobTitle} · {application.companyName ?? "No company"}</option>
            ))}
          </select>
          <input className="h-10 rounded border border-ink/15 px-3 text-sm" name="startsAt" required type="datetime-local" />
          <input className="h-10 rounded border border-ink/15 px-3 text-sm" name="format" placeholder="Video, onsite, phone" />
          <input className="h-10 rounded border border-ink/15 px-3 text-sm" name="location" placeholder="Location or meeting link" />
          <input className="h-10 rounded border border-ink/15 px-3 text-sm" name="participants" placeholder="Participants, comma-separated" />
          <textarea className="min-h-24 rounded border border-ink/15 px-3 py-2 text-sm" name="preparationNotes" placeholder="Preparation notes" />
          <button className="inline-flex h-10 items-center justify-center gap-2 rounded bg-ink px-3 text-sm font-semibold text-white" disabled={pending} type="submit">
            {pending ? <Loader2 className="animate-spin" size={15} /> : <Plus size={15} />}
            Schedule
          </button>
        </form>
        {message || isRefreshing ? <p className="mt-3 text-xs text-ink/55">{isRefreshing ? "Refreshing." : message}</p> : null}
      </section>

      <section className="rounded border border-ink/10 bg-white p-5">
        <h2 className="mb-4 font-semibold">Upcoming Interviews</h2>
        {interviews.length === 0 ? <p className="text-sm text-ink/55">No interviews scheduled yet.</p> : null}
        <div className="divide-y divide-ink/10">
          {interviews.map((interview) => (
            <article className="py-4 text-sm" key={interview.id}>
              <p className="font-medium">{interview.jobTitle} · {new Date(interview.startsAt).toLocaleString()}</p>
              <p className="mt-1 text-ink/55">{interview.companyName ?? "No company"} · {interview.format ?? "Interview"} · {interview.location ?? "No location"}</p>
              {interview.calendarStatus ? <p className="mt-1 text-xs text-tide">Calendar {interview.calendarStatus} · {interview.calendarConflictStatus ?? "clear"}</p> : null}
              {interview.participants.length ? <p className="mt-1 text-ink/55">{interview.participants.join(", ")}</p> : null}
              {interview.preparationNotes ? <p className="mt-2 text-ink/70">{interview.preparationNotes}</p> : null}
              {interview.outcome ? <p className="mt-2 text-rust">{interview.outcome}</p> : null}
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
