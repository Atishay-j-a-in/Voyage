"use client";

import { useState, useCallback, useRef, useEffect } from "react";

import type { EmailThread } from "@/app/workspace/_data/mock";

interface UseSearchResult {
  results: EmailThread[];
  loading: boolean;
  query: string;
  search: (q: string) => void;
  clear: () => void;
}

/**
 * Debounced search hook. Queries /api/search and returns results
 * in the EmailThread format the UI expects.
 */
export function useSearch(debounceMs = 300): UseSearchResult {
  const [results, setResults] = useState<EmailThread[]>([]);
  const [loading, setLoading] = useState(false);
  const [query, setQuery] = useState("");
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const doSearch = useCallback(async (q: string) => {
    if (!q.trim()) {
      setResults([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`/api/search?q=${encodeURIComponent(q)}`);
      if (!res.ok) throw new Error("Search failed");
      const data = await res.json();

      // Convert SearchResult to EmailThread format
      const threads: EmailThread[] = (data.results ?? []).map((r: any) => ({
        id: r.threadId,
        sender: r.sender,
        subject: r.subject,
        snippet: r.snippet,
        timestamp: formatISTDate(r.timestamp),
        isPrimary: r.isImportant,
        isUnread: r.isUnread,
        isStarred: r.isStarred,
        isImportant: r.isImportant,
        labels: r.labels,
        folder: (r.labels?.includes("SENT") ? "sent" : "inbox") as "inbox",
        body: r.body ? [r.body] : [],
        recipients: ["to me"],
        rawFrom: r.sender,
        rawSubject: r.subject,
        messageCount: 1,
      }));

      setResults(threads);
    } catch (err) {
      console.error("[useSearch]", err);
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const search = useCallback(
    (q: string) => {
      setQuery(q);
      console.log("[useSearch] search query:", q);
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => doSearch(q), debounceMs);
    },
    [doSearch, debounceMs]
  );

  const clear = useCallback(() => {
    setQuery("");
    setResults([]);
    if (timerRef.current) clearTimeout(timerRef.current);
  }, []);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  return { results, loading, query, search, clear };
}

function formatISTDate(epochOrDate: string | number): string {
  const ts = typeof epochOrDate === "string" ? Number(epochOrDate) : epochOrDate;
  if (!ts || isNaN(ts)) return "";
  const d = new Date(ts);
  if (isNaN(d.getTime())) return "";

  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffHours = diffMs / (1000 * 60 * 60);

  if (diffHours < 24) {
    return d.toLocaleTimeString("en-IN", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
      timeZone: "Asia/Kolkata",
    });
  } else if (diffHours < 48) {
    return "Yesterday";
  } else {
    return d.toLocaleDateString("en-IN", {
      month: "short",
      day: "numeric",
      timeZone: "Asia/Kolkata",
    });
  }
}
