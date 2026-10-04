import { Injectable, NotFoundException } from "@nestjs/common";
import { requireCurrentUserId } from "../common/current-user.js";
import { CopilotRepository } from "./copilot.repository.js";

@Injectable()
export class CopilotService {
  constructor(private readonly copilot: CopilotRepository) {}

  async state() {
    const userId = requireCurrentUserId();
    const conversation = await this.copilot.ensureConversation(userId);
    const [messages, actions, grounding] = await Promise.all([
      this.copilot.listMessages(conversation.id),
      this.copilot.listActions(userId),
      this.copilot.groundingContext(userId)
    ]);
    return { conversation, messages, actions, grounding };
  }

  async chat(body: unknown) {
    const userId = requireCurrentUserId();
    const input = parseChat(body);
    const conversation = await this.copilot.ensureConversation(userId);
    const grounding = await this.copilot.groundingContext(userId);
    await this.copilot.createMessage({ conversationId: conversation.id, userId, role: "user", content: input.message });
    const plan = buildPlan(input.message, grounding);
    const assistant = await this.copilot.createMessage({ conversationId: conversation.id, userId, role: "assistant", content: plan.content, grounding: plan.grounding });
    const actions = await this.copilot.replacePendingActions({ conversationId: conversation.id, userId, actions: plan.actions });
    return { conversation, message: assistant, actions, grounding };
  }

  async approveAction(id: string) {
    const action = await this.copilot.updateActionStatus(id, requireCurrentUserId(), "accepted");
    if (!action) throw new NotFoundException("Copilot action not found.");
    return action;
  }

  async rejectAction(id: string) {
    const action = await this.copilot.updateActionStatus(id, requireCurrentUserId(), "rejected");
    if (!action) throw new NotFoundException("Copilot action not found.");
    return action;
  }
}

function parseChat(body: unknown) {
  const input = body && typeof body === "object" ? body as Record<string, unknown> : {};
  const message = typeof input.message === "string" && input.message.trim() ? input.message.trim() : "Plan my week";
  return { message };
}

type Grounding = Awaited<ReturnType<CopilotRepository["groundingContext"]>>;

function buildPlan(message: string, grounding: Grounding) {
  const staleApplications = grounding.applications.filter((app) => !["rejected", "withdrawn", "accepted"].includes(app.stage)).slice(0, 3);
  const topJob = grounding.savedJobs[0];
  const settings = grounding.settings;
  const actions = [
    topJob ? {
      kind: "draft_follow_up",
      title: `Draft a follow-up for ${topJob.title}`,
      rationale: `Grounded in saved job ${topJob.title}${topJob.companyName ? ` at ${topJob.companyName}` : ""}.`,
      proposedMutation: { type: "create_task", title: `Follow up on ${topJob.title}`, jobId: topJob.id },
      grounding: { jobId: topJob.id, source: "saved_job" },
      rollbackPlan: { type: "delete_created_task", requiresCreatedEntityId: true }
    } : null,
    staleApplications[0] ? {
      kind: "weekly_plan",
      title: `Review ${staleApplications.length} active applications`,
      rationale: `Grounded in active application stages: ${staleApplications.map((app) => app.stage).join(", ")}.`,
      proposedMutation: { type: "create_weekly_plan", applicationIds: staleApplications.map((app) => app.id) },
      grounding: { applicationIds: staleApplications.map((app) => app.id), source: "applications" },
      rollbackPlan: { type: "archive_generated_plan", requiresCreatedEntityId: true }
    } : null,
    {
      kind: "preference_check",
      title: "Refresh search preferences",
      rationale: settings ? `Grounded in settings for ${settings.remotePreference} work and ${settings.preferredLocations.length} preferred locations.` : "No settings were found, so this is grounded in missing preference data.",
      proposedMutation: { type: "open_settings_review", remotePreference: settings?.remotePreference ?? "any" },
      grounding: { settingsId: settings?.id ?? null, source: "settings" },
      rollbackPlan: { type: "no_mutation_until_approved" }
    }
  ].filter(Boolean) as Array<{ kind: string; title: string; rationale: string; proposedMutation: Record<string, unknown>; grounding: Record<string, unknown>; rollbackPlan: Record<string, unknown> }>;

  return {
    content: `I found ${grounding.savedJobs.length} saved jobs, ${grounding.applications.length} applications, ${grounding.resumeCount} resumes, and ${grounding.openTasks.length} open tasks. Based on "${message}", I prepared approval-gated next steps grounded in your stored JobOS data.`,
    grounding: {
      savedJobIds: grounding.savedJobs.map((job) => job.id),
      applicationIds: grounding.applications.map((app) => app.id),
      resumeCount: grounding.resumeCount,
      documentCount: grounding.documentCount,
      openTaskIds: grounding.openTasks.map((task) => task.id)
    },
    actions
  };
}
