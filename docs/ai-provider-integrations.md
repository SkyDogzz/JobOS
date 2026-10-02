# AI Provider Integrations

JobOS supports `local`, `openai`, and `anthropic` AI providers behind the shared `@jobos/ai` abstraction.

Configuration is environment-only:

```sh
AI_PROVIDER=local
OPENAI_API_KEY=
ANTHROPIC_API_KEY=
OPENAI_MODEL=gpt-4.1-mini
ANTHROPIC_MODEL=claude-3-5-sonnet-latest
LOCAL_AI_MODEL=jobos-local-deterministic
```

Provider keys are read from process environment variables at request time and are not stored in the database. If `AI_PROVIDER` is set to `openai` or `anthropic` but the matching key is absent, JobOS returns a deterministic fallback result marked with `metadata.fallback: true`.

Every generated artifact records provider, model, prompt hash, policy checks, provider output, and grounding evidence in the artifact payload. Normal tests use deterministic fake fetchers and do not call paid provider APIs.

Optional live smoke:

```sh
AI_PROVIDER=openai OPENAI_API_KEY=... pnpm --filter @jobos/api dev
AI_PROVIDER=anthropic ANTHROPIC_API_KEY=... pnpm --filter @jobos/api dev
```
