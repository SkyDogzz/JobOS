import { Controller, Get, Header } from "@nestjs/common";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { observabilitySnapshot, prometheusMetrics } from "../common/observability.js";

function readProductVersion() {
  if (process.env.JOBOS_VERSION) return process.env.JOBOS_VERSION;
  for (const packagePath of [join(process.cwd(), "package.json"), join(process.cwd(), "..", "..", "package.json")]) {
    try {
      const manifest = JSON.parse(readFileSync(packagePath, "utf8")) as { name?: string; version?: string };
      if (manifest.name === "jobos" && manifest.version) return manifest.version;
    } catch {
      // Try the next likely runtime location.
    }
  }
  return "unknown";
}

const productVersion = readProductVersion();

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
      version: productVersion,
      uptimeSeconds: Math.round(process.uptime()),
      memory: {
        rss: memory.rss,
        heapUsed: memory.heapUsed,
        heapTotal: memory.heapTotal
      },
      monitoring: {
        rateLimitWindowMs: Number(process.env.RATE_LIMIT_WINDOW_MS ?? 60000),
        rateLimitMax: Number(process.env.RATE_LIMIT_MAX ?? 300)
      },
      observability: observabilitySnapshot()
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
      `jobos_api_rate_limit_max ${Number(process.env.RATE_LIMIT_MAX ?? 300)}`,
      ...prometheusMetrics()
    ].join("\n");
  }
}
