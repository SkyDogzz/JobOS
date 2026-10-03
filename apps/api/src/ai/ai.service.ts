import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { createAiProvider } from "@jobos/ai";
import { approveCoverLetterSchema, approveTailoredResumeSchema, generateCoverLettersSchema, updateGroundingReviewSchema, tailorResumeSchema } from "@jobos/validation";
import { parseBody } from "../common/validation.js";
import { keywordCoverage, textFromContent } from "../common/scoring.js";
import { BillingService } from "../billing/billing.service.js";
import { AiRepository } from "./ai.repository.js";

@Injectable()
export class AiService {
  constructor(private readonly ai: AiRepository, private readonly billing: BillingService) {}

  async tailorResume(body: unknown) {
    const input = parseBody(tailorResumeSchema, body);
    const context = await this.ai.loadTailoringContext(input.jobId, input.resumeVersionId);
    if (!context) throw new NotFoundException("Job or resume version not found.");

    const selectedProvider = (process.env.AI_PROVIDER as "local" | "openai" | "anthropic" | undefined) ?? "local";
    if (selectedProvider !== "local") await this.billing.assertEntitlement("premiumAi");
    const provider = createAiProvider({
      provider: selectedProvider,
      openaiApiKey: process.env.OPENAI_API_KEY,
      anthropicApiKey: process.env.ANTHROPIC_API_KEY,
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
    const qualityReview = reviewGeneration({
      groundedClaims: coverage.covered.slice(0, 6),
      missingEvidence: coverage.missing,
      roleText: context.job.description,
      generatedText: textFromContent(draft),
      tone: "resume"
    });
    const promptHash = this.ai.hashPrompt(`${prompt}:${JSON.stringify(groundingFacts)}:${context.job.description}`);
    const artifact = await this.ai.saveArtifact({
      userId: context.userId,
      provider: output.provider,
      model: output.model,
      purpose: "resume_tailoring",
      promptHash,
      output: {
        draft,
        metadata: output.metadata,
        providerOutput: output.output,
        policyChecks: output.metadata.policyChecks,
        groundingEvidence: output.metadata.groundingEvidence,
        qualityReview,
        reviewHistory: [{ status: "draft", note: "Initial rubric review", createdAt: new Date().toISOString() }],
        sourceVersionId: input.resumeVersionId,
        targetJobId: input.jobId
      },
      groundedInProfile: output.groundedInProfile
    });
    await this.ai.createGroundingReviews(artifact.id, coverage.covered.slice(0, 6), { resumeVersionId: input.resumeVersionId, jobId: input.jobId });
    return { artifactId: artifact.id, promptHash, provider: output.provider, model: output.model, draft, qualityReview, diff: { added: draft.tailoring } };
  }

  approveTailoredResume(body: unknown) {
    const input = parseBody(approveTailoredResumeSchema, body);
    assertReviewApprovalAllowed(input.metadata, input.overrideHighRisk);
    return this.ai.approveTailoredResume(input);
  }

  async generateCoverLetters(body: unknown) {
    const input = parseBody(generateCoverLettersSchema, body);
    const context = await this.ai.loadCoverLetterContext(input.jobId, input.resumeVersionId, input.applicationId);
    if (!context) throw new NotFoundException("Job, resume version, or application not found.");

    const selectedProvider = (process.env.AI_PROVIDER as "local" | "openai" | "anthropic" | undefined) ?? "local";
    if (selectedProvider !== "local") await this.billing.assertEntitlement("premiumAi");
    const provider = createAiProvider({
      provider: selectedProvider,
      openaiApiKey: process.env.OPENAI_API_KEY,
      anthropicApiKey: process.env.ANTHROPIC_API_KEY,
      openaiModel: process.env.OPENAI_MODEL,
      anthropicModel: process.env.ANTHROPIC_MODEL,
      localModel: process.env.LOCAL_AI_MODEL
    });
    const resumeText = textFromContent(context.resumeVersion.content);
    const coverage = keywordCoverage(context.job.description, resumeText);
    const groundedClaims = coverage.covered.slice(0, 6);
    const groundingFacts = { profile: context.profile, resume: context.resumeVersion.content, groundedClaims };
    const prompt = `Generate cover letter variants for ${context.job.title} using resume ${context.resumeVersion.id}`;
    const output = await provider.generate({ purpose: "cover_letter", prompt, groundingFacts, requestedClaims: groundedClaims });
    const promptHash = this.ai.hashPrompt(`${prompt}:${JSON.stringify(groundingFacts)}:${input.tones.join(",")}`);
    const variants = input.tones.map((tone) => ({
      tone,
      title: `${tone.replace("_", " ")} cover letter for ${context.job.title}`,
      body: this.composeCoverLetter(tone, context.job.title, groundedClaims),
      groundedClaims,
      missingEvidence: coverage.missing.slice(0, 5),
      approvalState: "draft",
      qualityReview: reviewGeneration({
        groundedClaims,
        missingEvidence: coverage.missing,
        roleText: context.job.description,
        generatedText: this.composeCoverLetter(tone, context.job.title, groundedClaims),
        tone
      })
    }));
    const artifact = await this.ai.saveArtifact({
      userId: context.userId,
      provider: output.provider,
      model: output.model,
      purpose: "cover_letter",
      promptHash,
      output: {
        variants,
        metadata: output.metadata,
        providerOutput: output.output,
        policyChecks: output.metadata.policyChecks,
        groundingEvidence: output.metadata.groundingEvidence,
        qualityReviews: variants.map((variant) => ({ tone: variant.tone, review: variant.qualityReview })),
        reviewHistory: [{ status: "draft", note: "Initial rubric review", createdAt: new Date().toISOString() }],
        sourceVersionId: input.resumeVersionId,
        targetJobId: input.jobId,
        applicationId: input.applicationId ?? null
      },
      groundedInProfile: output.groundedInProfile
    });
    await this.ai.createGroundingReviews(artifact.id, groundedClaims, { resumeVersionId: input.resumeVersionId, jobId: input.jobId, applicationId: input.applicationId ?? null });
    return { artifactId: artifact.id, promptHash, provider: output.provider, model: output.model, variants };
  }

  async approveCoverLetter(body: unknown) {
    const input = parseBody(approveCoverLetterSchema, body);
    assertReviewApprovalAllowed(input.metadata, input.overrideHighRisk);
    const document = await this.ai.approveCoverLetter(input);
    if (!document) throw new NotFoundException("Job, resume version, or application not found.");
    return document;
  }

  private composeCoverLetter(tone: string, role: string, groundedClaims: string[]) {
    const evidence = groundedClaims.length > 0 ? groundedClaims.join(", ") : "the experience documented in my resume";
    const openings: Record<string, string> = {
      concise: `I am interested in the ${role} role and can bring proven experience with ${evidence}.`,
      narrative: `My work has consistently centered on practical outcomes, and the ${role} role stands out because it calls for strengths I have already demonstrated: ${evidence}.`,
      technical: `I am applying for the ${role} role with hands-on technical evidence across ${evidence}.`,
      recruiter_friendly: `I would welcome the chance to discuss the ${role} opportunity and the relevant background reflected in my resume: ${evidence}.`
    };
    return `${openings[tone] ?? openings.concise}\n\nI have kept this draft grounded in the attached profile and resume data, and I would tailor the final version around the team's highest-priority requirements.\n\nThank you for your consideration.`;
  }

  listGroundingReviews() {
    return this.ai.listGroundingReviews();
  }

  listGroundingReviewsForArtifact(artifactId: string) {
    return this.ai.listGroundingReviewsForArtifact(artifactId);
  }

  async updateGroundingReview(id: string, body: unknown) {
    const review = await this.ai.updateGroundingReview(id, parseBody(updateGroundingReviewSchema, body));
    if (!review) throw new NotFoundException("Grounding review not found.");
    return review;
  }
}

function reviewGeneration(input: { groundedClaims: string[]; missingEvidence: string[]; roleText: string; generatedText: string; tone: string }) {
  const roleTokens = new Set(input.roleText.toLowerCase().match(/[a-z][a-z0-9+#.-]{3,}/g) ?? []);
  const generatedTokens = new Set(input.generatedText.toLowerCase().match(/[a-z][a-z0-9+#.-]{3,}/g) ?? []);
  const overlap = [...roleTokens].filter((token) => generatedTokens.has(token)).length;
  const specificity = Math.min(100, input.groundedClaims.length * 14 + overlap * 2);
  const evidenceCoverage = Math.min(100, input.groundedClaims.length * 18);
  const roleFit = Math.min(100, overlap * 8 + evidenceCoverage / 2);
  const claimRisk = input.groundedClaims.length === 0 ? 90 : Math.min(80, input.missingEvidence.length * 8);
  const toneScore = /concise|technical|narrative|recruiter_friendly|resume/.test(input.tone) ? 90 : 70;
  const riskLevel = claimRisk >= 75 || evidenceCoverage < 30 ? "high" : claimRisk >= 45 ? "medium" : "low";

  return {
    rubric: { specificity, evidenceCoverage, roleFit, claimRisk, tone: toneScore },
    riskLevel,
    unsupportedClaims: input.missingEvidence.slice(0, 5),
    reviewerNotes: [
      riskLevel === "high" ? "Approval requires reviewer override because grounded evidence is thin." : "Draft is ready for reviewer approval.",
      input.missingEvidence.length ? `Evidence gaps: ${input.missingEvidence.slice(0, 3).join(", ")}` : "No major evidence gaps detected."
    ]
  };
}

function assertReviewApprovalAllowed(metadata: Record<string, unknown>, overrideHighRisk: boolean) {
  const review = metadata.qualityReview as { riskLevel?: string } | undefined;
  if (review?.riskLevel === "high" && !overrideHighRisk) {
    throw new BadRequestException("High-risk generated content requires reviewer override before approval.");
  }
}
