import { Injectable, NotFoundException } from "@nestjs/common";
import { strategyGoalsSchema } from "@jobos/validation";
import { parseBody } from "../common/validation.js";
import { StrategyRepository } from "./strategy.repository.js";

@Injectable()
export class StrategyService {
  constructor(private readonly strategy: StrategyRepository) {}

  async current(query: Record<string, string | undefined>) {
    const weekStartsAt = query.weekStartsAt ? new Date(query.weekStartsAt) : startOfWeek(new Date());
    const snapshot = await this.strategy.snapshot(weekStartsAt);
    const existing = await this.strategy.current(weekStartsAt);
    if (existing) return existing;
    return this.strategy.upsert({ weekStartsAt: weekStartsAt.toISOString(), goals: defaultGoals() }, snapshot);
  }

  async upsert(body: unknown) {
    const input = parseBody(strategyGoalsSchema, body);
    const weekStartsAt = input.weekStartsAt ? new Date(input.weekStartsAt) : startOfWeek(new Date());
    const snapshot = await this.strategy.snapshot(weekStartsAt);
    return this.strategy.upsert({ ...input, weekStartsAt: weekStartsAt.toISOString() }, snapshot);
  }

  async generateTasks(planId: string) {
    const current = await this.strategy.current(startOfWeek(new Date()));
    const plan = current?.id === planId ? current : null;
    if (!plan) throw new NotFoundException("Strategy plan not found for the current week.");
    return this.strategy.createGeneratedTasks(plan.id, plan.recommendations);
  }
}

function startOfWeek(date: Date) {
  const start = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
  const day = start.getUTCDay();
  start.setUTCDate(start.getUTCDate() - ((day + 6) % 7));
  return start;
}

function defaultGoals() {
  return { applications: 5, networking: 3, followUps: 3, interviews: 1, resumeIterations: 1 };
}
