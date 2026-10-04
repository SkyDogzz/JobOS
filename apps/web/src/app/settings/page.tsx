import { revalidatePath } from "next/cache";
import Link from "next/link";
import { ArrowLeft, BellRing, BrainCircuit, CreditCard, Download, MapPin, Save, ShieldCheck, UsersRound } from "lucide-react";
import { apiUrl, getBillingStatus, getUserSettings, getWorkspaces } from "../../lib/api";

async function saveSettings(formData: FormData) {
  "use server";

  const list = (name: string) => String(formData.get(name) ?? "").split(",").map((item) => item.trim()).filter(Boolean);
  const response = await fetch(`${apiUrl}/settings`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      timezone: String(formData.get("timezone") ?? "UTC"),
      preferredLocations: list("preferredLocations"),
      remotePreference: String(formData.get("remotePreference") ?? "any"),
      minimumSalary: String(formData.get("minimumSalary") ?? "").trim() || null,
      preferredSources: list("preferredSources"),
      defaultAiProvider: String(formData.get("defaultAiProvider") ?? "local"),
      defaultAiModel: String(formData.get("defaultAiModel") ?? "deterministic-v1"),
      redactSensitiveExports: formData.get("redactSensitiveExports") === "on",
      storeEmailBodies: formData.get("storeEmailBodies") === "on",
      aiArtifactRetention: String(formData.get("aiArtifactRetention") ?? "keep"),
      notificationPreferences: {
        dueSoonDays: Number(formData.get("dueSoonDays") ?? 3),
        taskRemindersEnabled: formData.get("taskRemindersEnabled") === "on",
        followUpSuggestionsEnabled: formData.get("followUpSuggestionsEnabled") === "on",
        deliveryChannel: String(formData.get("deliveryChannel") ?? "in_app")
      }
    })
  });
  if (!response.ok) throw new Error("Unable to save settings.");
  revalidatePath("/settings");
  revalidatePath("/settings/notifications");
}

async function changePlan(formData: FormData) {
  "use server";

  const response = await fetch(`${apiUrl}/billing/checkout`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ planCode: String(formData.get("planCode") ?? "pro") })
  });
  if (!response.ok) throw new Error("Unable to update plan.");
  revalidatePath("/settings");
}

async function createWorkspace(formData: FormData) {
  "use server";

  const response = await fetch(`${apiUrl}/teams/workspaces`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      name: String(formData.get("workspaceName") ?? "Job Search Team"),
      settings: { defaultVisibility: "private", exportPolicy: "owners_admins", requireApprovalForDelete: true }
    })
  });
  if (!response.ok) throw new Error("Unable to create workspace.");
  revalidatePath("/settings");
}

