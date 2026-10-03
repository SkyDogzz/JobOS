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
      usage: subscription?.subscription.usage ?? {},
      warnings: buildWarnings(subscription?.subscription.usage ?? {}, (effectivePlan?.limits ?? {}) as Limits)
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

  async consumeUsage(metric: string, quantity = 1, metadata: Record<string, unknown> = {}) {
    const userId = requireCurrentUserId();
    const current = await this.ensureSubscription(userId);
    const usage = { ...current.subscription.usage };
    const before = Number(usage[metric] ?? 0);
    const after = before + quantity;
    const limit = numericLimit((current.plan.limits as Limits)[metric]);
    if (limit !== null && after > limit) {
      await this.billing.createUsageEvent({
        userId,
        subscriptionId: current.subscription.id,
        metric,
        quantity,
        usageBefore: before,
        usageAfter: before,
        limitValue: limit,
        action: "limit_hit",
        metadata
      });
      throw new ForbiddenException(`Usage limit reached for ${metric}.`);
    }
    usage[metric] = after;
    await this.billing.updateUsage(current.subscription.id, usage);
    await this.billing.createUsageEvent({
      userId,
      subscriptionId: current.subscription.id,
      metric,
      quantity,
      usageBefore: before,
      usageAfter: after,
      limitValue: limit,
      action: "consume",
      metadata
    });
    return { metric, usageBefore: before, usageAfter: after, limitValue: limit };
  }

  async overrideUsage(body: unknown) {
    const userId = requireCurrentUserId();
    const input = parseOverride(body);
    const configuredToken = process.env.OPERATOR_USAGE_OVERRIDE_TOKEN ?? "local-operator-override";
    if (input.overrideToken !== configuredToken) throw new ForbiddenException("Operator override token is invalid.");
    const current = await this.ensureSubscription(userId);
    const usage = { ...current.subscription.usage };
    const before = Number(usage[input.metric] ?? 0);
    const after = Math.max(0, input.value);
    usage[input.metric] = after;
    await this.billing.updateUsage(current.subscription.id, usage);
    const limit = numericLimit((current.plan.limits as Limits)[input.metric]);
    const event = await this.billing.createUsageEvent({
      userId,
      subscriptionId: current.subscription.id,
      metric: input.metric,
      quantity: after - before,
      usageBefore: before,
      usageAfter: after,
      limitValue: limit,
      action: "operator_override",
      overrideReason: input.reason,
      metadata: { source: "billing_override" }
    });
    return { usage, event };
  }

  async listUsageEvents() {
    return this.billing.listUsageEvents(requireCurrentUserId());
  }

  private async ensureSubscription(userId: string) {
    const existing = await this.billing.getSubscriptionForUser(userId);
    if (existing) return existing;
    const freePlan = await this.billing.getPlanByCode("free");
    if (!freePlan) throw new NotFoundException("Free billing plan not found.");
    await this.billing.upsertLocalSubscription({ userId, planId: freePlan.id, planCode: freePlan.code });
    const created = await this.billing.getSubscriptionForUser(userId);
    if (!created) throw new NotFoundException("Billing subscription could not be created.");
    return created;
  }
}

function parseCheckout(body: unknown) {
  const value = body && typeof body === "object" ? (body as Record<string, unknown>).planCode : undefined;
  return { planCode: typeof value === "string" && value.trim() ? value.trim() : "pro" };
}

function parseOverride(body: unknown) {
  const input = body && typeof body === "object" ? body as Record<string, unknown> : {};
  const metric = typeof input.metric === "string" && input.metric.trim() ? input.metric.trim() : "aiGenerations";
  const value = Number(input.value ?? 0);
  const reason = typeof input.reason === "string" ? input.reason : "Operator adjustment";
  const overrideToken = typeof input.overrideToken === "string" ? input.overrideToken : "";
  return { metric, value: Number.isFinite(value) ? value : 0, reason, overrideToken };
}

function numericLimit(value: number | boolean | undefined) {
  return typeof value === "number" ? value : null;
}

function buildWarnings(usage: Record<string, number>, limits: Limits) {
  return Object.entries(limits)
    .filter(([, limit]) => typeof limit === "number")
    .map(([metric, limit]) => ({ metric, used: Number(usage[metric] ?? 0), limit: limit as number, remaining: Math.max(0, (limit as number) - Number(usage[metric] ?? 0)) }))
    .filter((item) => item.remaining <= Math.max(1, Math.ceil(item.limit * 0.2)));
}
