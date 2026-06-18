import type { SearchResult } from "./types";

/**
 * Remove duplicate results by messageId.
 * Keeps the entry with the highest finalScore.
 */
export function deduplicateResults(results: SearchResult[]): SearchResult[] {
  const seen = new Map<string, SearchResult>();

  for (const r of results) {
    const existing = seen.get(r.messageId);
    if (!existing || r.finalScore > existing.finalScore) {
      seen.set(r.messageId, r);
    }
  }

  return Array.from(seen.values());
}
