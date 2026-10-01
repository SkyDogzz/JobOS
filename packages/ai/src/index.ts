export interface AiGenerationRequest {
  purpose: "resume_tailoring" | "cover_letter" | "ats_analysis" | "job_match";
  prompt: string;
  groundingFacts: Record<string, unknown>;
}

export interface AiGenerationResult {
  provider: string;
  model: string;
  output: unknown;
  groundedInProfile: boolean;
}

export interface AiProvider {
  generate(request: AiGenerationRequest): Promise<AiGenerationResult>;
}

export function assertGroundingFacts(request: AiGenerationRequest) {
  if (Object.keys(request.groundingFacts).length === 0) {
    throw new Error("AI generation requires candidate grounding facts.");
  }
}

