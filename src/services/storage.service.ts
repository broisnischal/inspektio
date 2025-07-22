import type { StorageEntry, StorageType } from "../types";

export class StorageService {
  async getAllEntries(storageType: StorageType): Promise<StorageEntry[]> {
    return new Promise((resolve) => {
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        if (!tabs[0]?.id) {
          resolve([]);
          return;
        }

        chrome.scripting.executeScript(
          {
            target: { tabId: tabs[0].id },
            func: (type: StorageType) => {
              const storage = type === "local" ? localStorage : sessionStorage;
              const entries: StorageEntry[] = [];

              for (let i = 0; i < storage.length; i++) {
                const key = storage.key(i);
                if (key !== null) {
                  const value = storage.getItem(key) || "";
                  entries.push({ key, value });
                }
              }

              return entries.sort((a, b) => a.key.localeCompare(b.key));
            },
            args: [storageType],
          },
          (results) => {
            resolve(results?.[0]?.result || []);
          }
        );
      });
    });
  }

  async setEntry(
    storageType: StorageType,
    key: string,
    value: string
  ): Promise<void> {
    return new Promise((resolve, reject) => {
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        if (!tabs[0]?.id) {
          reject(new Error("No active tab found"));
          return;
        }

        chrome.scripting.executeScript(
          {
            target: { tabId: tabs[0].id },
            func: (type: StorageType, k: string, v: string) => {
              const storage = type === "local" ? localStorage : sessionStorage;
              storage.setItem(k, v);
              return true;
            },
            args: [storageType, key, value],
          },
          () => {
            resolve();
          }
        );
      });
    });
  }

  async deleteEntry(storageType: StorageType, key: string): Promise<void> {
    return new Promise((resolve, reject) => {
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        if (!tabs[0]?.id) {
          reject(new Error("No active tab found"));
          return;
        }

        chrome.scripting.executeScript(
          {
            target: { tabId: tabs[0].id },
            func: (type: StorageType, k: string) => {
              const storage = type === "local" ? localStorage : sessionStorage;
              storage.removeItem(k);
              return true;
            },
            args: [storageType, key],
          },
          () => {
            resolve();
          }
        );
      });
    });
  }

  async clearAll(storageType: StorageType): Promise<void> {
    return new Promise((resolve, reject) => {
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        if (!tabs[0]?.id) {
          reject(new Error("No active tab found"));
          return;
        }

        chrome.scripting.executeScript(
          {
            target: { tabId: tabs[0].id },
            func: (type: StorageType) => {
              const storage = type === "local" ? localStorage : sessionStorage;
              storage.clear();
              return true;
            },
            args: [storageType],
          },
          () => {
            resolve();
          }
        );
      });
    });
  }

  async exportEntries(storageType: StorageType): Promise<string> {
    const entries = await this.getAllEntries(storageType);
    const exportData = entries.reduce((acc, entry) => {
      acc[entry.key] = entry.value;
      return acc;
    }, {} as Record<string, string>);

    return JSON.stringify(exportData, null, 2);
  }

  async importEntries(
    storageType: StorageType,
    jsonData: string
  ): Promise<void> {
    try {
      const data = JSON.parse(jsonData);

      for (const [key, value] of Object.entries(data)) {
        await this.setEntry(storageType, key, String(value));
      }
    } catch (error) {
      throw new Error("Invalid JSON format");
    }
  }
}

export const storageService = new StorageService();
