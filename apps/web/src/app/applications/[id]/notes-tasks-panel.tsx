"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Check, Loader2, Plus } from "lucide-react";
import type { ApplicationNote, ApplicationTask } from "../../../lib/api";

const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

export function NotesTasksPanel({
  applicationId,
  initialNotes,
  initialTasks
}: {
  applicationId: string;
  initialNotes: ApplicationNote[];
  initialTasks: ApplicationTask[];
}) {
  const router = useRouter();
  const [notes, setNotes] = useState(initialNotes);
  const [tasks, setTasks] = useState(initialTasks);
  const [message, setMessage] = useState("");
  const [pending, setPending] = useState<"note" | "task" | string | null>(null);
  const [isRefreshing, startRefresh] = useTransition();

  function refresh() {
    startRefresh(() => router.refresh());
  }

  async function createNote(formData: FormData) {
    setPending("note");
    setMessage("");
    try {
      const response = await fetch(`${apiUrl}/applications/${applicationId}/notes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ body: String(formData.get("body") ?? "") })
      });
      if (!response.ok) throw new Error("Could not create note.");
      const note = await response.json() as ApplicationNote;
      setNotes((current) => [...current, note]);
      setMessage("Note added.");
      refresh();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Could not create note.");
    } finally {
      setPending(null);
    }
  }

  async function createTask(formData: FormData) {
    setPending("task");
    setMessage("");
    try {
      const response = await fetch(`${apiUrl}/applications/${applicationId}/tasks`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ title: String(formData.get("title") ?? "") })
      });
      if (!response.ok) throw new Error("Could not create task.");
      const task = await response.json() as ApplicationTask;
      setTasks((current) => [...current, task]);
      setMessage("Task added.");
      refresh();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Could not create task.");
    } finally {
      setPending(null);
    }
  }

  async function completeTask(taskId: string) {
    setPending(taskId);
    const previous = tasks;
    setTasks((current) => current.map((task) => task.id === taskId ? { ...task, status: "done" } : task));
    try {
      const response = await fetch(`${apiUrl}/tasks/${taskId}/complete`, { method: "PATCH", credentials: "include" });
      if (!response.ok) throw new Error("Could not complete task.");
      setMessage("Task completed.");
      refresh();
    } catch (error) {
      setTasks(previous);
      setMessage(error instanceof Error ? error.message : "Could not complete task.");
    } finally {
      setPending(null);
    }
  }

  return (
    <section className="mt-4 grid gap-4 lg:grid-cols-2">
      <div className="rounded border border-ink/10 bg-white p-5">
        <h2 className="mb-4 font-semibold">Notes</h2>
        <form action={createNote} className="mb-4">
          <textarea className="min-h-24 w-full rounded border border-ink/15 px-3 py-2 text-sm" name="body" placeholder="Add a note" required />
          <button className="mt-2 inline-flex h-9 items-center gap-2 rounded bg-ink px-3 text-sm font-semibold text-white" disabled={pending === "note"} type="submit">
            {pending === "note" ? <Loader2 className="animate-spin" size={15} /> : <Plus size={15} />}
            Add note
          </button>
        </form>
        {notes.length === 0 ? <p className="text-sm text-ink/55">No notes yet.</p> : null}
        <div className="space-y-2">
          {notes.map((note) => <p className="rounded bg-paper p-3 text-sm" key={note.id}>{note.body}</p>)}
        </div>
      </div>

      <div className="rounded border border-ink/10 bg-white p-5">
        <h2 className="mb-4 font-semibold">Tasks</h2>
        <form action={createTask} className="mb-4 flex gap-2">
          <input className="h-9 min-w-0 flex-1 rounded border border-ink/15 px-3 text-sm" name="title" placeholder="Follow up Friday" required />
          <button className="inline-flex h-9 items-center gap-2 rounded bg-ink px-3 text-sm font-semibold text-white" disabled={pending === "task"} type="submit">
            {pending === "task" ? <Loader2 className="animate-spin" size={15} /> : <Plus size={15} />}
            Add
          </button>
        </form>
        {tasks.length === 0 ? <p className="text-sm text-ink/55">No tasks yet.</p> : null}
        <div className="space-y-2">
          {tasks.map((task) => (
            <article className="flex items-center justify-between gap-3 rounded bg-paper p-3 text-sm" key={task.id}>
              <span className={task.status === "done" ? "text-ink/45 line-through" : ""}>{task.title}</span>
              <button className="inline-flex size-8 items-center justify-center rounded border border-ink/10 bg-white" disabled={task.status === "done" || pending === task.id} onClick={() => completeTask(task.id)} type="button">
                {pending === task.id ? <Loader2 className="animate-spin" size={15} /> : <Check size={15} />}
              </button>
            </article>
          ))}
        </div>
        {message || isRefreshing ? <p className="mt-3 text-xs text-ink/55">{isRefreshing ? "Refreshing." : message}</p> : null}
      </div>
    </section>
  );
}
