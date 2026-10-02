import assert from "node:assert/strict";
import { createAiProvider } from "../dist/index.js";

const request = {
  purpose: "cover_letter",
  prompt: "Write a grounded cover letter.",
  groundingFacts: { profile: { skills: ["TypeScript"] } },
  requestedClaims: ["TypeScript"]
};

const openaiCalls = [];
const openai = createAiProvider({
  provider: "openai",
  openaiApiKey: "test-key",
  openaiModel: "gpt-test",
  fetch: async (url, init) => {
    openaiCalls.push({ url, init });
    return {
      ok: true,
      json: async () => ({ choices: [{ message: { content: "openai output" } }] })
    };
  }
});
const openaiResult = await openai.generate(request);
assert.equal(openaiResult.provider, "openai");
assert.equal(openaiResult.model, "gpt-test");
assert.equal(openaiResult.metadata.deterministic, false);
assert.equal(openaiResult.output.text, "openai output");
assert.equal(openaiCalls[0].url, "https://api.openai.com/v1/chat/completions");

const anthropicCalls = [];
const anthropic = createAiProvider({
  provider: "anthropic",
  anthropicApiKey: "test-key",
  anthropicModel: "claude-test",
  fetch: async (url, init) => {
    anthropicCalls.push({ url, init });
    return {
      ok: true,
      json: async () => ({ content: [{ text: "anthropic output" }] })
    };
  }
});
const anthropicResult = await anthropic.generate(request);
assert.equal(anthropicResult.provider, "anthropic");
assert.equal(anthropicResult.model, "claude-test");
assert.equal(anthropicResult.output.text, "anthropic output");
assert.equal(anthropicCalls[0].url, "https://api.anthropic.com/v1/messages");

const fallback = await createAiProvider({ provider: "openai", openaiModel: "gpt-fallback" }).generate(request);
assert.equal(fallback.metadata.deterministic, true);
assert.equal(fallback.metadata.fallback, true);
assert.equal(fallback.metadata.policyChecks.groundedFactsPresent, true);

console.log("AI provider fake tests passed.");
