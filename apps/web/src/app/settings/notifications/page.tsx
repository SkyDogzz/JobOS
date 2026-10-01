import Link from "next/link";
import { ArrowLeft, BellRing } from "lucide-react";
import { getNotificationPreferences } from "../../../lib/api";

export default async function NotificationSettingsPage() {
  const preferences = await getNotificationPreferences().catch(() => null);

  return (
    <main className="min-h-screen bg-paper px-5 py-6 text-ink sm:px-8 lg:px-10">
      <div className="mx-auto max-w-4xl">
        <Link className="mb-6 inline-flex items-center gap-2 text-sm font-medium text-ink/65 hover:text-ink" href="/">
          <ArrowLeft size={16} />
          Dashboard
        </Link>
        <section className="mb-8 border-b border-ink/10 pb-6">
          <div className="flex items-center gap-2">
            <BellRing size={20} />
            <h1 className="text-3xl font-semibold">Notification Settings</h1>
          </div>
        </section>
        {!preferences ? <p className="rounded border border-rust/20 bg-rust/10 p-4 text-sm text-rust">Notification preferences are unavailable.</p> : null}
        {preferences ? (
          <section className="grid gap-4 sm:grid-cols-2">
            <Setting label="Task reminders" value={preferences.taskRemindersEnabled ? "Enabled" : "Disabled"} />
            <Setting label="Follow-up suggestions" value={preferences.followUpSuggestionsEnabled ? "Enabled" : "Disabled"} />
            <Setting label="Due-soon window" value={`${preferences.dueSoonDays} days`} />
            <Setting label="Delivery channel" value={preferences.deliveryChannel.replace("_", " ")} />
          </section>
        ) : null}
      </div>
    </main>
  );
}

function Setting({ label, value }: { label: string; value: string }) {
  return (
    <article className="rounded border border-ink/10 bg-white p-5">
      <p className="text-sm text-ink/55">{label}</p>
      <p className="mt-2 text-lg font-semibold capitalize">{value}</p>
    </article>
  );
}
