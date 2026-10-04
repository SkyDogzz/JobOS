import { revalidatePath } from "next/cache";
import Link from "next/link";
import { ArrowLeft, Bot, Check, Send, X } from "lucide-react";
import { apiUrl, getCopilotState } from "../../lib/api";

async function sendMessage(formData: FormData) {
  "use server";
  const response = await fetch(`${apiUrl}/copilot/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ message: String(formData.get("message") ?? "Plan my week") })
  });
  if (!response.ok) throw new Error("Unable to ask copilot.");
  revalidatePath("/copilot");
}

async function approveAction(formData: FormData) {
  "use server";
  const response = await fetch(`${apiUrl}/copilot/actions/${formData.get("actionId")}/approve`, { method: "POST" });
  if (!response.ok) throw new Error("Unable to approve action.");
  revalidatePath("/copilot");
}

async function rejectAction(formData: FormData) {
  "use server";
  const response = await fetch(`${apiUrl}/copilot/actions/${formData.get("actionId")}/reject`, { method: "POST" });
  if (!response.ok) throw new Error("Unable to reject action.");
  revalidatePath("/copilot");
}

export default async function CopilotPage() {
  const state = await getCopilotState().catch(() => null);
  const pending = state?.actions.filter((action) => action.status === "pending") ?? [];
  const decided = state?.actions.filter((action) => action.status !== "pending") ?? [];

  return (
    <main className="min-h-screen bg-paper px-5 py-6 text-ink sm:px-8 lg:px-10">
      <div className="mx-auto max-w-6xl">
        <Link className="mb-6 inline-flex items-center gap-2 text-sm font-medium text-ink/65 hover:text-ink" href="/">
          <ArrowLeft size={16} />
          Dashboard
        </Link>
        <section className="mb-8 border-b border-ink/10 pb-6">
          <div className="flex items-center gap-2">
            <Bot size={22} />
            <h1 className="text-3xl font-semibold">Copilot</h1>
          </div>
          <p className="mt-2 max-w-2xl text-sm text-ink/65">Grounded job-search planning with approval-gated actions.</p>
        </section>

        <section className="grid gap-4 sm:grid-cols-4">
          <Metric label="Saved jobs" value={state?.grounding.savedJobs.length ?? 0} />
          <Metric label="Applications" value={state?.grounding.applications.length ?? 0} />
          <Metric label="Resumes" value={state?.grounding.resumeCount ?? 0} />
          <Metric label="Open tasks" value={state?.grounding.openTasks.length ?? 0} />
        </section>

        <section className="mt-6 grid gap-6 lg:grid-cols-[1fr_380px]">
          <div className="rounded border border-ink/10 bg-white p-5">
            <h2 className="mb-4 font-semibold">Conversation</h2>
            <div className="space-y-3">
              {state?.messages.length ? state.messages.map((message) => (
                <article className="rounded border border-ink/10 p-3" key={message.id}>
                  <p className="text-xs font-semibold uppercase text-ink/50">{message.role}</p>
                  <p className="mt-1 text-sm text-ink/80">{message.content}</p>
                </article>
              )) : <p className="text-sm text-ink/55">Ask for a weekly plan, follow-up ideas, or document next steps.</p>}
            </div>
            <form action={sendMessage} className="mt-4 flex gap-2">
              <input className="min-w-0 flex-1 rounded border border-ink/15 px-3 py-2 text-sm" name="message" placeholder="Plan my week from my current pipeline" />
              <button className="inline-flex items-center gap-2 rounded bg-ink px-3 py-2 text-sm font-semibold text-white" type="submit">
                <Send size={16} />
                Send
              </button>
            </form>
          </div>

          <div className="rounded border border-ink/10 bg-white p-5">
            <h2 className="mb-4 font-semibold">Pending Actions</h2>
            <div className="space-y-3">
              {pending.length === 0 ? <p className="text-sm text-ink/55">No pending actions.</p> : null}
              {pending.map((action) => <ActionCard action={action} approveAction={approveAction} rejectAction={rejectAction} key={action.id} />)}
            </div>
          </div>
        </section>

        <section className="mt-6 rounded border border-ink/10 bg-white p-5">
          <h2 className="mb-4 font-semibold">Accepted and rejected recommendations</h2>
          <div className="grid gap-3 md:grid-cols-2">
            {decided.length === 0 ? <p className="text-sm text-ink/55">No action history yet.</p> : null}
            {decided.map((action) => (
              <article className="rounded border border-ink/10 p-4" key={action.id}>
                <div className="flex items-center justify-between gap-3">
                  <p className="font-medium">{action.title}</p>
                  <span className="rounded border border-ink/10 px-2 py-1 text-xs">{action.status}</span>
                </div>
                <p className="mt-2 text-sm text-ink/65">{action.rationale}</p>
              </article>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}

function ActionCard({ action, approveAction, rejectAction }: { action: { id: string; title: string; rationale: string; kind: string }; approveAction: (formData: FormData) => Promise<void>; rejectAction: (formData: FormData) => Promise<void> }) {
  return (
    <article className="rounded border border-ink/10 p-4">
      <p className="text-xs font-semibold uppercase text-ink/50">{action.kind.replaceAll("_", " ")}</p>
      <h3 className="mt-1 font-medium">{action.title}</h3>
      <p className="mt-2 text-sm text-ink/65">{action.rationale}</p>
      <div className="mt-3 flex gap-2">
        <form action={approveAction}>
          <input type="hidden" name="actionId" value={action.id} />
          <button className="inline-flex items-center gap-1 rounded bg-ink px-3 py-2 text-sm font-semibold text-white" type="submit"><Check size={15} />Approve</button>
        </form>
        <form action={rejectAction}>
          <input type="hidden" name="actionId" value={action.id} />
          <button className="inline-flex items-center gap-1 rounded border border-ink/15 px-3 py-2 text-sm font-semibold" type="submit"><X size={15} />Reject</button>
        </form>
      </div>
    </article>
  );
}

function Metric({ label, value }: { label: string; value: number }) {
  return (
    <article className="rounded border border-ink/10 bg-white p-4">
      <p className="text-sm text-ink/60">{label}</p>
      <p className="mt-2 text-2xl font-semibold">{value}</p>
    </article>
  );
}
