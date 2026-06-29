/**
 * Tests for Tavily web search client.
 *
 * AC Coverage:
 *   AC-3.2 — Tavily API is called with user query, returns results
 *   AC-3.3 — max_results is capped at 3
 *   AC-3.6 — No search call when API key is "none" or empty
 *   AC-3.7 — Results formatted with exact context block template
 */

import { jest, describe, it, expect, beforeEach } from "@jest/globals";

// ── Mock fetch globally ────────────────────────────────────────────
const mockFetch = jest.fn() as jest.MockedFunction<typeof fetch>;
global.fetch = mockFetch;

// ── Mock getClientConfig ───────────────────────────────────────────
jest.mock("../../src/app/config/client", () => ({
  getClientConfig: () => ({ buildMode: "export", isApp: false }),
}));

// ── Import after mocks ─────────────────────────────────────────────
import {
  tavilySearch,
  formatSearchResults,
  SearchResult,
} from "../../src/app/client/search";

// ── Helpers ────────────────────────────────────────────────────────
function mockTavilyResponse(results: SearchResult[]) {
  return {
    ok: true,
    status: 200,
    statusText: "OK",
    json: async () => ({ results, query: "test" }),
    headers: new Headers(),
    redirected: false,
    type: "basic" as ResponseType,
    url: "",
    body: null,
    bodyUsed: false,
    arrayBuffer: async () => new ArrayBuffer(0),
    blob: async () => new Blob(),
    formData: async () => new FormData(),
    text: async () => "",
    clone: function () {
      return this;
    },
  } as Response;
}

function mockTavilyError(status: number) {
  return {
    ok: false,
    status,
    statusText: `Error ${status}`,
    json: async () => ({ error: "bad request" }),
    headers: new Headers(),
    redirected: false,
    type: "basic" as ResponseType,
    url: "",
    body: null,
    bodyUsed: false,
    arrayBuffer: async () => new ArrayBuffer(0),
    blob: async () => new Blob(),
    formData: async () => new FormData(),
    text: async () => "",
    clone: function () {
      return this;
    },
  } as Response;
}

// ── Tests ──────────────────────────────────────────────────────────
describe("tavilySearch", () => {
  beforeEach(() => {
    mockFetch.mockReset();
  });

  // AC-3.2: Calls Tavily API with user query and returns results
  it("calls Tavily API with the user query and returns results", async () => {
    const fakeResults: SearchResult[] = [
      {
        title: "Paris",
        url: "https://en.wikipedia.org/wiki/Paris",
        content: "Paris is the capital of France.",
      },
    ];
    mockFetch.mockResolvedValueOnce(mockTavilyResponse(fakeResults));

    const results = await tavilySearch("capital of France", "tvly-test-key");

    expect(results).toHaveLength(1);
    expect(results[0].title).toBe("Paris");
    expect(results[0].url).toBe("https://en.wikipedia.org/wiki/Paris");

    // Verify the API was called with correct params
    expect(mockFetch).toHaveBeenCalledTimes(1);
    const [url, init] = mockFetch.mock.calls[0] as [string, RequestInit];
    expect(url).toContain("api.tavily.com");
    expect(url).toContain("/search");

    const body = JSON.parse(init.body as string);
    expect(body.query).toBe("capital of France");
    expect(body.api_key).toBe("tvly-test-key");
  });

  // AC-3.3: max_results is 3
  it("passes max_results=3 in the request body", async () => {
    mockFetch.mockResolvedValueOnce(mockTavilyResponse([]));

    await tavilySearch("test query", "tvly-test-key");

    const body = JSON.parse(
      (mockFetch.mock.calls[0] as [string, RequestInit])[1].body as string,
    );
    expect(body.max_results).toBe(3);
  });

  // AC-3.3: Custom max_results override
  it("allows overriding max_results", async () => {
    mockFetch.mockResolvedValueOnce(mockTavilyResponse([]));

    await tavilySearch("test query", "tvly-test-key", 5);

    const body = JSON.parse(
      (mockFetch.mock.calls[0] as [string, RequestInit])[1].body as string,
    );
    expect(body.max_results).toBe(5);
  });

  // AC-3.6: No search when API key is "none"
  it("returns empty array and skips API call when key is 'none'", async () => {
    const results = await tavilySearch("test query", "none");

    expect(results).toEqual([]);
    expect(mockFetch).not.toHaveBeenCalled();
  });

  // AC-3.6: No search when API key is empty
  it("returns empty array and skips API call when key is empty", async () => {
    const results = await tavilySearch("test query", "");

    expect(results).toEqual([]);
    expect(mockFetch).not.toHaveBeenCalled();
  });

  // Error handling: API returns non-200
  it("returns empty array on API error", async () => {
    mockFetch.mockResolvedValueOnce(mockTavilyError(401));

    const results = await tavilySearch("test query", "bad-key");

    expect(results).toEqual([]);
  });

  // Error handling: Network failure
  it("returns empty array on network failure", async () => {
    mockFetch.mockRejectedValueOnce(new Error("Network error"));

    const results = await tavilySearch("test query", "tvly-test-key");

    expect(results).toEqual([]);
  });

  // Returns multiple results
  it("returns up to max_results results", async () => {
    const fakeResults: SearchResult[] = [
      { title: "A", url: "https://a.com", content: "Content A" },
      { title: "B", url: "https://b.com", content: "Content B" },
      { title: "C", url: "https://c.com", content: "Content C" },
    ];
    mockFetch.mockResolvedValueOnce(mockTavilyResponse(fakeResults));

    const results = await tavilySearch("multi", "tvly-test-key");

    expect(results).toHaveLength(3);
  });
});