export default async function SettingsPage() {
  const settings = await getUserSettings().catch(() => null);
  const billing = await getBillingStatus().catch(() => null);
  const workspaces = await getWorkspaces().catch(() => []);
  const notifications = settings?.notificationPreferences;

  return (
    <main className="min-h-screen bg-paper px-5 py-6 text-ink sm:px-8 lg:px-10">
      <div className="mx-auto max-w-5xl">
        <Link className="mb-6 inline-flex items-center gap-2 text-sm font-medium text-ink/65 hover:text-ink" href="/">
          <ArrowLeft size={16} />
          Dashboard
        </Link>
        <section className="mb-8 border-b border-ink/10 pb-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h1 className="text-3xl font-semibold">Settings</h1>
            <Link className="inline-flex items-center gap-2 rounded border border-ink/15 px-3 py-2 text-sm font-medium hover:bg-ink/5" href="/settings/export">
              <Download size={16} />
              Data export
            </Link>
          </div>
          <p className="mt-2 max-w-2xl text-sm text-ink/60">Local defaults for matching, reminders, and deterministic document generation.</p>
        </section>
        {!settings ? <p className="rounded border border-rust/20 bg-rust/10 p-4 text-sm text-rust">Settings are unavailable.</p> : null}
        {billing ? (
          <section className="mb-5 rounded border border-ink/10 bg-white p-5">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <CreditCard size={18} />
                <h2 className="font-semibold">Plan and usage</h2>
              </div>
              <span className="rounded border border-ink/10 px-3 py-1 text-sm font-medium">{billing.effectivePlan?.name ?? "Free"}</span>
            </div>
            <div className="grid gap-3 md:grid-cols-3">
              <Metric label="AI generations" value={formatUsage(billing.usage.aiGenerations, billing.limits.aiGenerations)} />
              <Metric label="Sync runs" value={formatUsage(billing.usage.syncRuns, billing.limits.syncRuns)} />
              <Metric label="Document exports" value={formatUsage(billing.usage.documentExports, billing.limits.documentExports)} />
            </div>
            {billing.warnings.length ? (
              <div className="mt-4 rounded border border-rust/20 bg-rust/10 p-3 text-sm text-ink/75">
                {billing.warnings.map((warning) => (
                  <p key={warning.metric}>{warning.metric}: {warning.remaining} remaining this period.</p>
                ))}
              </div>
            ) : null}
            <div className="mt-4 flex flex-wrap gap-2 text-sm text-ink/65">
              <span>Premium AI: {billing.entitlements.premiumAi ? "enabled" : "locked"}</span>
              <span>Provider sync: {billing.entitlements.providerSync ? "enabled" : "locked"}</span>
              <span>Billing: {billing.providerMode}</span>
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              {billing.plans.filter((plan) => plan.code !== billing.effectivePlan?.code).map((plan) => (
                <form action={changePlan} key={plan.code}>
                  <input type="hidden" name="planCode" value={plan.code} />
                  <button className="rounded border border-ink/15 px-3 py-2 text-sm font-medium hover:bg-ink/5" type="submit">
                    Switch to {plan.name}
                  </button>
                </form>
              ))}
            </div>
          </section>
        ) : null}
        <section className="mb-5 rounded border border-ink/10 bg-white p-5">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <UsersRound size={18} />
              <h2 className="font-semibold">Workspaces</h2>
            </div>
            <span className="text-sm text-ink/60">{workspaces.length} active</span>
          </div>
          <div className="grid gap-3 md:grid-cols-2">
            {workspaces.map((workspace) => (
              <div className="rounded border border-ink/10 p-4" key={workspace.id}>
                <div className="flex items-center justify-between gap-3">
                  <p className="font-medium">{workspace.name}</p>
                  <span className="rounded border border-ink/10 px-2 py-1 text-xs font-medium">{workspace.role}</span>
                </div>
                <p className="mt-1 text-sm text-ink/60">{workspace.kind} workspace</p>
                <p className="mt-3 text-xs text-ink/55">Permissions: {workspace.permissions.join(", ")}</p>
              </div>
            ))}
          </div>
          <form action={createWorkspace} className="mt-4 flex flex-wrap gap-2">
            <input className="min-w-64 rounded border border-ink/15 px-3 py-2 text-sm" name="workspaceName" placeholder="Team workspace name" />
            <button className="rounded bg-ink px-3 py-2 text-sm font-semibold text-white" type="submit">Create team</button>
          </form>
        </section>
        {settings && notifications ? (
          <form action={saveSettings} className="grid gap-5">
            <section className="rounded border border-ink/10 bg-white p-5">
              <div className="mb-4 flex items-center gap-2">
                <MapPin size={18} />
                <h2 className="font-semibold">Search Preferences</h2>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <Field label="Timezone" name="timezone" defaultValue={settings.timezone} />
                <label className="grid gap-2 text-sm font-medium">
                  Remote preference
                  <select name="remotePreference" defaultValue={settings.remotePreference} className="rounded border border-ink/15 bg-white px-3 py-2 text-sm">
                    <option value="any">Any</option>
                    <option value="remote">Remote</option>
                    <option value="hybrid">Hybrid</option>
                    <option value="onsite">Onsite</option>
                  </select>
                </label>
                <Field label="Preferred locations" name="preferredLocations" defaultValue={settings.preferredLocations.join(", ")} />
                <Field label="Minimum salary" name="minimumSalary" defaultValue={settings.minimumSalary ?? ""} />
                <Field label="Preferred sources" name="preferredSources" defaultValue={settings.preferredSources.join(", ")} />
              </div>
            </section>

            <section className="rounded border border-ink/10 bg-white p-5">
              <div className="mb-4 flex items-center gap-2">
                <BellRing size={18} />
                <h2 className="font-semibold">Notifications</h2>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <Field label="Due-soon window" name="dueSoonDays" type="number" defaultValue={String(notifications.dueSoonDays)} />
                <label className="grid gap-2 text-sm font-medium">
                  Delivery channel
                  <select name="deliveryChannel" defaultValue={notifications.deliveryChannel} className="rounded border border-ink/15 bg-white px-3 py-2 text-sm">
                    <option value="in_app">In app</option>
                    <option value="email_placeholder">Email placeholder</option>
                  </select>
                </label>
                <Toggle label="Task reminders" name="taskRemindersEnabled" defaultChecked={notifications.taskRemindersEnabled} />
                <Toggle label="Follow-up suggestions" name="followUpSuggestionsEnabled" defaultChecked={notifications.followUpSuggestionsEnabled} />
              </div>
            </section>

            <section className="rounded border border-ink/10 bg-white p-5">
              <div className="mb-4 flex items-center gap-2">
                <BrainCircuit size={18} />
                <h2 className="font-semibold">AI Defaults</h2>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <label className="grid gap-2 text-sm font-medium">
                  Provider
                  <select name="defaultAiProvider" defaultValue={settings.defaultAiProvider} className="rounded border border-ink/15 bg-white px-3 py-2 text-sm">
                    <option value="local">Local</option>
                    <option value="openai">OpenAI</option>
                    <option value="anthropic">Anthropic</option>
                  </select>
                </label>
                <Field label="Model" name="defaultAiModel" defaultValue={settings.defaultAiModel} />
              </div>
            </section>

            <section className="rounded border border-ink/10 bg-white p-5">
              <div className="mb-4 flex items-center gap-2">
                <ShieldCheck size={18} />
                <h2 className="font-semibold">Privacy Controls</h2>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <Toggle label="Redact sensitive exports" name="redactSensitiveExports" defaultChecked={settings.redactSensitiveExports} />
                <Toggle label="Store email bodies" name="storeEmailBodies" defaultChecked={settings.storeEmailBodies} />
                <label className="grid gap-2 text-sm font-medium">
                  AI artifact retention
                  <select name="aiArtifactRetention" defaultValue={settings.aiArtifactRetention} className="rounded border border-ink/15 bg-white px-3 py-2 text-sm">
                    <option value="keep">Keep</option>
                    <option value="redact_on_export">Redact on export</option>
                    <option value="delete_on_account_deletion">Delete on account deletion</option>
                  </select>
                </label>
              </div>
            </section>

            <button className="inline-flex w-fit items-center gap-2 rounded bg-ink px-4 py-2 text-sm font-semibold text-white" type="submit">
              <Save size={16} />
              Save settings
            </button>
          </form>
        ) : null}
      </div>
    </main>
  );
}

