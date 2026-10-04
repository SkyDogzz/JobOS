import { Inject, Injectable } from "@nestjs/common";
import { asc, desc, eq } from "drizzle-orm";
import { billingPlans, billingUsageEvents, userSubscriptions } from "@jobos/database";
import { DATABASE } from "../database/database.module.js";
import type { JobOsDatabase } from "../database/database.types.js";

@Injectable()
export class BillingRepository {
  constructor(@Inject(DATABASE) private readonly db: JobOsDatabase) {}

  listPlans() {
    return this.db.select().from(billingPlans).where(eq(billingPlans.active, true)).orderBy(asc(billingPlans.monthlyPriceCents));
  }

  getPlanByCode(code: string) {
    return this.db.query.billingPlans.findFirst({ where: eq(billingPlans.code, code) });
  }

  async getSubscriptionForUser(userId: string) {
    const [row] = await this.db
      .select({ subscription: userSubscriptions, plan: billingPlans })
      .from(userSubscriptions)
      .innerJoin(billingPlans, eq(userSubscriptions.planId, billingPlans.id))
      .where(eq(userSubscriptions.userId, userId))
      .limit(1);
    return row ?? null;
  }

  async upsertLocalSubscription(input: { userId: string; planId: string; planCode: string }) {
    const now = new Date();
    const [subscription] = await this.db
      .insert(userSubscriptions)
      .values({
        userId: input.userId,
        planId: input.planId,
        status: "active",
        provider: "local_fake",
        providerCustomerId: `cus_local_${input.userId.slice(0, 8)}`,
        providerSubscriptionId: `sub_local_${input.planCode}_${input.userId.slice(0, 8)}`,
        currentPeriodEnd: new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000)
      })
      .onConflictDoUpdate({
        target: userSubscriptions.userId,
        set: {
          planId: input.planId,
          status: "active",
          provider: "local_fake",
          providerCustomerId: `cus_local_${input.userId.slice(0, 8)}`,
          providerSubscriptionId: `sub_local_${input.planCode}_${input.userId.slice(0, 8)}`,
          currentPeriodEnd: new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000),
          cancelAtPeriodEnd: false,
          updatedAt: now
        }
      })
      .returning();
    return subscription;
  }

  async updateUsage(subscriptionId: string, usage: Record<string, number>) {
    const [subscription] = await this.db
      .update(userSubscriptions)
      .set({ usage, updatedAt: new Date() })
      .where(eq(userSubscriptions.id, subscriptionId))
      .returning();
    return subscription;
  }

  async createUsageEvent(input: {
    userId: string;
    subscriptionId: string | null;
    metric: string;
    quantity: number;
    usageBefore: number;
    usageAfter: number;
    limitValue?: number | null;
    action: string;
    overrideReason?: string | null;
    metadata?: Record<string, unknown>;
  }) {
    const [event] = await this.db
      .insert(billingUsageEvents)
      .values({
        userId: input.userId,
        subscriptionId: input.subscriptionId,
        metric: input.metric,
        quantity: input.quantity,
        usageBefore: input.usageBefore,
        usageAfter: input.usageAfter,
        limitValue: input.limitValue ?? null,
        action: input.action,
        overrideReason: input.overrideReason ?? null,
        metadata: input.metadata ?? {}
      })
      .returning();
    return event;
  }

  listUsageEvents(userId: string) {
    return this.db.select().from(billingUsageEvents).where(eq(billingUsageEvents.userId, userId)).orderBy(desc(billingUsageEvents.createdAt)).limit(100);
  }
}
