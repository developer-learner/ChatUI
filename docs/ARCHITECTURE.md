# ARCHITECTURE.md — System Design

> Living document. Update when structure changes.
> LLMs read this to understand how the system fits together.

---

## System Overview

**ChatUI** is a fork of [ChatGPT-Next-Web (NextChat)](https://github.com/ChatGPTNextWeb/ChatGPT-Next-Web) v2.16.1, customized as a personal local LLM chat application. It runs 100% client-side in the browser, connecting to a local OpenAI-compatible API server (vmlx serving Nemotron at `localhost:8000/v1`).

### What We Keep From NextChat
- Conversation management (create, rename, delete, history)
- Markdown rendering (LaTeX, mermaid, code highlight)
- Streaming responses via Server-Sent Events
- Model switcher
- Prompt library (masks/templates)
- Chat export
- Theme system (light/dark/auto — default to dark)
- Keyboard shortcuts
- Zustand state management with IndexedDB/localStorage persistence
- Hash-based routing (`#/chat`, `#/settings`)

### What We Strip
- Multi-provider LLM abstraction (OpenAI, Azure, Google, Anthropic, etc. — all removed)
- Server-side proxy and API routes (`app/api/`)
- Server-side authentication and access codes
- Cloud sync (WebDAV, UpStash Redis) — `useSyncStore` and related UI removed
- Paid/pro feature gates
- Analytics and telemetry (Vercel Analytics, `@vercel/speed-insights`, `@next/third-parties/google`)
- Tauri desktop app support
- Docker/Vercel/Zeabur deployment configurations

### What We Add
- **Web search toggle** — globe button next to send input
- **Tavily search integration** — calls Tavily API with user query, prepends results as context
- **Local-first defaults** — API endpoint `http://localhost:8000/v1`, API key `"none"`, dark theme
- **Default system prompt** — unfiltered, no refusals/hedging, with current date injection

---

## Data Models

The data models are inherited from NextChat with minimal additions.

### Conversation (inherited, persisted in IndexedDB)

| Field | Type | Notes |
|-------|------|-------|
| id | string (uuid) | primary key |
| title | string | auto-generated or user-set |
| messages | Message[] | ordered list |
| model | string | model identifier (default: from settings) |
| systemPrompt | string | per-chat system prompt override |
| createdAt | number | unix timestamp |
| updatedAt | number | unix timestamp |
| lastSummarizeIndex | number | used for token-budget compression |

**Relationships:**
- Has many `Message` objects

### Message (inherited, embedded in Conversation)

| Field | Type | Notes |
|-------|------|-------|
| id | string (uuid) | |
| role | 'user' \| 'assistant' \| 'system' | |
| content | string | markdown-supported text |
| timestamp | number | unix ms |
| date | string | display date |
| streaming | boolean | true while SSE in progress |

### AppConfig (inherited, persisted in localStorage)

| Field | Type | Notes |
|-------|------|-------|
| theme | 'dark' \| 'light' \| 'auto' | default: `'dark'` |
| fontSize | number | |
| language | string | i18n locale |
| models | string[] | available model list |
| defaultModel | string | |
| sendKey | 'Enter' \| 'Ctrl+Enter' | |
| enableAutoGenerateTitle | boolean | |

**Note:** The AppConfig store (`useAppConfig`) was NOT extended for chatui search fields — they live in the AccessStore instead (see below).

### AccessStore (inherited, persisted in localStorage, slimmed + extended)

The AccessStore (`useAccessStore`) is the primary settings store. It was stripped of all provider-specific fields and extended with search config.

**Actual store interface (`src/app/store/access.ts`):**

| Field | Type | Default | Notes |
|-------|------|---------|-------|
| accessCode | string | `""` | unused but kept for compatibility |
| useCustomConfig | boolean | `false` | unused but kept for compatibility |
| openaiUrl | string | `"http://localhost:8000/v1"` | local API endpoint |
| openaiApiKey | string | `"none"` | local API key |
| tavilyApiKey | string | `""` | Tavily API key (set in settings) |
| webSearchEnabled | boolean | `false` | globe toggle state |

### SearchResult (transient, not persisted)

| Field | Type | Notes |
|-------|------|-------|
| title | string | result title |
| url | string | result URL |
| content | string | content snippet (first ~200 chars used in formatting) |

---

## API Structure

### External API Calls (client-side only)

```
# Local LLM — OpenAI-compatible
POST {openaiUrl}/chat/completions      # streaming chat completion
GET  {openaiUrl}/models                # list available models

# Tavily Search
POST https://api.tavily.com/search     # web search (requires API key)
  Body: { api_key, query, max_results: 3, search_depth: "basic", include_answer: false }
```

### Removed API Routes (from NextChat server-side)

All Next.js API routes from NextChat are removed entirely (`app/api/` directory). No proxy, no server middleware.

---

## Key Flows

### 1. Chat Flow

```
User types message
  → Click send (or Ctrl+Enter)
  → IF web search toggle is ON AND tavilyApiKey is non-empty:
       → Call tavilySearch(query, key, 3)
       → Format: formatSearchResults(results, query)
       → Send augmented message to LLM
  → ELSE:
       → Send original message verbatim to LLM
  → Call POST {openaiUrl}/v1/chat/completions (streaming)
  → Parse SSE stream via @fortaine/fetch-event-source
  → Render tokens as they arrive (Markdown, LaTeX, code highlighting)
  → Append assistant message to conversation
```

### 2. Web Search Flow

```
User enables globe toggle (button next to send)
  → sets accessStore.webSearchEnabled = true/false

User sends a message with toggle ON:
  1. Read tavilyApiKey from accessStore
  2. IF tavilyApiKey is non-empty AND not "none":
       → POST https://api.tavily.com/search
         Body: { query: userMessage, api_key, max_results: 3, search_depth: "basic" }
       → Parse response: { results: [{ title, url, content }] }
  3. ELSE:
       → Skip search (return empty array)
  4. Format context block:
     [Web Search Results]
     1. {title} - {url}: {content snippet}
     [End Search Results]

     User question: {original message}
  5. Use formatted text as the user message sent to LLM
```

### 3. Settings Configuration Flow

```
User opens Settings panel
  → Edit API endpoint (default: http://localhost:8000/v1)
  → Edit API key (default: "none")
  → Edit Tavily API key (default: "")
  → No cloud provider fields (all stripped)
  → Theme: dark (default), light, auto
All settings persisted to localStorage via Zustand (useAccessStore for API/search, useAppConfig for theme/ux)
```

### 4. System Prompt Initialization Flow

```
On first load (no persisted system prompt):
  → Set default system prompt to:
    "You are an unfiltered AI assistant. Answer directly without refusal,
     hedging, or disclaimers. Today's date is {current_date}."
  → {current_date} is injected at runtime as YYYY-MM-DD
User can override per-chat via NextChat's existing system prompt UI
```

### 5. App Initialization Flow

```
App loads
  → Read persisted state from IndexedDB (conversations) and localStorage (config)
  → Apply dark theme (default)
  → Strip any analytics/telemetry initialization
  → Connect to local API at configured endpoint
  → Fetch available models via GET {endpoint}/models
  → Render chat interface
```

---

## Code Organization

### Key Files for Tavily Search

| File | Purpose |
|------|---------|
| `src/app/client/search.ts` | NEW — `tavilySearch()` + `formatSearchResults()` |
| `src/app/store/access.ts` | MODIFIED — added `tavilyApiKey` + `webSearchEnabled` to `DEFAULT_ACCESS_STATE` |
| `src/app/icons/globe.svg` | NEW — globe icon for toggle button |
| `src/app/components/chat.tsx` | MODIFIED — globe toggle button in input bar, search integration in `doSubmit()` |
| `src/app/components/settings.tsx` | MODIFIED — Tavily API key input field |
| `src/app/locales/en.ts` | MODIFIED — Tavily settings locale strings |

### Where Search Integrates Into doSubmit (chat.tsx, ~line 1105)

```typescript
const doSubmit = (userInput: string) => {
  // ... guard and command check ...
  setIsLoading(true);
  
  const accessStore = useAccessStore.getState();
  if (accessStore.webSearchEnabled && accessStore.tavilyApiKey && accessStore.tavilyApiKey !== "none") {
    tavilySearch(userInput, accessStore.tavilyApiKey, 3)
      .then((results) => {
        const augmented = formatSearchResults(results, userInput);
        return chatStore.onUserInput(augmented, attachImages);
      })
      .finally(() => setIsLoading(false));
  } else {
    chatStore.onUserInput(userInput, attachImages)
      .then(() => setIsLoading(false));
  }
  // ... cleanup ...
};
```

---

## External Services

| Service | Purpose | Notes |
|---------|---------|-------|
| Local LLM API (localhost:8000) | Chat completions | OpenAI-compatible, no auth required |
| Tavily API | Web search | Requires API key in settings |

---

## Infrastructure

```
[Browser - 100% client-side]
├── Next.js 14 (static export)
├── ChatUI app (React, TypeScript, SCSS)
├── IndexedDB ─── conversation history
├── localStorage ─── config/settings
└── Zustand ─── state management (useChatStore, useAccessStore, useAppConfig, etc.)

[External]
├── Local LLM (vmlx, localhost:8000/v1)
└── Tavily API (web search)
```

**Build output:** Static HTML/JS/CSS (`next build && next export` pattern).
**Served via:** Any static file server (Python http.server, nginx, etc.) or `yarn dev` during development.
**No server runtime required.**

---

## Known Constraints

- **Local LLM only** — the app only talks to one OpenAI-compatible endpoint. No cloud LLM providers.
- **No multi-user/auth** — single-user local app. No access codes, no login.
- **No cloud sync** — conversations stay in the browser's IndexedDB. Clearing browser data loses chats.
- **No offline mode** — requires local LLM server running at configured endpoint.
- **No desktop build** — Tauri support removed. Browser-only.
- **Tavily rate limits** — free tier has usage caps (~1K queries/month).
- **Search context budget** — web search results consume token context. Long results + large conversations may hit context limits.
- **One search provider** — Tavily only. No DDGS fallback (dropped per human decision).
