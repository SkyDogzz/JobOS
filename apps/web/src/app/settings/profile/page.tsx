import Link from "next/link";
import { ArrowLeft, UserRound } from "lucide-react";
import { getCandidateProfile } from "../../../lib/api";
import { ProfileForm } from "./profile-form";

export default async function ProfilePage() {
  const profile = await getCandidateProfile().catch(() => null);

  return (
    <main className="min-h-screen bg-paper px-5 py-6 text-ink sm:px-8 lg:px-10">
      <div className="mx-auto max-w-4xl">
        <Link className="mb-6 inline-flex items-center gap-2 text-sm font-medium text-ink/65 hover:text-ink" href="/">
          <ArrowLeft size={16} />
          Dashboard
        </Link>
        <div className="mb-6 flex items-center gap-2">
          <UserRound size={20} />
          <h1 className="text-3xl font-semibold">Candidate Profile</h1>
        </div>
        <p className="mb-6 text-sm text-ink/60">This profile is the canonical grounding source for future AI-assisted writing.</p>
        <ProfileForm profile={profile} />
      </div>
    </main>
  );
}

