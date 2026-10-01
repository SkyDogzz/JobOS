import Link from "next/link";
import { ArrowLeft, Bell, CheckCircle2 } from "lucide-react";
import { getNotifications } from "../../lib/api";

export default async function NotificationsPage() {
  const notifications = await getNotifications().catch(() => []);
  const unread = notifications.filter((notification) => notification.status !== "read");

  return (
    <main className="min-h-screen bg-paper px-5 py-6 text-ink sm:px-8 lg:px-10">
      <div className="mx-auto max-w-5xl">
        <Link className="mb-6 inline-flex items-center gap-2 text-sm font-medium text-ink/65 hover:text-ink" href="/">
          <ArrowLeft size={16} />
          Dashboard
        </Link>
        <section className="mb-8 border-b border-ink/10 pb-6">
          <div className="flex items-center gap-2">
            <Bell size={20} />
            <h1 className="text-3xl font-semibold">Notifications</h1>
          </div>
          <p className="mt-2 text-ink/65">{unread.length} pending reminders</p>
        </section>
        {notifications.length === 0 ? <p className="rounded border border-ink/10 bg-white p-5 text-sm text-ink/60">No reminders yet.</p> : null}
        <div className="grid gap-3">
          {notifications.map((notification) => (
            <article key={notification.id} className="rounded border border-ink/10 bg-white p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-medium uppercase text-ink/45">{notification.kind.replaceAll("_", " ")}</p>
                  <h2 className="mt-1 font-semibold">{notification.title}</h2>
                  <p className="mt-1 text-sm text-ink/60">{notification.body}</p>
                </div>
                <span className="inline-flex items-center gap-1 rounded bg-paper px-2 py-1 text-xs font-medium text-ink/60">
                  {notification.status === "read" ? <CheckCircle2 size={14} /> : <Bell size={14} />}
                  {notification.status}
                </span>
              </div>
              <p className="mt-3 text-xs text-ink/45">{notification.scheduledFor ? new Date(notification.scheduledFor).toLocaleString() : "Unscheduled"} · {notification.deliveryChannel}</p>
            </article>
          ))}
        </div>
      </div>
    </main>
  );
}
