import { openDB, type IDBPDatabase } from "idb";
import type { PendingChange } from "../types";

const DB_NAME = "pumpin-offline";
const DB_VERSION = 1;

interface OfflineDB {
  pendingChanges: {
    key: string;
    value: PendingChange;
  };
  cache: {
    key: string;
    value: { data: unknown; updatedAt: string };
  };
}

let dbPromise: Promise<IDBPDatabase<OfflineDB>> | null = null;

function getDB() {
  if (!dbPromise) {
    dbPromise = openDB<OfflineDB>(DB_NAME, DB_VERSION, {
      upgrade(db) {
        if (!db.objectStoreNames.contains("pendingChanges")) {
          db.createObjectStore("pendingChanges", { keyPath: "id" });
        }
        if (!db.objectStoreNames.contains("cache")) {
          db.createObjectStore("cache", { keyPath: undefined });
        }
      },
    });
  }
  return dbPromise;
}

// Cache helpers for offline reads
export async function getCached<T>(key: string): Promise<T | null> {
  const db = await getDB();
  const result = await db.get("cache", key);
  return result ? (result.data as T) : null;
}

export async function setCache(key: string, data: unknown): Promise<void> {
  const db = await getDB();
  await db.put("cache", { data, updatedAt: new Date().toISOString() }, key);
}

// Pending changes for offline writes
export async function addPendingChange(change: PendingChange): Promise<void> {
  const db = await getDB();
  await db.put("pendingChanges", change);
}

export async function getAllPendingChanges(): Promise<PendingChange[]> {
  const db = await getDB();
  return db.getAll("pendingChanges");
}

export async function removePendingChange(id: string): Promise<void> {
  const db = await getDB();
  await db.delete("pendingChanges", id);
}

export async function clearPendingChanges(): Promise<void> {
  const db = await getDB();
  await db.clear("pendingChanges");
}
