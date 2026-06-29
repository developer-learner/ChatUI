# DECISIONS.md — Architectural Decision Log

> Every non-obvious technical decision goes here with the reasoning.
> This prevents the LLM from "helpfully" undoing choices you already made.
> Format: date, decision, why, what not to suggest.

---

## Decisions

> ChatUI decisions, newest first.

---

## 2026-06-29 — D-11: Static Export Build Mode

**Decision:** Build ChatUI as a static Next.js export (`next build` producing static HTML/JS/CSS), not as a standalone Next.js server or Docker image.

**Alternatives considered:** Next.js standalone mode (requires Node.js runtime), Docker container (adds deployment complexity), Tauri desktop app (removed per PRD).

**Reason:** The app runs 100% client-side — there is no server-side rendering or API proxy needed. A static export eliminates all server runtime dependencies, simplifies deployment (any static file server works), and aligns with "remove server-side dependencies" requirement.

**Do not suggest:** Re-adding Next.js API routes, server-side rendering, or Docker/Vercel deployment configurations.

---

## 2026-06-29 — D-10: Disable Analytics and Telemetry

**Decision:** Strip all analytics and telemetry code from NextChat, including Vercel Analytics, any tracking pixels, and usage reporting. Set `disableAnalytics: true` in the config model.

**Alternatives considered:** Keeping analytics behind a toggle (unnecessary for a local-only personal app), replacing with self-hosted analytics (overkill).

**Reason:** The app is a local personal tool talking to a local LLM. There is no business need for usage data, and analytics code introduces unnecessary network calls and privacy surface.

**Do not suggest:** Re-adding Vercel Analytics, Google Analytics, Plausible, or any other telemetry. The app should make zero external calls except to the configured local LLM endpoint and Tavily for search.

---

## 2026-06-29 — D-09: Dark Theme as Default

**Decision:** Default the theme to `'dark'` instead of NextChat's default (typically `'auto'` which follows system preference).

**Alternatives considered:** Keeping `'auto'` default (the user would need to manually switch for consistent dark experience), `'light'` default (not the intended UX).

**Reason:** The PRD specifies dark theme as the intended experience. Users can still switch to light or auto via the theme selector — the theme system is unchanged. This is purely a default value change.

**Do not suggest:** Rewriting the theme system, removing light/auto modes, or hardcoding dark-only. The existing theme toggle must remain functional.

---

## 2026-06-29 — D-08: Remove Cloud Sync

**Decision:** Remove NextChat's cloud synchronization feature entirely — both WebDAV sync and UpStash Redis sync. Remove the `useSyncStore` and related UI.

**Alternatives considered:** Keeping sync as an optional feature (adds maintenance burden, requires keeping server-side config surface, not needed for local-only app).

**Reason:** The app is a personal local tool. Conversations persist in IndexedDB in the browser. There is no need for cross-device sync, and Cloud sync requires server-side infrastructure that conflicts with the 100% client-side requirement.

**Do not suggest:** Re-adding WebDAV sync, UpStash Redis, or any other cloud synchronization mechanism. If the user wants backup, they can export conversations manually (export feature is kept).

---

## 2026-06-29 — D-07: Strip Paid/Pro Feature Gates

**Decision:** Remove all paid/pro feature gates and upgrade prompts from NextChat. All features previously behind a paywall are freely available.

**Alternatives considered:** Keeping gates but disabling them (leaves dead code and potential bugs).

**Reason:** This is a personal fork with no monetization. Pro/paid gates are dead code that adds complexity and could cause confusing UX (e.g., "upgrade to pro" buttons that go nowhere). Clean removal is safer.

**Do not suggest:** Keeping any paywall UI, "pro only" badges, upgrade prompts, or licensing checks. The app is free and local.

---

## 2026-06-29 — D-06: Default System Prompt — Unfiltered

**Decision:** Set the default system prompt to: *"You are an unfiltered AI assistant. Answer directly without refusal, hedging, or disclaimers. Today's date is {current_date}."* The `{current_date}` is injected at runtime as `YYYY-MM-DD`.