describe("formatSearchResults", () => {
  // AC-3.7: Exact context block template
  it("formats results with the exact template from AC-3.7", () => {
    const results: SearchResult[] = [
      {
        title: "Paris",
        url: "https://en.wikipedia.org/wiki/Paris",
        content:
          "Paris is the capital and largest city of France, a major European city and a global center for art, fashion, gastronomy and culture.",
      },
    ];

    const formatted = formatSearchResults(results, "What is the capital of France?");

    // Verify exact template structure
    expect(formatted).toBe(
      "[Web Search Results]\n" +
        "1. Paris - https://en.wikipedia.org/wiki/Paris: Paris is the capital and largest city of France, a major European city and a global center for art, fashion, gastronomy and culture...\n" +
        "[End Search Results]\n" +
        "\n" +
        "User question: What is the capital of France?",
    );
  });

  // AC-3.7: Content snippet truncated to ~200 chars
  it("truncates content snippets to approximately 200 characters", () => {
    const longContent = "A".repeat(500);
    const results: SearchResult[] = [
      {
        title: "Long",
        url: "https://example.com",
        content: longContent,
      },
    ];

    const formatted = formatSearchResults(results, "test");
    const contentLine = formatted.split("\n")[1]; // The numbered result line
    const snippet = contentLine.split(": ").slice(1).join(": ");

    // Snippet should be ~200 chars (the slice is .slice(0, 200))
    expect(snippet.length).toBeLessThanOrEqual(200);
  });

  // AC-3.7: Multiple results are numbered sequentially
  it("numbers results sequentially starting from 1", () => {
    const results: SearchResult[] = [
      { title: "First", url: "https://first.com", content: "Content 1" },
      { title: "Second", url: "https://second.com", content: "Content 2" },
      { title: "Third", url: "https://third.com", content: "Content 3" },
    ];

    const formatted = formatSearchResults(results, "query");
    const lines = formatted.split("\n");

    expect(lines[0]).toBe("[Web Search Results]");
    expect(lines[1]).toMatch(/^1\. First/);
    expect(lines[2]).toMatch(/^2\. Second/);
    expect(lines[3]).toMatch(/^3\. Third/);
    expect(lines[4]).toBe("[End Search Results]");
  });

  // AC-3.6: Empty results → original message returned verbatim
  it("returns original message verbatim when results are empty", () => {
    const original = "Hello, how are you?";
    const formatted = formatSearchResults([], original);

    expect(formatted).toBe(original);
  });

  // AC-3.7: Original query preserved at the end
  it("preserves the original user query at the end", () => {
    const results: SearchResult[] = [
      { title: "A", url: "https://a.com", content: "Content" },
    ];
    const query = "What is 2+2?";

    const formatted = formatSearchResults(results, query);

    expect(formatted).toContain(`User question: ${query}`);
  });

  // Content with null/undefined handled gracefully
  it("handles results with missing content gracefully", () => {
    const results: SearchResult[] = [
      { title: "No Content", url: "https://example.com", content: "" },
    ];

    const formatted = formatSearchResults(results, "query");
    expect(formatted).toContain("[Web Search Results]");
    expect(formatted).toContain("1. No Content");
  });
});
