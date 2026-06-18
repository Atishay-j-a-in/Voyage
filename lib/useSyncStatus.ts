"use client";

import { useState, useEffect, useCallback } from "react";

interface SyncStatus {
  gmailSync: "idle" | "syncing" | "success" | "failure";
  calendarSync: "idle" | "syncing" | "success" | "failure";
  gmailSyncedAt: string | null;
  calendarSyncedAt: string | null;
  updatedAt: string | null;
}

interface UseSyncStatusResult {
  status: SyncStatus | null;
  loading: boolean;
  refresh: () => void;
}

export function useSyncStatus(pollIntervalMs = 5000): UseSyncStatusResult {
  const [status, setStatus] = useState<SyncStatus | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchStatus = useCallback(async () => {
    try {
      const res = await fetch("/api/sync-status");
      if (!res.ok) return;
      const data = await res.json();
      setStatus(data);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStatus();
    const id = setInterval(fetchStatus, pollIntervalMs);
    return () => clearInterval(id);
  }, [fetchStatus, pollIntervalMs]);

  return { status, loading, refresh: fetchStatus };
}