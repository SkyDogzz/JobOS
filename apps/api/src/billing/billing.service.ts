import { createHmac, timingSafeEqual } from "node:crypto";
import { BadRequestException, ForbiddenException, Injectable, NotFoundException, UnauthorizedException } from "@nestjs/common";
import { requireCurrentUserId } from "../common/current-user.js";
import { BillingRepository } from "./billing.repository.js";

type Entitlements = Record<string, boolean>;
type Limits = Record<string, number | boolean>;
type ParsedWebhook = ReturnType<typeof parseWebhookPayload>;

@Injectable()
export class BillingService {
  constructor(private readonly billing: BillingRepository) {}

  async getBillingStatus() {
    const userId = requireCurrentUserId();
    const plans = await this.billing.listPlans();
    const subscription = await this.ensureSubscription(userId);
    const effectivePlan = subscription.plan;
    return {
      providerMode: process.env.STRIPE_SECRET_KEY ? "stripe_optional" : "local_fake",
      plans,
      subscription: subscription.subscription,
      effectivePlan,
      entitlements: (effectivePlan?.entitlements ?? {}) as Entitlements,
      limits: (effectivePlan?.limits ?? {}) as Limits,
      usage: subscription.subscription.usage ?? {},
      warnings: buildWarnings(subscription.subscription.usage ?? {}, (effectivePlan?.limits ?? {}) as Limits),
      upgradePrompts: buildUpgradePrompts((effectivePlan?.entitlements ?? {}) as Entitlements, (effectivePlan?.limits ?? {}) as Limits)
    };
  }

  async startCheckout(body: unknown) {
    const userId = requireCurrentUserId();
    const input = parseCheckout(body);
    const plan = await this.billing.getPlanByCode(input.planCode);
    if (!plan || !plan.active) throw new NotFoundException("Billing plan not found.");
    if (stripeConfigured()) {
      const customerId = stripeCustomerId(userId);
      const providerSubscriptionId = `sub_pending_${plan.code}_${userId.slice(0, 8)}`;
      const subscription = await this.billing.updateProviderMapping({
        userId,
        planId: plan.id,
        provider: "stripe",
        providerCustomerId: customerId,
        providerSubscriptionId,
        status: "incomplete"
      });
      return {
        mode: "stripe",
        checkoutUrl: stripeCheckoutUrl(plan.code, customerId, providerSubscriptionId),
        sessionId: `cs_test_jobos_${plan.code}_${userId.slice(0, 8)}`,
        customerId,
        providerSubscriptionId,
        subscription,
        plan
      };
    }
    const subscription = await this.billing.upsertLocalSubscription({ userId, planId: plan.id, planCode: plan.code });
    return {
      mode: "local_fake",
      checkoutUrl: `jobos://billing/local-checkout?plan=${plan.code}`,
      subscription,
      plan
    };
  }

  async createPortalLink() {
    const userId = requireCurrentUserId();
    const current = await this.ensureSubscription(userId);
    const customerId = current.subscription.providerCustomerId ?? stripeCustomerId(userId);
    return {
      mode: stripeConfigured() ? "stripe" : "local_fake",
      portalUrl: stripeConfigured() ? `${billingBaseUrl()}/stripe/portal/${customerId}` : `jobos://billing/local-portal?customer=${customerId}`,
      customerId,
      returnUrl: process.env.BILLING_PORTAL_RETURN_URL ?? `${appBaseUrl()}/settings`
    };
  }

  async handleWebhook(body: unknown, signature: string | undefined) {
    const payload = parseWebhookPayload(body);
    verifyWebhookSignature(payload, signature);
    const recorded = await this.billing.recordWebhookEvent({
      provider: "stripe",
      providerEventId: payload.id,
      eventType: payload.type,
      payload: payload.raw
    });
    if (!recorded) return { received: true, duplicate: true, eventId: payload.id };

    const result = await this.applyWebhookEvent(payload);
    return { received: true, duplicate: false, eventId: payload.id, eventType: payload.type, result };
  }

  async assertEntitlement(entitlement: string) {
    const status = await this.getBillingStatus();
    if (!status.entitlements[entitlement]) {
      throw new ForbiddenException({
        code: "PLAN_ENTITLEMENT_REQUIRED",
        entitlement,
        requiredPlan: requiredPlanFor(entitlement),
        message: `Your current plan does not include ${entitlement}.`
      });
    }
    return status;
  }

