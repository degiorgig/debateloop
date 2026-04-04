# Stack Research

**Domain:** Multi-model debate application built on OpenCode SDK
**Researched:** 2026-04-04
**Confidence:** MEDIUM

## Recommended Stack

### Core Technologies

| Technology | Version | Purpose | Why Recommended |
|------------|---------|---------|-----------------|
| TypeScript | 5.8.x | Primary implementation language | Best fit for the official JS SDK, strong typing for debate state, and low-friction CLI development. |
| Node.js | 20 LTS+ | Runtime for local CLI/server execution | Official SDK support explicitly includes Node.js 20 LTS or later. |
| `@opencode-ai/sdk` | `0.1.0-alpha.21` | Programmatic control of OpenCode sessions and prompts | Official SDK for creating sessions, prompting models, reading events, and interacting with the OpenCode server. |
| OpenCode local server via `createOpencode()` | Current installed OpenCode | Starts the OpenCode server and client together | Lets the app use configured providers and models without building a custom provider layer first. |

### Supporting Libraries

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| `zod` | 3.x or 4.x | Validate app config, judge output, and transcript schema | Use for runtime validation of model IDs, workflow settings, and structured judge decisions. |
| `commander` | 12.x | CLI argument parsing | Use if the app exposes commands like `ask`, `models`, `replay`, or `judge`. |
| `chalk` | 5.x | Terminal formatting for transcript display | Use for readable role/stage rendering during debates. |
| `vitest` | 2.x | Unit and integration testing | Use for orchestration flow tests and judge result validation. |

### Development Tools

| Tool | Purpose | Notes |
|------|---------|-------|
| ESLint | Linting | Keep prompt assembly, transcript handling, and async orchestration predictable. |
| Prettier | Formatting | Useful for prompt templates and transcript fixtures. |
| `tsx` | Run TS directly in dev | Good for rapid iteration before packaging. |

## Installation

```bash
# Core
npm install @opencode-ai/sdk zod commander chalk

# Dev dependencies
npm install -D typescript vitest eslint prettier tsx @types/node
```

## Alternatives Considered

| Recommended | Alternative | When to Use Alternative |
|-------------|-------------|-------------------------|
| `@opencode-ai/sdk` | Direct provider SDKs (Anthropic/OpenAI/Gemini) | Use only if OpenCode session orchestration becomes a hard blocker or unsupported for the workflow. |
| Node.js CLI | Web-first app | Use if the primary goal becomes sharing debates in a browser instead of validating orchestration. |
| `zod` | Hand-written validation | Acceptable only for tiny prototypes with very few config fields. |

## What NOT to Use

| Avoid | Why | Use Instead |
|-------|-----|-------------|
| Hard-coding one model as the default winner path | Recreates the bias the product is trying to remove | Keep both debaters symmetric until the judge step. |
| Building a custom multi-provider abstraction first | Adds complexity before the debate engine is validated | Start with OpenCode's provider/model config and session APIs. |
| Unstructured judge output | Makes winner selection brittle and hard to test | Use structured JSON output for judge decisions. |

## Stack Patterns by Variant

**If the product stays CLI-first:**
- Use `commander` plus formatted terminal transcript output
- Because the fastest validation path is asking one question and inspecting the full debate locally

**If the product becomes API-first later:**
- Keep the orchestration core framework-agnostic behind a service layer
- Because the same debate engine can then back CLI, HTTP, or TUI integrations

## Version Compatibility

| Package A | Compatible With | Notes |
|-----------|-----------------|-------|
| `@opencode-ai/sdk@0.1.0-alpha.21` | Node.js 20 LTS+ | Confirmed in SDK README requirements. |
| TypeScript 5.8.x | `@opencode-ai/sdk@0.1.0-alpha.21` | Matches current SDK dev toolchain and avoids older TS friction. |

## Sources

- `https://opencode.ai/docs/sdk/` — verified `createOpencode()`, client APIs, sessions, structured output, and runtime support
- `https://opencode.ai/docs/` — verified product positioning and multi-provider model support
- `anomalyco/opencode-sdk-js` `package.json` — verified package name and current published version
- `anomalyco/opencode-sdk-js` `README.md` — verified install method, retries, logging, and runtime requirements

---
*Stack research for: multi-model debate application*
*Researched: 2026-04-04*
