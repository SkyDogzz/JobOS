import { Queue, Worker } from "bullmq";
import { Redis } from "ioredis";
import { createLogger } from "@jobos/logger";

const logger = createLogger("jobos-worker");
const connection = new Redis(process.env.REDIS_URL ?? "redis://localhost:6379", {
  maxRetriesPerRequest: null
});

const queues = ["ai", "email-sync", "document-parsing", "analytics", "notifications"];

for (const queueName of queues) {
  const queue = new Queue(queueName, {
    connection,
    defaultJobOptions: {
      attempts: Number(process.env.WORKER_MAX_ATTEMPTS ?? 3),
      backoff: { type: "exponential", delay: Number(process.env.WORKER_RETRY_DELAY_MS ?? 1000) },
      removeOnComplete: 100,
      removeOnFail: false
    }
  });

  const worker = new Worker(
    queueName,
    async (job) => {
      const idempotencyKey = job.opts.jobId ?? `${queueName}:${job.name}:${job.id}`;
      logger.info({ queueName, jobId: job.id, name: job.name, idempotencyKey, attempt: job.attemptsMade + 1 }, "received job");
      await job.updateProgress({ status: "completed", idempotencyKey });
    },
    {
      connection,
      concurrency: Number(process.env.WORKER_CONCURRENCY ?? 2),
      lockDuration: Number(process.env.WORKER_LOCK_DURATION_MS ?? 30000)
    }
  );

  queue.on("error", (error) => {
    logger.error({ queueName, error }, "queue error");
  });

  worker.on("failed", (job, error) => {
    const deadLettered = Boolean(job && job.attemptsMade >= (job.opts.attempts ?? 1));
    logger.error({ queueName, jobId: job?.id, attemptsMade: job?.attemptsMade, deadLettered, error }, deadLettered ? "job dead-lettered" : "job failed");
  });
}

logger.info({ queues }, "JobOS workers started");
