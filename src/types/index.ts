export type StorageType = "local" | "session";

export interface StorageEntry {
  key: string;
  value: string;
}

export interface ExportData {
  storageType: StorageType;
  entries: Record<string, string>;
  timestamp: string;
  url: string;
}
