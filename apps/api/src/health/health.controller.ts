import { Controller, Get } from "@nestjs/common";

@Controller("health")
export class HealthController {
  @Get()
  check() {
    return { status: "ok", service: "jobos-api" };
  }

  @Get("metrics")
  metrics() {
    const memory = process.memoryUsage();
    return {
      service: "jobos-api",
      version: "0.9.0",
      uptimeSeconds: Math.round(process.uptime()),
      memory: {
        rss: memory.rss,
        heapUsed: memory.heapUsed,
        heapTotal: memory.heapTotal
      },
      monitoring: {
        rateLimitWindowMs: Number(process.env.RATE_LIMIT_WINDOW_MS ?? 60000),
        rateLimitMax: Number(process.env.RATE_LIMIT_MAX ?? 300)
      }
    };
  }
}