  async assertUsageAvailable(metric: string, quantity = 1, metadata: Record<string, unknown> = {}) {
    const userId = requireCurrentUserId();
    const current = await this.ensureSubscription(userId);
    const before = Number(current.subscription.usage?.[metric] ?? 0);
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
        metadata: { ...metadata, nonDestructive: true }
      });
      throw limitException(metric, before, quantity, limit);
    }
    return { metric, usageBefore: before, usageAfter: after, limitValue: limit };
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
      throw limitException(metric, before, quantity, limit);
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

  private async applyWebhookEvent(event: ParsedWebhook) {
    if (event.type === "checkout.session.completed") {
      const planCode = event.object.metadata.planCode ?? "premium";
      const plan = await this.billing.getPlanByCode(planCode);
      if (!plan || !plan.active) throw new NotFoundException("Billing plan not found.");
      const userId = event.object.metadata.userId;
      if (!userId) throw new BadRequestException("Webhook session is missing user mapping.");
      const subscription = await this.billing.updateProviderMapping({
        userId,
        planId: plan.id,
        provider: "stripe",
        providerCustomerId: event.object.customer,
        providerSubscriptionId: event.object.subscription,
        status: "active"
      });
      await this.auditBillingState(userId, subscription.id, event.type, { planCode: plan.code, customer: event.object.customer, subscription: event.object.subscription });
      return { status: "active", planCode: plan.code, subscriptionId: subscription.id };
    }

    if (["customer.subscription.created", "customer.subscription.updated", "customer.subscription.deleted"].includes(event.type)) {
      const providerSubscriptionId = event.object.id;
      const current = await this.billing.getSubscriptionByProviderSubscriptionId(providerSubscriptionId) ?? await this.billing.getSubscriptionByProviderCustomerId(event.object.customer);
      if (!current) throw new NotFoundException("Mapped billing subscription not found.");
      const planCode = event.object.metadata.planCode ?? current.plan.code;
      const plan = await this.billing.getPlanByCode(planCode);
      if (!plan || !plan.active) throw new NotFoundException("Billing plan not found.");
      const status = event.type === "customer.subscription.deleted" ? "canceled" : normalizeStripeStatus(event.object.status);
      const updated = await this.billing.updateSubscriptionFromProvider({
        providerSubscriptionId,
        providerCustomerId: event.object.customer,
        planId: plan.id,
        status,
        cancelAtPeriodEnd: event.object.cancelAtPeriodEnd,
        currentPeriodEnd: event.object.currentPeriodEnd ? new Date(event.object.currentPeriodEnd * 1000) : null
      });
      const subscription = updated ?? current.subscription;
      await this.auditBillingState(subscription.userId, subscription.id, event.type, { planCode: plan.code, status, providerSubscriptionId });
      return { status, planCode: plan.code, subscriptionId: subscription.id };
    }

    if (event.type === "invoice.payment_failed") {
      const providerSubscriptionId = event.object.subscription;
      const current = providerSubscriptionId ? await this.billing.getSubscriptionByProviderSubscriptionId(providerSubscriptionId) : null;
      if (!current) throw new NotFoundException("Mapped billing subscription not found.");
      const updated = await this.billing.updateSubscriptionFromProvider({
        providerSubscriptionId: current.subscription.providerSubscriptionId ?? providerSubscriptionId,
        providerCustomerId: current.subscription.providerCustomerId,
        planId: current.plan.id,
        status: "past_due",
        cancelAtPeriodEnd: current.subscription.cancelAtPeriodEnd,
        currentPeriodEnd: current.subscription.currentPeriodEnd
      });
      const subscription = updated ?? current.subscription;
      await this.auditBillingState(subscription.userId, subscription.id, event.type, { status: "past_due", providerSubscriptionId });
      return { status: "past_due", subscriptionId: subscription.id };
    }

    return { ignored: true };
  }

  private async auditBillingState(userId: string, subscriptionId: string, action: string, metadata: Record<string, unknown>) {
    return this.billing.createUsageEvent({
      userId,
      subscriptionId,
      metric: "billing_state",
      quantity: 0,
      usageBefore: 0,
      usageAfter: 0,
      limitValue: null,
      action,
      metadata
    });
  }
}

