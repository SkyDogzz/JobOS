import { Inject, Injectable } from "@nestjs/common";
import { asc, eq } from "drizzle-orm";
import {
  aiArtifacts,
  applicationContacts,
  applicationEvents,
  applications,
  atsAnalyses,
  candidateProfiles,
  companies,
  contacts,
  documents,
  groundingReviews,
  jobResumeMatches,
  jobs,
  notes,
  notificationPreferences,
  notifications,
  resumeVersions,
  resumes,
  tasks,
  userSettings,
  users
} from "@jobos/database";
import type { AccountDeletionInput } from "@jobos/validation";
import { devUser } from "../common/dev-user.js";
import { DATABASE } from "../database/database.module.js";
import type { JobOsDatabase } from "../database/database.types.js";

@Injectable()
export class AccountRepository {
  constructor(@Inject(DATABASE) private readonly db: JobOsDatabase) {}

  async exportBundle() {
    const user = await this.ensureDevUser();
    const [
      profileRows,
      settingRows,
      notificationPreferenceRows,
      companyRows,
      contactRows,
      jobRows,
      resumeRows,
      resumeVersionRows,
      applicationRows,
      applicationContactRows,
      eventRows,
      noteRows,
      taskRows,
      documentRows,
      artifactRows,
      groundingReviewRows,
      atsRows,
      matchRows,
      notificationRows
    ] = await Promise.all([
      this.db.select().from(candidateProfiles).where(eq(candidateProfiles.userId, user.id)).orderBy(asc(candidateProfiles.createdAt)),
      this.db.select().from(userSettings).where(eq(userSettings.userId, user.id)).orderBy(asc(userSettings.createdAt)),
      this.db.select().from(notificationPreferences).where(eq(notificationPreferences.userId, user.id)).orderBy(asc(notificationPreferences.createdAt)),
      this.db.select().from(companies).orderBy(asc(companies.name)),
      this.db.select().from(contacts).where(eq(contacts.userId, user.id)).orderBy(asc(contacts.name)),
      this.db.select().from(jobs).orderBy(asc(jobs.createdAt)),
      this.db.select().from(resumes).where(eq(resumes.userId, user.id)).orderBy(asc(resumes.createdAt)),
      this.db.select().from(resumeVersions).orderBy(asc(resumeVersions.createdAt)),
      this.db.select().from(applications).where(eq(applications.userId, user.id)).orderBy(asc(applications.createdAt)),
      this.db.select().from(applicationContacts).orderBy(asc(applicationContacts.createdAt)),
      this.db.select().from(applicationEvents).orderBy(asc(applicationEvents.createdAt)),
      this.db.select().from(notes).orderBy(asc(notes.createdAt)),
      this.db.select().from(tasks).where(eq(tasks.userId, user.id)).orderBy(asc(tasks.createdAt)),
      this.db.select().from(documents).where(eq(documents.userId, user.id)).orderBy(asc(documents.createdAt)),
      this.db.select().from(aiArtifacts).where(eq(aiArtifacts.userId, user.id)).orderBy(asc(aiArtifacts.createdAt)),
      this.db.select().from(groundingReviews).orderBy(asc(groundingReviews.createdAt)),
      this.db.select().from(atsAnalyses).orderBy(asc(atsAnalyses.createdAt)),
      this.db.select().from(jobResumeMatches).orderBy(asc(jobResumeMatches.createdAt)),
      this.db.select().from(notifications).where(eq(notifications.userId, user.id)).orderBy(asc(notifications.createdAt))
    ]);

    const settings = settingRows[0] ?? null;
    const redact = settings?.redactSensitiveExports ?? true;
    const bundle = {
      exportedAt: new Date().toISOString(),
      formatVersion: "0.8.2",
      user: { id: user.id, email: user.email, name: user.name, emailVerifiedAt: user.emailVerifiedAt, createdAt: user.createdAt },
      profile: profileRows[0] ?? null,
      settings,
      notificationPreferences: notificationPreferenceRows[0] ?? null,
      companies: companyRows,
      contacts: contactRows,
      jobs: jobRows,
      applications: applicationRows,
      applicationContacts: applicationContactRows,
      applicationEvents: eventRows,
      resumes: resumeRows,
      resumeVersions: resumeVersionRows,
      documents: documentRows,
      notes: noteRows,
      tasks: taskRows,
      aiArtifacts: artifactRows,
      groundingReviews: groundingReviewRows,
      atsAnalyses: atsRows,
      jobResumeMatches: matchRows,
      notifications: notificationRows
    };
    return redact ? redactBundle(bundle) : bundle;
  }

  async deletionPreview(input: AccountDeletionInput) {
    const user = await this.ensureDevUser();
    if (input.confirmEmail !== user.email) {
      return { status: "confirmation_mismatch", deleted: false, counts: null };
    }
    const bundle = await this.exportBundle();
    const counts = {
      jobs: bundle.jobs.length,
      applications: bundle.applications.length,
      resumes: bundle.resumes.length,
      documents: bundle.documents.length,
      tasks: bundle.tasks.length,
      aiArtifacts: bundle.aiArtifacts.length
    };
    if (input.dryRun) {
      return { status: "dry_run", deleted: false, counts };
    }
    await this.db.delete(users).where(eq(users.id, user.id));
    return { status: "deleted", deleted: true, counts };
  }

  private async ensureDevUser() {
    await this.db.insert(users).values(devUser).onConflictDoNothing({ target: users.email });
    const [user] = await this.db.select().from(users).where(eq(users.email, devUser.email)).limit(1);
    return user;
  }
}

function redactBundle<T extends Record<string, unknown>>(bundle: T): T {
  return redactValue(bundle) as T;
}

function redactValue(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(redactValue);
  if (!value || typeof value !== "object" || value instanceof Date) return value;
  const output: Record<string, unknown> = {};
  for (const [key, item] of Object.entries(value)) {
    const normalized = key.toLowerCase();
    if (normalized.includes("email") || normalized.includes("passwordhash")) {
      output[key] = item ? "[redacted]" : item;
    } else if (normalized === "body" && typeof item === "string") {
      output[key] = "[redacted]";
    } else {
      output[key] = redactValue(item);
    }
  }
  return output;
}
