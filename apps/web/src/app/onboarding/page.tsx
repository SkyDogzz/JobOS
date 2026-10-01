import Link from "next/link";
import { ArrowRight, CheckCircle2, Database, Download, ShieldCheck } from "lucide-react";

const steps = [
  { title: "Verify your profile", body: "Keep skills, location, and experience grounded before generating documents.", icon: CheckCircle2, href: "/settings/profile" },
  { title: "Import jobs", body: "Save target roles from manual paste, job boards, or the extension contract.", icon: Database, href: "/discover/manual" },
  { title: "Review privacy", body: "Confirm export redaction, email body storage, and AI artifact retention.", icon: ShieldCheck, href: "/settings" },
  { title: "Export a backup", body: "Download a machine-readable bundle before major account lifecycle changes.", icon: Download, href: "/settings/export" }
];

export default function OnboardingPage() {
  return (
    <main className="min-h-screen bg-paper px-5 py-6 text-ink sm:px-8 lg:px-10">
      <div className="mx-auto max-w-5xl">
        <section className="mb-8 border-b border-ink/10 pb-6">
          <h1 className="text-3xl font-semibold">Onboarding</h1>
          <p className="mt-2 max-w-2xl text-sm text-ink/60">A short path through the local beta setup before relying on JobOS for active search work.</p>
        </section>
        <div className="grid gap-4 md:grid-cols-2">
          {steps.map((step) => {
            const Icon = step.icon;
            return (
              <Link key={step.title} className="rounded border border-ink/10 bg-white p-5 hover:border-ink/30" href={step.href}>
                <div className="mb-4 flex items-center justify-between gap-3">
                  <Icon size={20} />
                  <ArrowRight size={16} />
                </div>
                <h2 className="font-semibold">{step.title}</h2>
                <p className="mt-2 text-sm text-ink/60">{step.body}</p>
              </Link>
            );
          })}
        </div>
      </div>
    </main>
  );
}
