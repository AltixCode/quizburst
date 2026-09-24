/**
 * The one place that talks to content-drip for quizburst's question bank.
 *
 * quizburst's pool is FULL_SYNC: there is no "today", the client fetches the
 * service's current full question set and caches it wholesale, exactly like
 * the bundled `QUESTIONS` (`src/logic/questions.ts`) it falls back to. The
 * bundled bank is never deleted and never stops working — it is what this
 * returns whenever the service is unreachable, slow, or answers with
 * something malformed.
 *
 * content-drip stores only the app-defined `data` shape, not an id (see its
 * schema): ids are reconstructed here in the bundled bank's own
 * `${category}-${index within category}` shape, walking items in the order
 * the service returns them. The service returns items ordered by creation,
 * and they were seeded grouped by category in the bundled bank's order, so
 * this reproduces the bundled ids exactly today and assigns stable new ones
 * as content is added later.
 */

import AsyncStorage from "@react-native-async-storage/async-storage";

import { QUESTIONS, type Question } from "@/logic/questions";

/** Where the content service lives. Overridable for a staging build. */
export const CONTENT_BASE_URL =
  process.env.EXPO_PUBLIC_CONTENT_BASE_URL ?? "https://content.altixcode.com";

/** Short: this can run while someone is already picking a category. */
const TIMEOUT_MS = 8_000;

const CACHE_KEY = "quizburst.content.v1.questions";

interface RawItem {
  category: string;
  prompt: string;
  options: string[];
  explanation: string;
}

function isRawItem(value: unknown): value is RawItem {
  if (!value || typeof value !== "object") return false;
  const q = value as Record<string, unknown>;
  return (
    typeof q.category === "string" &&
    typeof q.prompt === "string" &&
    Array.isArray(q.options) &&
    q.options.length === 4 &&
    q.options.every((o) => typeof o === "string") &&
    typeof q.explanation === "string"
  );
}

function isValidPool(value: unknown): value is RawItem[] {
  return Array.isArray(value) && value.length > 0 && value.every(isRawItem);
}

/** Assigns ids in the bundled bank's `${category}-${index}` shape, per item order. */
function withIds(items: RawItem[]): Question[] {
  const seen: Record<string, number> = {};
  return items.map((item) => {
    const index = seen[item.category] ?? 0;
    seen[item.category] = index + 1;
    return { id: `${item.category}-${index}`, ...item };
  });
}

async function readCache(): Promise<RawItem[] | null> {
  try {
    const raw = await AsyncStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const parsed: unknown = JSON.parse(raw);
    return isValidPool(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

async function writeCache(pool: RawItem[]): Promise<void> {
  try {
    await AsyncStorage.setItem(CACHE_KEY, JSON.stringify(pool));
  } catch {
    // A lost cache entry just costs one extra fetch next launch.
  }
}

/**
 * The cached pool from the last successful sync, if any — read on launch so
 * the store can swap in the last-known-good remote list without waiting on
 * a fresh network round trip.
 */
export async function cachedQuestionPool(): Promise<Question[] | null> {
  const cached = await readCache();
  return cached ? withIds(cached) : null;
}

/**
 * Fetches the service's current full question pool. Returns the bundled
 * `QUESTIONS` on any failure — network, timeout, or a malformed response.
 * Never throws.
 */
export async function fetchQuestionPool(): Promise<Question[]> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const url = `${CONTENT_BASE_URL}/api/v1/quizburst/questions/all`;
    const response = await fetch(url, {
      signal: controller.signal,
      headers: { accept: "application/json" },
    });
    if (!response.ok) throw new Error(`${response.status} from content-drip`);
    const body = (await response.json()) as { items?: unknown };
    if (isValidPool(body.items)) {
      void writeCache(body.items);
      return withIds(body.items);
    }
  } catch {
    // Network failure, timeout, or a malformed response: fall through.
  } finally {
    clearTimeout(timer);
  }
  return QUESTIONS;
}