function parseCheckout(body: unknown) {
  const value = body && typeof body === "object" ? (body as Record<string, unknown>).planCode : undefined;
  return { planCode: typeof value === "string" && value.trim() ? value.trim() : "premium" };
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

function buildUpgradePrompts(entitlements: Entitlements, limits: Limits) {
  const prompts = [];
  if (!entitlements.premiumAi) prompts.push({ feature: "premiumAi", label: "Premium AI", requiredPlan: "premium" });
  if (!entitlements.providerSync) prompts.push({ feature: "providerSync", label: "Email and calendar sync", requiredPlan: "premium" });
  if (!entitlements.teamWorkspace) prompts.push({ feature: "teamWorkspace", label: "Team workspaces", requiredPlan: "team" });
  if (typeof limits.copilotMessages === "number" && limits.copilotMessages <= 10) prompts.push({ feature: "copilotMessages", label: "More copilot planning", requiredPlan: "premium" });
  return prompts;
}

function limitException(metric: string, usageBefore: number, quantity: number, limit: number) {
  return new ForbiddenException({
    code: "PLAN_LIMIT_REACHED",
    metric,
    usageBefore,
    requested: quantity,
    limit,
    remaining: Math.max(0, limit - usageBefore),
    requiredPlan: "premium",
    preserveDraft: true,
    message: `Usage limit reached for ${metric}. Upgrade to keep going without losing your work.`
  });
}

function requiredPlanFor(entitlement: string) {
  return entitlement === "teamWorkspace" ? "team" : "premium";
}

function stripeConfigured() {
  return Boolean(process.env.STRIPE_SECRET_KEY);
}

function stripeCustomerId(userId: string) {
  return `cus_jobos_${userId.slice(0, 12).replaceAll("-", "")}`;
}

function stripeCheckoutUrl(planCode: string, customerId: string, subscriptionId: string) {
  const priceId = process.env[`STRIPE_PRICE_${planCode.toUpperCase()}`] ?? `price_jobos_${planCode}`;
  return `${billingBaseUrl()}/stripe/checkout?price=${encodeURIComponent(priceId)}&customer=${encodeURIComponent(customerId)}&subscription=${encodeURIComponent(subscriptionId)}`;
}

function billingBaseUrl() {
  return process.env.BILLING_PUBLIC_URL ?? "https://billing.local.test";
}

function appBaseUrl() {
  return process.env.APP_BASE_URL ?? "http://localhost:3000";
}

function parseWebhookPayload(body: unknown) {
  const raw = body && typeof body === "object" ? body as Record<string, unknown> : {};
  const id = typeof raw.id === "string" && raw.id.trim() ? raw.id.trim() : "";
  const type = typeof raw.type === "string" && raw.type.trim() ? raw.type.trim() : "";
  const data = raw.data && typeof raw.data === "object" ? raw.data as Record<string, unknown> : {};
  const object = data.object && typeof data.object === "object" ? data.object as Record<string, unknown> : {};
  if (!id || !type) throw new BadRequestException("Webhook payload is missing id or type.");
  return { id, type, object: normalizeWebhookObject(object), raw };
}

function normalizeWebhookObject(object: Record<string, unknown>) {
  const metadataValue = object.metadata && typeof object.metadata === "object" ? object.metadata as Record<string, unknown> : {};
  const metadata = Object.fromEntries(Object.entries(metadataValue).filter(([, value]) => typeof value === "string")) as Record<string, string>;
  return {
    id: stringValue(object.id),
    customer: stringValue(object.customer),
    subscription: stringValue(object.subscription ?? object.id),
    status: stringValue(object.status) || "active",
    cancelAtPeriodEnd: Boolean(object.cancel_at_period_end ?? object.cancelAtPeriodEnd),
    currentPeriodEnd: numberValue(object.current_period_end ?? object.currentPeriodEnd),
    metadata
  };
}

function stringValue(value: unknown) {
  return typeof value === "string" ? value : "";
}

function numberValue(value: unknown) {
  const parsed = Number(value ?? 0);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
}

function verifyWebhookSignature(payload: ParsedWebhook, signature: string | undefined) {
  const secret = process.env.STRIPE_WEBHOOK_SECRET ?? "local-stripe-webhook-secret";
  if (!signature) throw new UnauthorizedException("Missing billing webhook signature.");
  const expected = createHmac("sha256", secret).update(stableJson(payload.raw)).digest("hex");
  const provided = signature.startsWith("sha256=") ? signature.slice("sha256=".length) : signature;
  const expectedBuffer = Buffer.from(expected, "hex");
  const providedBuffer = Buffer.from(provided, "hex");
  if (expectedBuffer.length !== providedBuffer.length || !timingSafeEqual(expectedBuffer, providedBuffer)) {
    throw new UnauthorizedException("Invalid billing webhook signature.");
  }
}

function stableJson(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(stableJson).join(",")}]`;
  if (value && typeof value === "object") {
    return `{${Object.entries(value as Record<string, unknown>)
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([key, entry]) => `${JSON.stringify(key)}:${stableJson(entry)}`)
      .join(",")}}`;
  }
  return JSON.stringify(value);
}

function normalizeStripeStatus(status: string) {
  if (["active", "trialing", "past_due", "unpaid", "canceled", "incomplete"].includes(status)) return status;
  return "active";
}
