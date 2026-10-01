import { Worker } from "bullmq";
import { Redis } from "ioredis";
import { createLogger } from "@jobos/logger";

const logger = createLogger("jobos-worker");
const connection = new Redis(process.env.REDIS_URL ?? "redis://localhost:6379", {
  maxRetriesPerRequest: null
});

const queues = ["ai", "email-sync", "document-parsing", "analytics", "notifications"];

for (const queueName of queues) {
  const worker = new Worker(
    queueName,
    async (job) => {
      logger.info({ queueName, jobId: job.id, name: job.name }, "received job");
    },
    { connection }
  );

  worker.on("failed", (job, error) => {
    logger.error({ queueName, jobId: job?.id, error }, "job failed");
  });
}

logger.info({ queues }, "JobOS workers started");
