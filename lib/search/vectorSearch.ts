import { pool } from "@/db/db";
import type { VectorMatch } from "./types";

/**
 * Perform vector similarity search using pgvector cosine distance.
 * Returns top matches ordered by similarity (highest first).
 */
export async function vectorSearch(
  tenantId: string,
  queryEmbedding: number[],
  limit: number = 50
): Promise<VectorMatch[]> {
  const embeddingStr = `[${queryEmbedding.join(",")}]`;

  const result = await pool.query(
    `
    SELECT
      message_id,
      1 - (embedding <=> $1::vector) AS similarity
    FROM email_embeddings
    WHERE tenant_id = $2
    ORDER BY embedding <=> $1::vector
    LIMIT $3
    `,
    [embeddingStr, tenantId, limit]
  );

  return result.rows.map((row) => ({
    messageId: row.message_id,
    similarity: parseFloat(row.similarity),
  }));
}
