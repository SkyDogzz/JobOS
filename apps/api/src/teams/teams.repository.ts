import { Inject, Injectable } from "@nestjs/common";
import { and, eq } from "drizzle-orm";
import { jobs, organizationMemberships, organizations, users } from "@jobos/database";
import { DATABASE } from "../database/database.module.js";
import type { JobOsDatabase } from "../database/database.types.js";

@Injectable()
export class TeamsRepository {
  constructor(@Inject(DATABASE) private readonly db: JobOsDatabase) {}

  listMemberships(userId: string) {
    return this.db
      .select({ membership: organizationMemberships, organization: organizations })
      .from(organizationMemberships)
      .innerJoin(organizations, eq(organizationMemberships.organizationId, organizations.id))
      .where(and(eq(organizationMemberships.userId, userId), eq(organizationMemberships.status, "active")));
  }

  findMembership(organizationId: string, userId: string) {
    return this.db.query.organizationMemberships.findFirst({
      where: and(eq(organizationMemberships.organizationId, organizationId), eq(organizationMemberships.userId, userId), eq(organizationMemberships.status, "active"))
    });
  }

  async createOrganization(input: { ownerUserId: string; name: string; slug: string; kind: "personal" | "team"; settings: Record<string, unknown> }) {
    return this.db.transaction(async (tx) => {
      const [organization] = await tx.insert(organizations).values(input).returning();
      await tx.insert(organizationMemberships).values({ organizationId: organization.id, userId: input.ownerUserId, role: "owner", status: "active" });
      return organization;
    });
  }

  async updateSettings(organizationId: string, settings: Record<string, unknown>) {
    const [organization] = await this.db.update(organizations).set({ settings, updatedAt: new Date() }).where(eq(organizations.id, organizationId)).returning();
    return organization ?? null;
  }

  async addMembership(input: { organizationId: string; email: string; role: "admin" | "editor" | "viewer" }) {
    const [user] = await this.db.select().from(users).where(eq(users.email, input.email.toLowerCase())).limit(1);
    if (!user) return null;
    const [membership] = await this.db
      .insert(organizationMemberships)
      .values({ organizationId: input.organizationId, userId: user.id, role: input.role, status: "active", invitedEmail: input.email.toLowerCase() })
      .onConflictDoUpdate({
        target: [organizationMemberships.organizationId, organizationMemberships.userId],
        set: { role: input.role, status: "active", updatedAt: new Date() }
      })
      .returning();
    return membership;
  }

  async listWorkspaceJobs(organizationId: string) {
    return this.db.select().from(jobs).where(eq(jobs.workspaceId, organizationId));
  }
}
