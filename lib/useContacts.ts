"use client";

import { useState, useEffect, useCallback } from "react";

export interface Contact {
  id: string;
  name: string;
  emailid: string;
  tenantid: string;
  createdAt: string;
  updatedAt: string;
}

interface UseContactsResult {
  contacts: Contact[];
  loading: boolean;
  add: (name: string, email: string) => Promise<Contact | null>;
  remove: (id: string) => Promise<void>;
  refresh: () => void;
}

export function useContacts(): UseContactsResult {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchContacts = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/contacts");
      if (!res.ok) throw new Error("Failed to fetch contacts");
      const data = await res.json();
      setContacts(data.contacts ?? []);
    } catch (err) {
      console.error("[useContacts]", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchContacts();
  }, [fetchContacts]);

  const add = useCallback(
    async (name: string, email: string): Promise<Contact | null> => {
      try {
        const res = await fetch("/api/contacts", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name, email }),
        });
        if (!res.ok) {
          const err = await res.json();
          throw new Error(err.error || "Failed to add contact");
        }
        const data = await res.json();
        setContacts((prev) => [...prev, data.contact]);
        return data.contact;
      } catch (err) {
        console.error("[useContacts] add:", err);
        return null;
      }
    },
    []
  );

  const remove = useCallback(async (id: string): Promise<void> => {
    try {
      await fetch(`/api/contacts?id=${id}`, { method: "DELETE" });
      setContacts((prev) => prev.filter((c) => c.id !== id));
    } catch (err) {
      console.error("[useContacts] remove:", err);
    }
  }, []);

  return { contacts, loading, add, remove, refresh: fetchContacts };
}
