import { createHash } from "node:crypto";
import { Inject, Injectable } from "@nestjs/common";
import { desc, eq } from "drizzle-orm";
import { aiArtifacts, applications, candidateProfiles, documents, groundingReviews, jobs, resumeVersions, users } from "@jobos/database";
import type { ApproveCoverLetterInput, ApproveTailoredResumeInput, UpdateGroundingReviewInput } from "@jobos/validation";
import { requireCurrentUserId } from "../common/current-user.js";
import { DATABASE } from "../database/database.module.js";
import type { JobOsDatabase } from "../database/database.types.js";

@Injectable()
export class AiRepository {
  constructor(@Inject(DATABASE) private readonly db: JobOsDatabase) {}

  async loadTailoringContext(jobId: string, resumeVersionId: string) {
    const [job] = await this.db.select().from(jobs).where(eq(jobs.id, jobId)).limit(1);
    const [resumeVersion] = await this.db.select().from(resumeVersions).where(eq(resumeVersions.id, resumeVersionId)).limit(1);
    const userId = requireCurrentUserId();
    const [profile] = await this.db.select().from(candidateProfiles).where(eq(candidateProfiles.userId, userId)).limit(1);
    return job && resumeVersion ? { job, resumeVersion, profile, userId } : null;
  }

  async loadCoverLetterContext(jobId: string, resumeVersionId: string, applicationId?: string) {
    const context = await this.loadTailoringContext(jobId, resumeVersionId);
    if (!context) return null;
    if (!applicationId) return { ...context, application: null };
    const [application] = await this.db.select().from(applications).where(eq(applications.id, applicationId)).limit(1);
    return application ? { ...context, application } : null;
  }

  async saveArtifact(input: { userId: string; provider: string; model: string; purpose: string; promptHash: string; output: Record<string, unknown>; groundedInProfile: boolean }) {
    const [artifact] = await this.db.insert(aiArtifacts).values(input).returning();
    return artifact;
  }

  async createGroundingReviews(artifactId: string, claims: string[], evidence: Record<string, unknown>) {
    if (claims.length === 0) return [];
    return this.db.insert(groundingReviews).values(claims.map((claim) => ({ artifactId, claim, evidence }))).returning();
  }

  async listGroundingReviews() {
    return this.db
      .select({
        id: groundingReviews.id,
        artifactId: groundingReviews.artifactId,
        claim: groundingReviews.claim,
        evidence: groundingReviews.evidence,
        status: groundingReviews.status,
        reviewerNote: groundingReviews.reviewerNote,
        createdAt: groundingReviews.createdAt,
        updatedAt: groundingReviews.updatedAt,
        purpose: aiArtifacts.purpose,
        provider: aiArtifacts.provider,
        model: aiArtifacts.model
      })
      .from(groundingReviews)
      .innerJoin(aiArtifacts, eq(groundingReviews.artifactId, aiArtifacts.id))
      .orderBy(desc(groundingReviews.createdAt));
  }

  async listGroundingReviewsForArtifact(artifactId: string) {
    return this.db.select().from(groundingReviews).where(eq(groundingReviews.artifactId, artifactId)).orderBy(desc(groundingReviews.createdAt));
  }

  async updateGroundingReview(id: string, input: UpdateGroundingReviewInput) {
    const [review] = await this.db.update(groundingReviews).set({ ...input, updatedAt: new Date() }).where(eq(groundingReviews.id, id)).returning();
    return review ?? null;
  }

  async approveTailoredResume(input: ApproveTailoredResumeInput) {
    const [latest] = await this.db
      .select({ versionNumber: resumeVersions.versionNumber })
      .from(resumeVersions)
      .where(eq(resumeVersions.resumeId, input.resumeId))
      .orderBy(desc(resumeVersions.versionNumber))
      .limit(1);
    const [version] = await this.db.insert(resumeVersions).values({
      resumeId: input.resumeId,
      versionNumber: (latest?.versionNumber ?? 0) + 1,
      title: input.title,
      content: {
        ...input.draft,
        metadata: {
          ...input.metadata,
          source: "cv_tailoring",
          sourceVersionId: input.sourceVersionId,
          targetJobId: input.jobId,
          promptHash: input.promptHash,
          approvedAt: new Date().toISOString()
        }
      }
    }).returning();
    return version;
  }

  async approveCoverLetter(input: ApproveCoverLetterInput) {
    if (input.variant.groundedClaims.length === 0) {
      throw new Error("Cover letter approval requires at least one grounded claim.");
    }
    const context = await this.loadCoverLetterContext(input.jobId, input.resumeVersionId, input.applicationId);
    if (!context) return null;
    const content = {
      ...input.variant,
      metadata: {
        ...input.metadata,
        source: "cover_letter_generation",
        artifactId: input.artifactId,
        promptHash: input.promptHash,
        targetJobId: input.jobId,
        sourceVersionId: input.resumeVersionId,
        approvedAt: new Date().toISOString()
      }
    };
    const contentHash = this.hashPrompt(JSON.stringify(content));
    const [document] = await this.db.insert(documents).values({
      userId: context.userId,
      applicationId: input.applicationId,
      kind: "cover_letter",
      name: input.name,
      storageKey: `local/documents/${input.applicationId}/${contentHash}.json`,
      contentHash,
      content
    }).returning();
    return document;
  }

  hashPrompt(prompt: string) {
    return createHash("sha256").update(prompt).digest("hex");
  }}
