import { BadRequestException } from "@nestjs/common";
import type { z } from "zod";

export function parseBody<TSchema extends z.ZodTypeAny>(schema: TSchema, body: unknown): z.output<TSchema> {
  const result = schema.safeParse(body);

  if (!result.success) {
    throw new BadRequestException({
      message: "Invalid request body",
      issues: result.error.flatten()
    });
  }

  return result.data;
}
