import { Inject, Injectable } from "@nestjs/common";
import { eq } from "drizzle-orm";
import { billingPlans, userSubscriptions } from "@jobos/database";
import { DATABASE } from "../database/database.module.js";
import type { JobOsDatabase } from "../database/database.types.js";

@Injectable()
export class BillingRepository {
  constructor(@Inject(DATABASE) private readonly db: JobOsDatabase) {}

  listPlans() {
    return this.db.select().from(billingPlans).where(eq(billingPlans.active, true));
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
}
