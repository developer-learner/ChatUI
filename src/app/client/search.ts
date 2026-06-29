import { getClientConfig } from "../config/client";

export interface SearchResult {
  title: string;
  url: string;
  content: string;
}

export interface TavilySearchResponse {
  results: SearchResult[];
  answer?: string;
  query: string;
}

export async function tavilySearch(
  query: string,
  apiKey: string,
  maxResults: number = 3,
): Promise<SearchResult[]> {
  if (!apiKey || apiKey === "none") {
    console.warn("[Tavily] No API key configured, skipping search");
    return [];
  }

  try {
    const response = await fetch("https://api.tavily.com/search", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        api_key: apiKey,
        query,
        max_results: maxResults,
        search_depth: "basic",
        include_answer: false,
      }),
    });

    if (!response.ok) {
      console.error(
        `[Tavily] Search failed: ${response.status} ${response.statusText}`,
      );
      return [];
    }

    const data: TavilySearchResponse = await response.json();
    return data.results ?? [];
  } catch (error) {
    console.error("[Tavily] Search error:", error);
    return [];
  }
}

export function formatSearchResults(
  results: SearchResult[],
  originalQuery: string,
): string {
  if (results.length === 0) return originalQuery;

  const header = "[Web Search Results]";
  const footer = "[End Search Results]";
  const numbered = results
    .map(
      (r, i) => {
        const raw = r.content ?? "";
        const sliced = raw.slice(0, 197);
        const display = sliced.replace(/\.$/, "") + (sliced ? "..." : "");
        return `${i + 1}. ${r.title} - ${r.url}: ${display}`;
      },
    )
    .join("\n");

  return `${header}\n${numbered}\n${footer}\n\nUser question: ${originalQuery}`;
}
