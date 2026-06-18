import { pool } from "@/db/db";
import type { KeywordMatch } from "./types";

/**
 * Keyword search on subject, sender, and snippet.
 * Subject and From are extracted from payload.headers JSONB array.
 * Snippet is at data->>'snippet'.
 */
export async function keywordSearch(
  tenantId: string,
  query: string,
  limit: number = 50
): Promise<KeywordMatch[]> {
  const pattern = `%${query}%`;

  const result = await pool.query(
    `
    SELECT
      e.entity_id AS message_id,
      -- Extract subject from payload.headers array
      (SELECT h.value FROM jsonb_array_elements(e.data->'payload'->'headers') h
       WHERE h->>'name' = 'Subject' LIMIT 1) AS subject,
      -- Extract from from payload.headers array
      (SELECT h.value FROM jsonb_array_elements(e.data->'payload'->'headers') h
       WHERE h->>'name' = 'From' LIMIT 1) AS sender,
      e.data->>'snippet' AS snippet
    FROM corsair_entities e
    JOIN corsair_accounts a ON e.account_id = a.id
    WHERE a.tenant_id = $2
      AND e.entity_type = 'messages'
      AND (
        LOWER(e.data->>'snippet') LIKE LOWER($1)
        OR EXISTS (
          SELECT 1 FROM jsonb_array_elements(e.data->'payload'->'headers') h
          WHERE h->>'name' = 'Subject' AND LOWER(h->>'value') LIKE LOWER($1)
        )
        OR EXISTS (
          SELECT 1 FROM jsonb_array_elements(e.data->'payload'->'headers') h
          WHERE h->>'name' = 'From' AND LOWER(h->>'value') LIKE LOWER($1)
        )
      )
    ORDER BY
      CASE WHEN EXISTS (
        SELECT 1 FROM jsonb_array_elements(e.data->'payload'->'headers') h
        WHERE h->>'name' = 'Subject' AND LOWER(h->>'value') LIKE LOWER($1)
      ) THEN 1 ELSE 0 END DESC
    LIMIT $3
    `,
    [pattern, tenantId, limit]
  );

  return result.rows.map((row) => {
    const subject = row.subject ?? "";
    const sender = row.sender ?? "";
    const snippet = row.snippet ?? "";

    const subjectScore = subject.toLowerCase().includes(query.toLowerCase()) ? 1.0 : 0;
    const senderScore = sender.toLowerCase().includes(query.toLowerCase()) ? 1.0 : 0;
    const snippetScore = snippet.toLowerCase().includes(query.toLowerCase()) ? 1.0 : 0;

    const totalScore = Math.min(
      1.0,
      subjectScore * 0.4 + senderScore * 0.3 + snippetScore * 0.3
    );

    return {
      messageId: row.message_id,
      subjectScore,
      senderScore,
      snippetScore,
      totalScore,
    };
  });
}
