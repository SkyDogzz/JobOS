import Link from "next/link";
import { ArrowLeft, Search } from "lucide-react";
import { getJobs } from "../../../lib/api";
import { ManualImportForm } from "./manual-import-form";

export default async function ManualImportPage() {
  const jobs = await getJobs().catch(() => []);

  return (
    <main className="min-h-screen bg-paper px-5 py-6 text-ink sm:px-8 lg:px-10">
      <div className="mx-auto max-w-5xl">
        <Link className="mb-6 inline-flex items-center gap-2 text-sm font-medium text-ink/65 hover:text-ink" href="/">
          <ArrowLeft size={16} />
          Dashboard
        </Link>
        <div className="mb-6 flex items-center gap-2">
          <Search size={20} />
          <h1 className="text-3xl font-semibold">Manual Job Import</h1>
        </div>
        <ManualImportForm existingJobs={jobs} />
      </div>
    </main>
  );
}
