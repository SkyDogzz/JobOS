import { Controller, Get, Header } from "@nestjs/common";

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
      version: "1.0.0",
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

  @Get("metrics/prometheus")
  @Header("Content-Type", "text/plain; version=0.0.4")
  prometheus() {
    const memory = process.memoryUsage();
    const uptime = Math.round(process.uptime());
    return [
      "# HELP jobos_api_uptime_seconds API process uptime in seconds.",
      "# TYPE jobos_api_uptime_seconds gauge",
      `jobos_api_uptime_seconds ${uptime}`,
      "# HELP jobos_api_heap_used_bytes API heap used in bytes.",
      "# TYPE jobos_api_heap_used_bytes gauge",
      `jobos_api_heap_used_bytes ${memory.heapUsed}`,
      "# HELP jobos_api_rate_limit_max Configured request limit per window.",
      "# TYPE jobos_api_rate_limit_max gauge",
      `jobos_api_rate_limit_max ${Number(process.env.RATE_LIMIT_MAX ?? 300)}`
    ].join("\n");
  }
}
