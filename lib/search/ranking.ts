import type { VectorMatch, KeywordMatch, SearchResult } from "./types";

/**
 * Merge vector and keyword results into ranked SearchResults.
 *
 * finalScore = semanticScore * 0.7 + keywordScore * 0.2 + priorityScore * 0.1
 *
 * Priority weights: high=1, medium=0.5, low=0
 */
export function rankResults(
  vectorMatches: VectorMatch[],
  keywordMatches: KeywordMatch[],
  emailDataMap: Map<string, any>,
  limit: number = 20
): SearchResult[] {
  // Build a lookup for keyword scores
  const keywordMap = new Map<string, KeywordMatch>();
  for (const km of keywordMatches) {
    keywordMap.set(km.messageId, km);
  }

  // Collect all unique message IDs from both result sets
  const allIds = new Set<string>();
  for (const vm of vectorMatches) allIds.add(vm.messageId);
  for (const km of keywordMatches) allIds.add(km.messageId);

  const results: SearchResult[] = [];

  for (const messageId of allIds) {
    const vm = vectorMatches.find((v) => v.messageId === messageId);
    const km = keywordMap.get(messageId);
    const data = emailDataMap.get(messageId);

    if (!data) continue;

    const semanticScore = vm?.similarity ?? 0;
    const keywordScore = km?.totalScore ?? 0;

    // Priority from labels
    const labels: string[] = data.labelIds ?? [];
    const priorityScore = labels.includes("IMPORTANT")
      ? 1.0
      : labels.includes("CATEGORY_PRIMARY")
      ? 0.7
      : labels.includes("STARRED")
      ? 0.5
      : 0;

    const finalScore =
      semanticScore * 0.7 + keywordScore * 0.2 + priorityScore * 0.1;

    // Extract subject, sender, snippet from JSONB data
    const headers = data.payload?.headers ?? [];
    const subject =
      headers.find((h: any) => h.name === "Subject")?.value ??
      data.subject ??
      "";
    const from =
      headers.find((h: any) => h.name === "From")?.value ?? data.from ?? "";
    const snippet = data.snippet ?? "";

    const senderName = extractSenderName(from);

    results.push({
      messageId,
      threadId: data.threadId ?? messageId,
      subject,
      sender: senderName,
      snippet,
      timestamp: data.internalDate ?? "",
      labels,
      isUnread: labels.includes("UNREAD"),
      isStarred: labels.includes("STARRED"),
      isImportant:
        labels.includes("IMPORTANT") || labels.includes("CATEGORY_PRIMARY"),
      semanticScore,
      keywordScore,
      priorityScore,
      finalScore,
    });
  }

  // Sort by final score descending
  results.sort((a, b) => b.finalScore - a.finalScore);

  return results.slice(0, limit);
}

function extractSenderName(from: string): string {
  if (!from) return "Unknown";
  const match = from.match(/^"?([^"<]+)"?\s*</);
  if (match) return match[1].trim();
  if (from.includes("@")) {
    return from.split("@")[0].replace(/[._-]/g, " ");
  }
  return from;
}
