import { revalidatePath } from "next/cache";
import Link from "next/link";
import { ArrowLeft, BellRing, BrainCircuit, Download, MapPin, Save } from "lucide-react";
import { apiUrl, getUserSettings } from "../../lib/api";

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

export default async function SettingsPage() {
  const settings = await getUserSettings().catch(() => null);
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
