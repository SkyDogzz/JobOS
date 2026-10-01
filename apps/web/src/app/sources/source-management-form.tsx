"use client";

import { useState } from "react";
import { apiUrl } from "../../lib/api";

export function SourceManagementForm() {
  const [message, setMessage] = useState("");

  async function submit(path: string, formData: FormData) {
    setMessage("Saving...");
    const body: Record<string, string> = {};
    for (const key of ["name", "kind", "baseUrl", "status", "website", "description", "title", "email"]) {
      const value = String(formData.get(key) ?? "").trim();
      if (value) body[key] = value;
    }
    const response = await fetch(`${apiUrl}${path}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body)
    });
    setMessage(response.ok ? "Saved. Refreshing..." : "Could not save.");
    if (response.ok) window.location.reload();
  }

  return (
    <section className="grid gap-4 lg:grid-cols-3">
      <form action={(formData) => submit("/job-sources", formData)} className="rounded border border-ink/10 bg-white p-5">
        <h2 className="mb-4 font-semibold">New Source</h2>
        <input className="mb-3 h-10 w-full rounded border border-ink/15 px-3 text-sm" name="name" placeholder="Source name" required />
        <select className="mb-3 h-10 w-full rounded border border-ink/15 px-3 text-sm" name="kind" defaultValue="job_board">
          <option value="manual">Manual</option>
          <option value="job_board">Job board</option>
          <option value="referral">Referral</option>
          <option value="company_page">Company page</option>
          <option value="other">Other</option>
        </select>
        <input className="mb-3 h-10 w-full rounded border border-ink/15 px-3 text-sm" name="baseUrl" placeholder="https://..." />
        <button className="rounded bg-ink px-3 py-2 text-sm font-medium text-white">Save source</button>
      </form>
      <form action={(formData) => submit("/companies", formData)} className="rounded border border-ink/10 bg-white p-5">
        <h2 className="mb-4 font-semibold">New Company</h2>
        <input className="mb-3 h-10 w-full rounded border border-ink/15 px-3 text-sm" name="name" placeholder="Company name" required />
        <input className="mb-3 h-10 w-full rounded border border-ink/15 px-3 text-sm" name="website" placeholder="https://..." />
        <textarea className="mb-3 min-h-20 w-full rounded border border-ink/15 p-3 text-sm" name="description" placeholder="Notes" />
        <button className="rounded bg-ink px-3 py-2 text-sm font-medium text-white">Save company</button>
      </form>
      <form action={(formData) => submit("/contacts", formData)} className="rounded border border-ink/10 bg-white p-5">
        <h2 className="mb-4 font-semibold">New Contact</h2>
        <input className="mb-3 h-10 w-full rounded border border-ink/15 px-3 text-sm" name="name" placeholder="Contact name" required />
        <input className="mb-3 h-10 w-full rounded border border-ink/15 px-3 text-sm" name="title" placeholder="Title" />
        <input className="mb-3 h-10 w-full rounded border border-ink/15 px-3 text-sm" name="email" placeholder="email@example.com" />
        <button className="rounded bg-ink px-3 py-2 text-sm font-medium text-white">Save contact</button>
      </form>
      {message ? <p className="text-sm text-ink/60">{message}</p> : null}
    </section>
  );
}
