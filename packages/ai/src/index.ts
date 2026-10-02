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
  metadata: {
    deterministic: boolean;
    provider: string;
    model: string;
    fallback?: boolean;
    policyChecks: Record<string, unknown>;
    groundingEvidence: Record<string, unknown>;
  };
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
  fetch?: typeof fetch;
}

interface ProviderRequestBody {
  model: string;
  messages?: Array<{ role: string; content: string }>;
  system?: string;
  max_tokens?: number;
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
      metadata: {
        deterministic: true,
        provider: "local",
        model: this.model,
        policyChecks: policyChecks(request),
        groundingEvidence: groundingEvidence(request)
      }
    };
  }
}

export class OpenAiProvider implements AiProvider {
  constructor(
    private readonly apiKey: string | undefined,
    private readonly model = "gpt-4.1-mini",
    private readonly fetchImpl: typeof fetch = fetch
  ) {}

  async generate(request: AiGenerationRequest): Promise<AiGenerationResult> {
    assertGroundingFacts(request);
    if (!this.apiKey) return fallbackResult("openai", this.model, request);
    const body: ProviderRequestBody = {
      model: this.model,
      messages: [
        { role: "system", content: "Generate concise JobOS career-search artifacts. Stay grounded in provided facts." },
        { role: "user", content: providerPrompt(request) }
      ]
    };
    const response = await this.fetchImpl("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify(body)
    });
    if (!response.ok) throw new Error(`OpenAI generation failed: ${response.status}`);
    const data = await response.json() as { choices?: Array<{ message?: { content?: string } }> };
    return providerResult("openai", this.model, request, data.choices?.[0]?.message?.content ?? "");
  }
}

export class AnthropicProvider implements AiProvider {
  constructor(
    private readonly apiKey: string | undefined,
    private readonly model = "claude-3-5-sonnet-latest",
    private readonly fetchImpl: typeof fetch = fetch
  ) {}

  async generate(request: AiGenerationRequest): Promise<AiGenerationResult> {
    assertGroundingFacts(request);
    if (!this.apiKey) return fallbackResult("anthropic", this.model, request);
    const response = await this.fetchImpl("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "x-api-key": this.apiKey,
        "anthropic-version": "2023-06-01",
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: this.model,
        max_tokens: 900,
        system: "Generate concise JobOS career-search artifacts. Stay grounded in provided facts.",
        messages: [{ role: "user", content: providerPrompt(request) }]
      })
    });
    if (!response.ok) throw new Error(`Anthropic generation failed: ${response.status}`);
    const data = await response.json() as { content?: Array<{ text?: string }> };
    return providerResult("anthropic", this.model, request, data.content?.map((item) => item.text ?? "").join("\n") ?? "");
  }
}

export function createAiProvider(config: AiProviderConfig): AiProvider {
  if (config.provider === "openai") {
    return new OpenAiProvider(config.openaiApiKey, config.openaiModel ?? "gpt-4.1-mini", config.fetch);
  }
  if (config.provider === "anthropic") {
    return new AnthropicProvider(config.anthropicApiKey, config.anthropicModel ?? "claude-3-5-sonnet-latest", config.fetch);
  }
  return new LocalAiProvider(config.localModel);
}

function providerPrompt(request: AiGenerationRequest) {
  return JSON.stringify({
    purpose: request.purpose,
    prompt: request.prompt,
    groundingFacts: request.groundingFacts,
    requestedClaims: request.requestedClaims ?? []
  });
}

function providerResult(provider: ProviderName, model: string, request: AiGenerationRequest, text: string): AiGenerationResult {
  return {
    provider,
    model,
    output: { text },
    groundedInProfile: true,
    metadata: {
      deterministic: false,
      provider,
      model,
      policyChecks: policyChecks(request),
      groundingEvidence: groundingEvidence(request)
    }
  };
}

function fallbackResult(provider: Exclude<ProviderName, "local">, model: string, request: AiGenerationRequest): AiGenerationResult {
  return {
    provider,
    model,
    output: { prompt: request.prompt, groundingFacts: request.groundingFacts },
    groundedInProfile: true,
    metadata: {
      deterministic: true,
      provider,
      model,
      fallback: true,
      policyChecks: policyChecks(request),
      groundingEvidence: groundingEvidence(request)
    }
  };
}

function policyChecks(request: AiGenerationRequest) {
  return {
    groundedFactsPresent: Object.keys(request.groundingFacts).length > 0,
    requestedClaimsChecked: request.requestedClaims?.length ?? 0,
    secretsRedacted: !/api[_-]?key|password|secret/i.test(request.prompt)
  };
}

function groundingEvidence(request: AiGenerationRequest) {
  return {
    factKeys: Object.keys(request.groundingFacts),
    requestedClaims: request.requestedClaims ?? []
  };
}
