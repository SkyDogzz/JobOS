export interface AiGenerationRequest {
  purpose: "resume_tailoring" | "cover_letter" | "ats_analysis" | "job_match";
  prompt: string;
  groundingFacts: Record<string, unknown>;
  requestedClaims?: string[];
}

export interface AiGenerationResult {
  provider: string;
  model: string;
  output: unknown;
  groundedInProfile: boolean;
  metadata: { deterministic: boolean; provider: string; model: string };
}

export interface AiProvider {
  generate(request: AiGenerationRequest): Promise<AiGenerationResult>;
}

export function assertGroundingFacts(request: AiGenerationRequest) {
  if (Object.keys(request.groundingFacts).length === 0) {
    throw new Error("AI generation requires candidate grounding facts.");
  }
  const groundingText = JSON.stringify(request.groundingFacts).toLowerCase();
  for (const claim of request.requestedClaims ?? []) {
    const tokens = claim.toLowerCase().match(/[a-z][a-z0-9+#.-]{3,}/g) ?? [];
    if (tokens.length > 0 && !tokens.some((token) => groundingText.includes(token))) {
      throw new Error(`Generated claim is not grounded: ${claim}`);
    }
  }
}

export type ProviderName = "local" | "openai" | "anthropic";

export interface AiProviderConfig {
  provider: ProviderName;
  openaiApiKey?: string;
  anthropicApiKey?: string;
  openaiModel?: string;
  anthropicModel?: string;
  localModel?: string;
}

export class LocalAiProvider implements AiProvider {
  constructor(private readonly model = "jobos-local-deterministic") {}

  async generate(request: AiGenerationRequest): Promise<AiGenerationResult> {
    assertGroundingFacts(request);
    return {
      provider: "local",
      model: this.model,
      output: { prompt: request.prompt, groundingFacts: request.groundingFacts },
      groundedInProfile: true,
      metadata: { deterministic: true, provider: "local", model: this.model }
    };
  }
}

export function createAiProvider(config: AiProviderConfig): AiProvider {
  if (config.provider === "openai") {
    return new LocalAiProvider(config.openaiModel ?? "gpt-4.1-mini");
  }
  if (config.provider === "anthropic") {
    return new LocalAiProvider(config.anthropicModel ?? "claude-3-5-sonnet-latest");
  }
  return new LocalAiProvider(config.localModel);
}
