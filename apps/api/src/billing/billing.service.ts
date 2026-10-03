import { ForbiddenException, Injectable, NotFoundException } from "@nestjs/common";
import { requireCurrentUserId } from "../common/current-user.js";
import { BillingRepository } from "./billing.repository.js";

type Entitlements = Record<string, boolean>;
type Limits = Record<string, number | boolean>;

@Injectable()
export class BillingService {
  constructor(private readonly billing: BillingRepository) {}

  async getBillingStatus() {
    const userId = requireCurrentUserId();
    const plans = await this.billing.listPlans();
    const subscription = await this.billing.getSubscriptionForUser(userId);
    const freePlan = plans.find((plan) => plan.code === "free") ?? null;
    const effectivePlan = subscription?.plan ?? freePlan;
    return {
      providerMode: process.env.STRIPE_SECRET_KEY ? "stripe_optional" : "local_fake",
      plans,
      subscription: subscription?.subscription ?? null,
      effectivePlan,
      entitlements: (effectivePlan?.entitlements ?? {}) as Entitlements,
      limits: (effectivePlan?.limits ?? {}) as Limits,
      usage: subscription?.subscription.usage ?? {}
    };
  }

  async startCheckout(body: unknown) {
    const userId = requireCurrentUserId();
    const input = parseCheckout(body);
    const plan = await this.billing.getPlanByCode(input.planCode);
    if (!plan || !plan.active) throw new NotFoundException("Billing plan not found.");
    const subscription = await this.billing.upsertLocalSubscription({ userId, planId: plan.id, planCode: plan.code });
    return {
      mode: process.env.STRIPE_SECRET_KEY ? "stripe_placeholder" : "local_fake",
      checkoutUrl: `jobos://billing/local-checkout?plan=${plan.code}`,
      subscription,
      plan
    };
  }

  async assertEntitlement(entitlement: string) {
    const status = await this.getBillingStatus();
    if (!status.entitlements[entitlement]) {
      throw new ForbiddenException(`Your current plan does not include ${entitlement}.`);
    }
    return status;
  }
}

function parseCheckout(body: unknown) {
  const value = body && typeof body === "object" ? (body as Record<string, unknown>).planCode : undefined;
  return { planCode: typeof value === "string" && value.trim() ? value.trim() : "pro" };
}
