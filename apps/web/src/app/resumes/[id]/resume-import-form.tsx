"use client";

import { useState } from "react";
import { Upload } from "lucide-react";
import { apiUrl } from "../../../lib/api";

export function ResumeImportForm({ resumeId }: { resumeId: string }) {
  const [text, setText] = useState("");
  const [parsed, setParsed] = useState<Record<string, unknown> | null>(null);
  const [title, setTitle] = useState("Parsed CV");
  const [message, setMessage] = useState("");

  async function parse() {
    setMessage("Parsing...");
    const response = await fetch(`${apiUrl}/resumes/parse`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text })
    });
    if (!response.ok) {
      setMessage("Paste at least a few resume sections before parsing.");
      return;
    }
    setParsed(await response.json());
    setMessage("Review the parsed JSON, then save it as a new version.");
  }

  async function save() {
    if (!parsed) return;
    const response = await fetch(`${apiUrl}/resumes/${resumeId}/versions/from-parse`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title, parsed, originalText: text })
    });
    setMessage(response.ok ? "Saved parsed CV version. Refreshing..." : "Could not save parsed version.");
    if (response.ok) window.location.reload();
  }

  return (
    <section className="rounded border border-ink/10 bg-white p-5">
      <div className="mb-4 flex items-center gap-2">
        <Upload size={18} />
        <h2 className="font-semibold">Paste Import</h2>
      </div>
      <textarea className="min-h-40 w-full rounded border border-ink/15 p-3 text-sm" value={text} onChange={(event) => setText(event.target.value)} placeholder="Paste resume text" />
      <div className="mt-3 flex gap-2">
        <button className="rounded bg-ink px-3 py-2 text-sm font-medium text-white" onClick={parse} type="button">Parse</button>
        <button className="rounded border border-ink/15 px-3 py-2 text-sm font-medium" disabled={!parsed} onClick={save} type="button">Save Version</button>
      </div>
      {parsed ? <input className="mt-3 h-10 w-full rounded border border-ink/15 px-3 text-sm" value={title} onChange={(event) => setTitle(event.target.value)} /> : null}
      {parsed ? <pre className="mt-3 max-h-64 overflow-auto rounded bg-paper p-3 text-xs">{JSON.stringify(parsed, null, 2)}</pre> : null}
      {message ? <p className="mt-3 text-sm text-ink/60">{message}</p> : null}
    </section>
  );
}
