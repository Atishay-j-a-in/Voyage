import { pool } from "@/db/db";
import { generateEmbedding } from "@/server/agent";
import { vectorSearch } from "./vectorSearch";
import { keywordSearch } from "./keywordSearch";
import { rankResults } from "./ranking";
import { deduplicateResults } from "./dedup";
import type { SearchOptions, SearchResult } from "./types";

/**
 * Hybrid search combining semantic vector search with keyword search.
 *
 * Flow:
 * 1. Generate embedding for query
 * 2. Vector search (cosine similarity) + keyword search in parallel
 * 3. Fetch full email data from DB
 * 4. Merge, rank, deduplicate
 * 5. Return top 20
 */
export async function search(
  options: SearchOptions
): Promise<SearchResult[]> {
  const { tenantId, query, limit = 20 } = options;

  if (!query.trim()) return [];

  console.log(`[search] Starting search for: "${query}"`);

  // 1. Generate query embedding
  let queryEmbedding: number[] | null = null;
  try {
    const emb = await generateEmbedding([query]);
    queryEmbedding = emb ?? null;
  } catch (err) {
    console.error("[search] Embedding generation failed:", err);
  }

  if (!queryEmbedding) {
    // Fallback: keyword-only search
    console.log("[search] No embedding, falling back to keyword-only");
    const keywordMatches = await keywordSearch(tenantId, query, limit * 2);
    console.log(`[search] Keyword matches: ${keywordMatches.length}`);
    const ids = keywordMatches.map((k) => k.messageId);
    const dataMap = await fetchEmailData(tenantId, ids);
    const ranked = rankResults([], keywordMatches, dataMap, limit);
    return deduplicateResults(ranked);
  }

  console.log(`[search] Embedding generated (${queryEmbedding.length} dims)`);

  // 2. Run vector + keyword search in parallel
  const [vectorMatches, keywordMatches] = await Promise.all([
    vectorSearch(tenantId, queryEmbedding, limit * 3).catch((err) => {
      console.error("[search] Vector search failed:", err);
      return [];
    }),
    keywordSearch(tenantId, query, limit * 3).catch((err) => {
      console.error("[search] Keyword search failed:", err);
      return [];
    }),
  ]);

  console.log(`[search] Vector: ${vectorMatches.length}, Keyword: ${keywordMatches.length}`);

  // 3. Collect all unique message IDs to fetch full data
  const allIds = new Set<string>();
  for (const vm of vectorMatches) allIds.add(vm.messageId);
  for (const km of keywordMatches) allIds.add(km.messageId);

  // 4. Fetch full email data
  const dataMap = await fetchEmailData(tenantId, Array.from(allIds));

  // 5. Rank and deduplicate
  const ranked = rankResults(vectorMatches, keywordMatches, dataMap, limit);
  return deduplicateResults(ranked);
}

/**
 * Fetch email data from corsair_entities for a set of message IDs.
 * Returns a Map<messageId, data>.
 */
async function fetchEmailData(
  tenantId: string,
  messageIds: string[]
): Promise<Map<string, any>> {
  if (messageIds.length === 0) return new Map();

  // Use parameterized query with ANY for the IN clause
  const result = await pool.query(
    `
    SELECT
      e.entity_id,
      e.data
    FROM corsair_entities e
    JOIN corsair_accounts a ON e.account_id = a.id
    WHERE a.tenant_id = $1
      AND e.entity_type = 'messages'
      AND e.entity_id = ANY($2)
    `,
    [tenantId, messageIds]
  );

  const map = new Map<string, any>();
  for (const row of result.rows) {
    map.set(row.entity_id, row.data);
  }
  return map;
}