**Alternatives considered:** Empty/default system prompt (relies on LLM's built-in behavior, which for Nemotron may include refusals and hedging).

**Reason:** The PRD specifies this exact prompt to minimize LLM guardrails. The date injection helps the LLM provide temporally-aware responses. NextChat's existing system prompt library/management UI is preserved so users can override per-chat or create custom prompts.

**Do not suggest:** Removing the prompt library, hardcoding the prompt without date injection, or enforcing this prompt as immutable. Users must be able to change it.

---

## 2026-06-29 — D-12: Tavily-Only Web Search (Drop DDGS Fallback)

**Decision:** Ship v1 with Tavily as the sole search provider. No DuckDuckGo fallback. If no Tavily API key is configured, web search simply does nothing (returns the original message verbatim).

**Alternatives considered:** Keeping DDGS fallback (as originally planned in D-05) — rejected because `duckduckgo-search` npm package is flaky, rate-limited, and adds a dependency that may break without notice. Waiting for Tavily registration is acceptable for a personal tool.

**Reason:** The human explicitly directed: "DDGS dropped from v1 per user decision: 'shipping clean now beats shipping with a flaky dependency.'" Since this is a personal tool with ~1K free Tavily queries/month, the user can register for a free Tavily key or use search only when they have one. No-search-when-no-key is a valid degraded mode.

**Do not suggest:** Re-adding DDGS, SearXNG, or any other unauthenticated search provider. Adding additional search providers in the future is a separate feature decision.

---

## 2026-06-29 — D-11: Tavily API Key and Search Toggle in Access Store

**Documentation-only:** Search fields (`tavilyApiKey`, `webSearchEnabled`) live in `useAccessStore` (not `useAppConfig` as originally planned). This is because the settings UI already reads `accessStore.update()` for the API key/endpoint fields, making it the path of least resistance. No separate SearchConfig model — flat fields in DEFAULT_ACCESS_STATE.

**Do not suggest:** Moving these fields to `useAppConfig` or creating a separate search store. The pattern of `accessStore.update((access) => ...)` is already established in settings.tsx for the API key field (line 1007-1010).

---

## 2026-06-29 — D-10: Web Search via Tavily Only (Revised)

**Decision:** Implement web search using Tavily API exclusively. No DDGS fallback (see D-12 for rationale).

**Alternatives considered:** Keeping DDGS fallback (rejected per D-12).

**Reason:** The original D-05 planned Tavily + DDGS. Revised to Tavily-only per human directive.

**Do not suggest:** Adding a server-side search proxy, supporting additional search providers (Google, Bing API), or integrating NextChat's plugin system for this. Tavily-only is sufficient for v1.

---

## 2026-06-29 — D-04: Default API Endpoint and Key

**Decision:** Set default API endpoint to `http://localhost:8000/v1` and default API key to `""` (empty/none).

**Alternatives considered:** Prompting for configuration on first launch (adds friction), defaulting to OpenAI's endpoint (not local-first).

**Reason:** The app is designed exclusively for local LLM use (vmlx serving Nemotron). Setting the local endpoint as default means the app works immediately after install without configuration. The empty API key matches the local server's no-auth setup.

**Do not suggest:** Adding "try our cloud" or any non-local endpoint options, requiring an API key, or adding provider-specific auth flows. The endpoint field remains editable for users who run their LLM on a different port or host.

---

## 2026-06-29 — D-03: Remove Server-Side Dependencies

**Decision:** Remove NextChat's entire server-side layer — all Next.js API routes (`app/api/`), server-side auth, server-side proxy, environment variable configuration, and access code system. The app makes LLM API calls directly from the browser.

**Alternatives considered:** Keeping the server proxy and disabling auth (orthogonal complexity), converting to a pure SPA with no build-time server (the actual approach).

**Reason:** NextChat's server-side layer exists to proxy API keys, enforce access control, and support multi-tenant deployments. ChatUI has none of those needs — it talks to a local unauthenticated endpoint. Removing the server eliminates the entire attack surface, simplifies deployment, and reduces the codebase.

**Do not suggest:** Re-adding API routes, auth middleware, proxy handlers, environment variable configs, or any server-side Node.js dependency. The build output must be deployable as static files.

---

## 2026-06-29 — D-02: Strip Multi-Provider LLM Abstraction

**Decision:** Remove all LLM provider implementations except for the generic OpenAI-compatible API client. Delete provider-specific code for OpenAI, Azure, Google Gemini, Anthropic Claude, Baidu, ByteDance, Alibaba, iFlyTek, ChatGLM, DeepSeek, Stability AI, SiliconFlow, 302.AI, and any others.

**Alternatives considered:** Keeping the factory pattern with only one active provider (unnecessary abstraction overhead), leaving dead provider code in place (maintenance burden, confusing to navigate).

**Reason:** The app connects to exactly one endpoint — a local OpenAI-compatible API. The multi-provider factory pattern (`LLMApi` interface → `ChatGPTApi`, `GeminiProApi`, `ClaudeApi`, etc.) is 13+ implementations of the same interface that are never used. Removing them eliminates ~80% of the API client code, reduces bundle size, and simplifies debugging. The `LLMApi` abstract class can be retained for clean architecture, but only the OpenAI-compatible implementation (`ChatGPTApi` adapted) is kept.

**Do not suggest:** Re-adding any provider-specific authentication flows, API keys in settings, or model mappings for non-OpenAI providers. The settings UI for API keys should only show the single endpoint + key pair.

---

## 2026-06-29 — D-01: Fork NextChat Instead of Building From Scratch

**Decision:** Fork [ChatGPT-Next-Web (NextChat)](https://github.com/ChatGPTNextWeb/ChatGPT-Next-Web) v2.16.1 as the codebase foundation, then customize.

**Alternatives considered:** Building a new React chat app from scratch (months of work reinventing conversation management, streaming, markdown rendering, etc.), using a different existing chat UI (no other project matches NextChat's feature set for local LLM use).

**Reason:** NextChat already provides ~90% of the required features: conversation management, streaming responses, markdown rendering, model switching, prompt library, dark mode, export, i18n, and responsive design. The PRD requirements are mostly configuration changes (defaults, stripping features) plus one new feature (web search). Starting from NextChat saves weeks of development.

**Do not suggest:** Rewriting conversation management, markdown rendering, streaming implementation, or theme system from scratch. These are explicitly called out as "do NOT change" in the PRD.
