import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { getApplications, getInterviews } from "../../lib/api";
import { InterviewsClient } from "./interviews-client";

export default async function InterviewsPage() {
  const [applications, interviews] = await Promise.all([
    getApplications().catch(() => []),
    getInterviews().catch(() => [])
  ]);

  return (
    <main className="min-h-screen bg-paper px-5 py-6 text-ink sm:px-8 lg:px-10">
      <div className="mx-auto max-w-6xl">
        <Link className="mb-6 inline-flex items-center gap-2 text-sm font-medium text-ink/65 hover:text-ink" href="/">
          <ArrowLeft size={16} />
          Dashboard
        </Link>
        <section className="mb-8 border-b border-ink/10 pb-6">
          <h1 className="text-3xl font-semibold">Interviews</h1>
          <p className="mt-2 text-ink/65">Schedule interviews, track prep, and keep application timelines current.</p>
        </section>
        <InterviewsClient initialApplications={applications} initialInterviews={interviews} />
      </div>
    </main>
  );
}
