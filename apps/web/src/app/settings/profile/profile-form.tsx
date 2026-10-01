"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Save } from "lucide-react";
import type { CandidateProfile } from "../../../lib/api";

const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

export function ProfileForm({ profile }: { profile: CandidateProfile | null }) {
  const router = useRouter();
  const [message, setMessage] = useState("");
  const [isPending, startTransition] = useTransition();

  async function save(formData: FormData) {
    setMessage("");
    const response = await fetch(`${apiUrl}/profile`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        headline: String(formData.get("headline") ?? ""),
        summary: String(formData.get("summary") ?? ""),
        location: String(formData.get("location") ?? ""),
        skills: String(formData.get("skills") ?? ""),
        experience: String(formData.get("experience") ?? "")
      })
    });

    setMessage(response.ok ? "Profile saved." : "Could not save profile.");
    if (response.ok) startTransition(() => router.refresh());
  }

  const skills = profile?.canonicalData?.skills?.join(", ") ?? "";

  return (
    <form action={save} className="rounded border border-ink/10 bg-white p-5">
      <label className="mb-3 block text-sm">
        <span className="mb-1 block font-medium text-ink/70">Headline</span>
        <input className="h-10 w-full rounded border border-ink/15 px-3" defaultValue={profile?.headline ?? ""} name="headline" />
      </label>
      <label className="mb-3 block text-sm">
        <span className="mb-1 block font-medium text-ink/70">Location</span>
        <input className="h-10 w-full rounded border border-ink/15 px-3" defaultValue={profile?.location ?? ""} name="location" />
      </label>
      <label className="mb-3 block text-sm">
        <span className="mb-1 block font-medium text-ink/70">Summary</span>
        <textarea className="min-h-28 w-full rounded border border-ink/15 px-3 py-2" defaultValue={profile?.summary ?? ""} name="summary" />
      </label>
      <label className="mb-3 block text-sm">
        <span className="mb-1 block font-medium text-ink/70">Skills</span>
        <input className="h-10 w-full rounded border border-ink/15 px-3" defaultValue={skills} name="skills" placeholder="TypeScript, PostgreSQL, NestJS" />
      </label>
      <label className="mb-3 block text-sm">
        <span className="mb-1 block font-medium text-ink/70">Experience Grounding</span>
        <textarea className="min-h-28 w-full rounded border border-ink/15 px-3 py-2" defaultValue={profile?.canonicalData?.experience ?? ""} name="experience" />
      </label>
      <button className="inline-flex h-10 items-center gap-2 rounded bg-ink px-4 text-sm font-semibold text-white" disabled={isPending} type="submit">
        {isPending ? <Loader2 className="animate-spin" size={16} /> : <Save size={16} />}
        Save profile
      </button>
      {message ? <p className="mt-3 text-sm text-ink/55">{message}</p> : null}
    </form>
  );
}

