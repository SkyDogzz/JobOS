import { Injectable, NotFoundException } from "@nestjs/common";
import { createAiProvider } from "@jobos/ai";
import { approveTailoredResumeSchema, tailorResumeSchema } from "@jobos/validation";
import { parseBody } from "../common/validation.js";
import { keywordCoverage, textFromContent } from "../common/scoring.js";
import { AiRepository } from "./ai.repository.js";

@Injectable()
export class AiService {
  constructor(private readonly ai: AiRepository) {}

  async tailorResume(body: unknown) {
    const input = parseBody(tailorResumeSchema, body);
    const context = await this.ai.loadTailoringContext(input.jobId, input.resumeVersionId);
    if (!context) throw new NotFoundException("Job or resume version not found.");

    const provider = createAiProvider({
      provider: (process.env.AI_PROVIDER as "local" | "openai" | "anthropic" | undefined) ?? "local",
      openaiModel: process.env.OPENAI_MODEL,
      anthropicModel: process.env.ANTHROPIC_MODEL,
      localModel: process.env.LOCAL_AI_MODEL
    });
    const groundingFacts = { profile: context.profile, resume: context.resumeVersion.content };
    const coverage = keywordCoverage(context.job.description, textFromContent(context.resumeVersion.content));
    const prompt = `Tailor resume ${context.resumeVersion.id} for ${context.job.title}`;
    const output = await provider.generate({ purpose: "resume_tailoring", prompt, groundingFacts, requestedClaims: coverage.covered.slice(0, 6) });
    const draft = {
      ...context.resumeVersion.content,
      targetedRole: context.job.title,
      tailoring: {
        groundedKeywords: coverage.covered.slice(0, 12),
        suggestedEvidenceGaps: coverage.missing.slice(0, 8)
      }
    };
    const promptHash = this.ai.hashPrompt(`${prompt}:${JSON.stringify(groundingFacts)}:${context.job.description}`);
    const artifact = await this.ai.saveArtifact({
      userId: context.userId,
      provider: output.provider,
      model: output.model,
      purpose: "resume_tailoring",
      promptHash,
      output: { draft, metadata: output.metadata, sourceVersionId: input.resumeVersionId, targetJobId: input.jobId },
      groundedInProfile: output.groundedInProfile
    });
    return { artifactId: artifact.id, promptHash, provider: output.provider, model: output.model, draft, diff: { added: draft.tailoring } };
  }

  approveTailoredResume(body: unknown) {
    return this.ai.approveTailoredResume(parseBody(approveTailoredResumeSchema, body));
  }
}

