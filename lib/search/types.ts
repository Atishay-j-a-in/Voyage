export interface SearchResult {
  messageId: string;
  threadId: string;
  subject: string;
  sender: string;
  snippet: string;
  body?: string;
  timestamp: string;
  labels: string[];
  isUnread: boolean;
  isStarred: boolean;
  isImportant: boolean;
  semanticScore: number;
  keywordScore: number;
  priorityScore: number;
  finalScore: number;
}

export interface SearchOptions {
  tenantId: string;
  query: string;
  limit?: number;
}

export interface VectorMatch {
  messageId: string;
  similarity: number;
}

export interface KeywordMatch {
  messageId: string;
  subjectScore: number;
  senderScore: number;
  snippetScore: number;
  totalScore: number;
}
