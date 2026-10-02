import { randomBytes } from "node:crypto";
import { Inject, Injectable } from "@nestjs/common";
import { and, asc, eq } from "drizzle-orm";
import { applicationEvents, applications, applicationSharePackets, companies, jobs, resumeVersions, reviewerComments } from "@jobos/database";
import type { CreateReviewerCommentInput, CreateSharePacketInput } from "@jobos/validation";
import { requireCurrentUserId } from "../common/current-user.js";
import { DATABASE } from "../database/database.module.js";
import type { JobOsDatabase } from "../database/database.types.js";

@Injectable()
export class SharingRepository {
  constructor(@Inject(DATABASE) private readonly db: JobOsDatabase) {}

  listForApplication(applicationId: string) {
    const userId = requireCurrentUserId();
    return this.db
      .select()
      .from(applicationSharePackets)
      .where(and(eq(applicationSharePackets.applicationId, applicationId), eq(applicationSharePackets.userId, userId)))
      .orderBy(asc(applicationSharePackets.createdAt));
  }

  async createPacket(applicationId: string, input: CreateSharePacketInput) {
    const userId = requireCurrentUserId();
    const [application] = await this.db.select({ id: applications.id }).from(applications).where(and(eq(applications.id, applicationId), eq(applications.userId, userId))).limit(1);
    if (!application) return null;

    const [packet] = await this.db
      .insert(applicationSharePackets)
      .values({
        applicationId,
        userId,
        token: randomBytes(24).toString("base64url"),
        audience: input.audience,
        recipientName: input.recipientName,
        recipientEmail: input.recipientEmail,
        expiresAt: new Date(input.expiresAt)
      })
      .returning();

    await this.recordEvent(applicationId, "share_created", { sharePacketId: packet.id, audience: packet.audience, recipientEmail: packet.recipientEmail, expiresAt: packet.expiresAt.toISOString() });
    return packet;
  }

  async revokePacket(packetId: string) {
    const userId = requireCurrentUserId();
    const [packet] = await this.db
      .select({ id: applicationSharePackets.id, applicationId: applicationSharePackets.applicationId })
      .from(applicationSharePackets)
      .where(and(eq(applicationSharePackets.id, packetId), eq(applicationSharePackets.userId, userId)))
      .limit(1);
    if (!packet) return null;

    const [updated] = await this.db.update(applicationSharePackets).set({ revokedAt: new Date(), updatedAt: new Date() }).where(eq(applicationSharePackets.id, packetId)).returning();
    await this.recordEvent(packet.applicationId, "share_revoked", { sharePacketId: packet.id });
    return updated;
  }

  async viewSharedPacket(token: string) {
    const packet = await this.activePacket(token);
    if (packet === "expired" || !packet) return packet;

    await this.db.update(applicationSharePackets).set({ lastViewedAt: new Date(), updatedAt: new Date() }).where(eq(applicationSharePackets.id, packet.id));
    await this.recordEvent(packet.applicationId, "share_viewed", { sharePacketId: packet.id, audience: packet.audience });

    const [application] = await this.sharedApplication(packet.applicationId);
    const comments = await this.commentsForApplication(packet.applicationId);
    return { packet: redactPacket(packet), application, comments };
  }

  async createPublicComment(token: string, input: CreateReviewerCommentInput) {
    const packet = await this.activePacket(token);
    if (packet === "expired" || !packet) return packet;

    const [comment] = await this.db
      .insert(reviewerComments)
      .values({
        sharePacketId: packet.id,
        applicationId: packet.applicationId,
        resumeVersionId: input.resumeVersionId,
        documentId: input.documentId,
        authorName: input.authorName,
        targetType: input.targetType,
        body: input.body
      })
      .returning();
    await this.recordEvent(packet.applicationId, "share_commented", { sharePacketId: packet.id, commentId: comment.id, targetType: comment.targetType });
    return comment;
  }

  private async activePacket(token: string) {
    const [packet] = await this.db.select().from(applicationSharePackets).where(eq(applicationSharePackets.token, token)).limit(1);
    if (!packet) return null;
    if (packet.revokedAt || packet.expiresAt <= new Date()) return "expired" as const;
    return packet;
  }

  private sharedApplication(applicationId: string) {
    return this.db
      .select({
        id: applications.id,
        stage: applications.stage,
        appliedAt: applications.appliedAt,
        jobTitle: jobs.title,
        jobDescription: jobs.description,
        companyName: companies.name,
        resumeTitle: resumeVersions.title,
        resumeContent: resumeVersions.content
      })
      .from(applications)
      .innerJoin(jobs, eq(applications.jobId, jobs.id))
      .leftJoin(companies, eq(jobs.companyId, companies.id))
      .leftJoin(resumeVersions, eq(applications.resumeVersionId, resumeVersions.id))
      .where(eq(applications.id, applicationId))
      .limit(1);
  }

  private commentsForApplication(applicationId: string) {
    return this.db
      .select({
        id: reviewerComments.id,
        authorName: reviewerComments.authorName,
        targetType: reviewerComments.targetType,
        resumeVersionId: reviewerComments.resumeVersionId,
        documentId: reviewerComments.documentId,
        body: reviewerComments.body,
        createdAt: reviewerComments.createdAt
      })
      .from(reviewerComments)
      .where(eq(reviewerComments.applicationId, applicationId))
      .orderBy(asc(reviewerComments.createdAt));
  }

  private recordEvent(applicationId: string, kind: typeof applicationEvents.$inferInsert.kind, payload: Record<string, unknown>) {
    return this.db.insert(applicationEvents).values({ applicationId, kind, payload });
  }
}

function redactPacket(packet: typeof applicationSharePackets.$inferSelect) {
  return {
    id: packet.id,
    audience: packet.audience,
    recipientName: packet.recipientName,
    expiresAt: packet.expiresAt,
    revokedAt: packet.revokedAt,
    lastViewedAt: packet.lastViewedAt
  };
}
