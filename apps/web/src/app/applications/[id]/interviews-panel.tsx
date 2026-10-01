"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { CalendarClock, Loader2, Plus } from "lucide-react";
import type { ApplicationInterview } from "../../../lib/api";

const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

export function InterviewsPanel({
  applicationId,
  initialInterviews
}: {
  applicationId: string;
  initialInterviews: ApplicationInterview[];
}) {
  const router = useRouter();
  const [interviews, setInterviews] = useState(initialInterviews);
  const [message, setMessage] = useState("");
  const [pending, setPending] = useState(false);
  const [isRefreshing, startRefresh] = useTransition();

  async function createInterview(formData: FormData) {
    setPending(true);
    setMessage("");
    try {
      const participants = String(formData.get("participants") ?? "")
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean);
      const startsAt = String(formData.get("startsAt") ?? "");
      const response = await fetch(`${apiUrl}/interviews`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          applicationId,
          startsAt: new Date(startsAt).toISOString(),
          format: String(formData.get("format") ?? ""),
          location: String(formData.get("location") ?? ""),
          participants,
          preparationNotes: String(formData.get("preparationNotes") ?? ""),
          notes: String(formData.get("notes") ?? "")
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
    <section className="mt-4 rounded border border-ink/10 bg-white p-5">
      <div className="mb-4 flex items-center gap-2">
        <CalendarClock size={18} />
        <h2 className="font-semibold">Interviews</h2>
      </div>
      <form action={createInterview} className="mb-5 grid gap-3 md:grid-cols-2">
        <input className="h-10 rounded border border-ink/15 px-3 text-sm" name="startsAt" required type="datetime-local" />
        <input className="h-10 rounded border border-ink/15 px-3 text-sm" name="format" placeholder="Video, onsite, phone" />
        <input className="h-10 rounded border border-ink/15 px-3 text-sm" name="location" placeholder="Location or meeting link" />
        <input className="h-10 rounded border border-ink/15 px-3 text-sm" name="participants" placeholder="Participants, comma-separated" />
        <textarea className="min-h-20 rounded border border-ink/15 px-3 py-2 text-sm md:col-span-2" name="preparationNotes" placeholder="Preparation notes" />
        <textarea className="min-h-20 rounded border border-ink/15 px-3 py-2 text-sm md:col-span-2" name="notes" placeholder="Interview notes" />
        <button className="inline-flex h-10 w-fit items-center gap-2 rounded bg-ink px-3 text-sm font-semibold text-white" disabled={pending} type="submit">
          {pending ? <Loader2 className="animate-spin" size={15} /> : <Plus size={15} />}
          Schedule
        </button>
      </form>
      {interviews.length === 0 ? <p className="text-sm text-ink/55">No interviews scheduled yet.</p> : null}
      <div className="space-y-3">
        {interviews.map((interview) => (
          <article className="rounded border border-ink/10 bg-paper p-3 text-sm" key={interview.id}>
            <p className="font-medium">{new Date(interview.startsAt).toLocaleString()} · {interview.format ?? "Interview"}</p>
            <p className="mt-1 text-ink/55">{interview.location ?? "No location"} · {interview.participants.length ? interview.participants.join(", ") : "No participants"}</p>
            {interview.calendarStatus ? <p className="mt-1 text-xs text-tide">Calendar {interview.calendarStatus} · {interview.calendarConflictStatus ?? "clear"}</p> : null}
            {interview.preparationNotes ? <p className="mt-2 text-ink/70">{interview.preparationNotes}</p> : null}
            {interview.outcome ? <p className="mt-2 text-rust">{interview.outcome}</p> : null}
          </article>
        ))}
      </div>
      {message || isRefreshing ? <p className="mt-3 text-xs text-ink/55">{isRefreshing ? "Refreshing." : message}</p> : null}
    </section>
  );
}
