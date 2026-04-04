import { supabase } from "./supabase";
import {
  addPendingChange,
  getAllPendingChanges,
  removePendingChange,
  getCached,
  setCache,
} from "./offlineDb";
import type { PendingChange } from "../types";

function generateId(): string {
  return crypto.randomUUID();
}

/**
 * Perform a Supabase operation with offline fallback.
 * For reads: try network first, fall back to cache.
 * For writes: try network first, queue if offline.
 */
export async function fetchWithCache<T>(
  cacheKey: string,
  fetcher: () => PromiseLike<{ data: T | null; error: unknown }>,
): Promise<T | null> {
  try {
    const { data, error } = await fetcher();
    if (error) {
      throw error;
    }
    if (data) {
      await setCache(cacheKey, data);
    }
    return data;
  } catch (e) {
    const cached = await getCached<T>(cacheKey);
    return cached;
  }
}

export async function mutateWithOffline(
  table: string,
  operation: PendingChange["operation"],
  data: Record<string, unknown>,
  mutator: () => PromiseLike<{ error: unknown }>,
): Promise<boolean> {
  try {
    const { error } = await mutator();
    if (error) {
      throw error;
    }
    return true;
  } catch (e) {
    // Queue for later sync
    await addPendingChange({
      id: generateId(),
      table,
      operation,
      data,
      created_at: new Date().toISOString(),
    });
    return false;
  }
}

export async function syncPendingChanges(): Promise<number> {
  const pending = await getAllPendingChanges();
  let synced = 0;

  for (const change of pending) {
    try {
      let error: unknown = null;

      switch (change.operation) {
        case "INSERT": {
          const result = await supabase.from(change.table).insert(change.data);
          error = result.error;
          break;
        }
        case "UPDATE": {
          const { id, ...rest } = change.data;
          const result = await supabase
            .from(change.table)
            .update(rest)
            .eq("id", id as string);
          error = result.error;
          break;
        }
        case "DELETE": {
          const result = await supabase
            .from(change.table)
            .delete()
            .eq("id", change.data.id as string);
          error = result.error;
          break;
        }
      }

      if (!error) {
        await removePendingChange(change.id);
        synced++;
      }
    } catch {
      // Still offline, stop trying
      break;
    }
  }

  return synced;
}
