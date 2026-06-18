"use client";

import { useState, useEffect, useCallback } from "react";
import type { EmailThread } from "../app/workspace/_data/mock";

interface UseEmailsResult {
  emails: EmailThread[];
  loading: boolean;
  error: string | null;
  refresh: () => void;
}

/**
 * Hook to fetch synced emails from the Corsair DB.
 * Returns data in the EmailThread format the UI expects.
 */
export function useEmails(): UseEmailsResult {
  const [emails, setEmails] = useState<EmailThread[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchEmails = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/emails");
      if (!res.ok) {
        throw new Error(`Failed to fetch emails: ${res.status}`);
      }
      const data = await res.json();
      setEmails(data.emails ?? []);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      setError(message);
      console.error("[useEmails]", message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchEmails();
  }, [fetchEmails]);

  return { emails, loading, error, refresh: fetchEmails };
}
