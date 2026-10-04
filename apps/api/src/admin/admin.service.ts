import { ForbiddenException, Injectable, NotFoundException } from "@nestjs/common";
import { currentUserId } from "../common/current-user.js";
import { AdminRepository } from "./admin.repository.js";

@Injectable()
export class AdminService {
  constructor(private readonly admin: AdminRepository) {}

  searchUsers(query: Record<string, string | undefined>, token?: string) {
    assertAdminToken(token);
    return this.admin.searchUsers(query.q?.trim() ?? "");
  }

  auditTrail(query: Record<string, string | undefined>, token?: string) {
    assertAdminToken(token);
    return this.admin.auditTrail(query.userId);
  }

  failedJobs(token?: string) {
    assertAdminToken(token);
    return this.admin.failedJobs();
  }

  syncHealth(token?: string) {
    assertAdminToken(token);
    return this.admin.syncHealth();
  }

  async supportBundle(body: unknown, token?: string) {
    assertAdminToken(token);
    const input = parseBundle(body);
    const data = await this.admin.supportData(input.userId);
    if (!data.user) throw new NotFoundException("User not found.");
    const redactedPayload = redact(data);
    const bundle = await this.admin.createSupportBundle({
      requestedByUserId: currentUserId(),
      targetUserId: input.userId,
      reason: input.reason,
      redactedPayload
    });
    return { bundleId: bundle.id, createdAt: bundle.createdAt, reason: bundle.reason, payload: redactedPayload };
  }
}

function assertAdminToken(header: string | undefined) {
  const configured = process.env.ADMIN_SUPPORT_TOKEN ?? "local-admin-support";
  if (!header?.startsWith("Bearer ") || header.slice("Bearer ".length) !== configured) {
    throw new ForbiddenException("Admin support token required.");
  }
}

function parseBundle(body: unknown) {
  const input = body && typeof body === "object" ? body as Record<string, unknown> : {};
  const userId = typeof input.userId === "string" ? input.userId : "";
  const reason = typeof input.reason === "string" && input.reason.trim() ? input.reason.trim() : "Support diagnostics";
  if (!userId) throw new ForbiddenException("A target user is required.");
  return { userId, reason };
}

function redact(data: Awaited<ReturnType<AdminRepository["supportData"]>>) {
  return {
    user: data.user ? { id: data.user.id, emailDomain: data.user.email.split("@")[1] ?? "redacted", namePresent: Boolean(data.user.name), createdAt: data.user.createdAt } : null,
    jobs: data.jobs.map((job) => ({ ...job, title: redactText(job.title) })),
    failures: data.failures.map((job) => ({ id: job.id, queueName: job.queueName, jobName: job.jobName, status: job.status, attempts: job.attempts, lastError: job.lastError ? redactText(job.lastError) : null, createdAt: job.createdAt })),
    usage: data.usage.map((event) => ({ metric: event.metric, quantity: event.quantity, action: event.action, createdAt: event.createdAt }))
  };
}

function redactText(value: string) {
  return value.length <= 4 ? "[redacted]" : `${value.slice(0, 2)}...[redacted]`;
}
