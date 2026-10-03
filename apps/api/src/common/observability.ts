type MetricKey = "requests" | "failures" | "jobImports" | "aiGenerations" | "syncs";

const counters: Record<MetricKey, number> = {
  requests: 0,
  failures: 0,
  jobImports: 0,
  aiGenerations: 0,
  syncs: 0
};

const latencyBuckets = [50, 100, 250, 500, 1000, 2500, 5000];
const requestLatency = latencyBuckets.map((le) => ({ le, count: 0 }));
const traces: Array<{ name: string; durationMs: number; status: string; at: string }> = [];
const errors: Array<{ message: string; context: Record<string, unknown>; at: string }> = [];

export function observeRequest(path: string, method: string, statusCode: number, durationMs: number) {
  counters.requests += 1;
  if (statusCode >= 500) counters.failures += 1;
  if (path === "/jobs/import" && method === "POST") counters.jobImports += 1;
  if (path.startsWith("/ai/")) counters.aiGenerations += 1;
  if (path.includes("/sync")) counters.syncs += 1;
  for (const bucket of requestLatency) {
    if (durationMs <= bucket.le) bucket.count += 1;
  }
  traces.unshift({ name: `${method} ${path}`, durationMs, status: String(statusCode), at: new Date().toISOString() });
  traces.splice(25);
}

export function captureError(error: unknown, context: Record<string, unknown>) {
  counters.failures += 1;
  errors.unshift({
    message: error instanceof Error ? error.message : "Unknown error",
    context: redact(context) as Record<string, unknown>,
    at: new Date().toISOString()
  });
  errors.splice(25);
}

export function observabilitySnapshot() {
  return { counters, requestLatency, traces, errors };
}

export function prometheusMetrics() {
  return [
    "# HELP jobos_api_requests_total Total API requests.",
    "# TYPE jobos_api_requests_total counter",
    `jobos_api_requests_total ${counters.requests}`,
    "# HELP jobos_api_failures_total Total observed API failures.",
    "# TYPE jobos_api_failures_total counter",
    `jobos_api_failures_total ${counters.failures}`,
    "# HELP jobos_job_imports_total Browser/manual job imports.",
    "# TYPE jobos_job_imports_total counter",
    `jobos_job_imports_total ${counters.jobImports}`,
    "# HELP jobos_ai_generations_total AI generation requests.",
    "# TYPE jobos_ai_generations_total counter",
    `jobos_ai_generations_total ${counters.aiGenerations}`,
    "# HELP jobos_syncs_total Integration sync requests.",
    "# TYPE jobos_syncs_total counter",
    `jobos_syncs_total ${counters.syncs}`,
    "# HELP jobos_api_request_duration_ms API request latency histogram.",
    "# TYPE jobos_api_request_duration_ms histogram",
    ...requestLatency.map((bucket) => `jobos_api_request_duration_ms_bucket{le="${bucket.le}"} ${bucket.count}`)
  ];
}

export function redact(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(redact);
  if (!value || typeof value !== "object") return value;
  return Object.fromEntries(Object.entries(value).map(([key, entry]) => {
    if (/token|password|secret|authorization|cookie|body|content/i.test(key)) return [key, "[REDACTED]"];
    return [key, redact(entry)];
  }));
}