function Field({ label, name, defaultValue, type = "text" }: { label: string; name: string; defaultValue: string; type?: string }) {
  return (
    <label className="grid gap-2 text-sm font-medium">
      {label}
      <input className="rounded border border-ink/15 px-3 py-2 text-sm" name={name} type={type} defaultValue={defaultValue} />
    </label>
  );
}

function Toggle({ label, name, defaultChecked }: { label: string; name: string; defaultChecked: boolean }) {
  return (
    <label className="flex items-center gap-3 rounded border border-ink/10 px-3 py-2 text-sm font-medium">
      <input name={name} type="checkbox" defaultChecked={defaultChecked} />
      {label}
    </label>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded border border-ink/10 p-3">
      <p className="text-xs font-medium uppercase text-ink/50">{label}</p>
      <p className="mt-1 text-lg font-semibold">{value}</p>
    </div>
  );
}

function formatLimit(value: number | boolean | undefined) {
  if (typeof value === "number") return value.toLocaleString();
  if (typeof value === "boolean") return value ? "Enabled" : "Locked";
  return "Not set";
}

function formatUsage(used: number | undefined, limit: number | boolean | undefined) {
  const current = Number(used ?? 0).toLocaleString();
  return typeof limit === "number" ? `${current} / ${limit.toLocaleString()}` : `${current} used`;
}
