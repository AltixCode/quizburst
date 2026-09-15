/**
 * The run in progress, the daily cap, the streak and the per-category record.
 *
 * Three of the paywall's four claims live here — every category, no daily cap, and the
 * category stats — and each takes `isPremium` explicitly at the call site. The fourth is the
 * template's ad removal. Explanations are shown to everyone: withholding the *reason* an
 * answer is right would make the free tier actively worse at teaching, which is not a
 * business model, it is a grudge.
 */
import AsyncStorage from "@react-native-async-storage/async-storage";
import { create } from "zustand";

import {
  CATEGORIES,
  FREE_CATEGORIES,
  type Question,
  canUseCategory,
  questionById,
  questionsIn,
} from "@/logic/questions";

export const QUIZ_CACHE_KEY = "quizburst.state.v1";

/** Questions a free player may answer in a day. The purchase removes the cap entirely. */
export const FREE_DAILY = 5;

export interface CategoryStat {
  answered: number;
  correct: number;
}

interface QuizState {
  category: string;
  /** Question ids answered, per day key, so the cap resets at local midnight. */
  answeredToday: string[];
  todayKey: string | null;
  /** Correct/answered per category — the paid "category stats". */
  stats: Record<string, CategoryStat>;
  /** Consecutive days with at least one question answered. */
  streak: number;
  lastPlayedKey: string | null;
  /** The question on screen, and whether it has been answered yet. */
  current: Question | null;
  chosenIndex: number | null;

  startDay: (dayKey: string) => void;
  setCategory: (id: string, isPremium: boolean) => "set" | "locked";
  next: (isPremium: boolean) => "served" | "daily-cap" | "category-done";
  submit: (
    index: number,
    correctIndex: number,
  ) => "right" | "wrong" | "ignored";
  remainingToday: (isPremium: boolean) => number;
  accuracyIn: (category: string) => number;
  persist: () => Promise<void>;
  hydrate: () => Promise<void>;
}

function validStats(value: unknown): Record<string, CategoryStat> {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  const out: Record<string, CategoryStat> = {};
  for (const [id, stat] of Object.entries(value as Record<string, unknown>)) {
    if (
      !CATEGORIES.some((c) => c.id === id) ||
      !stat ||
      typeof stat !== "object"
    )
      continue;
    const { answered, correct } = stat as CategoryStat;
    if (typeof answered !== "number" || typeof correct !== "number") continue;
    if (answered < 0 || correct < 0 || correct > answered) continue;
    out[id] = { answered, correct };
  }
  return out;
}

const validIds = (value: unknown): string[] =>
  Array.isArray(value)
    ? value.filter(
        (v): v is string => typeof v === "string" && !!questionById(v),
      )
    : [];

/** The day before `key`, as a key. */
function previousKey(key: string): string {
  const [y, m, d] = key.split("-").map(Number);
  const date = new Date(y!, m! - 1, d! - 1);
  return `${date.getFullYear()}-${`${date.getMonth() + 1}`.padStart(2, "0")}-${`${date.getDate()}`.padStart(2, "0")}`;
}

export const useQuizStore = create<QuizState>((set, get) => ({
  category: FREE_CATEGORIES[0]!,
  answeredToday: [],
  todayKey: null,
  stats: {},
  streak: 0,
  lastPlayedKey: null,
  current: null,
  chosenIndex: null,

  startDay(dayKey) {
    const { todayKey } = get();
    // A new day empties today's list, which is what makes the cap a *daily* cap rather than
    // a lifetime one.
    if (todayKey === dayKey) return;
    set({
      todayKey: dayKey,
      answeredToday: [],
      current: null,
      chosenIndex: null,
    });
    void get().persist();
  },

  setCategory(id, isPremium) {
    if (!canUseCategory(id, isPremium)) return "locked";
    set({ category: id, current: null, chosenIndex: null });
    void get().persist();
    return "set";
  },

  next(isPremium) {
    const { category, answeredToday } = get();
    if (!isPremium && answeredToday.length >= FREE_DAILY) return "daily-cap";

    const unseen = questionsIn(category).find(
      (q) => !answeredToday.includes(q.id),
    );
    // A category emptied for today is not the same as hitting the cap, and the screen says
    // something different for each.
    if (!unseen) return "category-done";

    set({ current: unseen, chosenIndex: null });
    return "served";
  },

  submit(index, correctIndex) {
    const { current, chosenIndex, category, todayKey, lastPlayedKey, streak } =
      get();
    // Answering twice must not count twice, or accuracy is whatever a player taps.
    if (!current || chosenIndex !== null) return "ignored";

    const right = index === correctIndex;
    const stat = get().stats[category] ?? { answered: 0, correct: 0 };

    // The streak counts days played, and only advances on the first answer of a new day.
    let nextStreak = streak;
    if (todayKey && lastPlayedKey !== todayKey) {
      nextStreak = lastPlayedKey === previousKey(todayKey) ? streak + 1 : 1;
    }

    set((s) => ({
      chosenIndex: index,
      answeredToday: [...s.answeredToday, current.id],
      stats: {
        ...s.stats,
        [category]: {
          answered: stat.answered + 1,
          correct: stat.correct + (right ? 1 : 0),
        },
      },
      streak: nextStreak,
      lastPlayedKey: todayKey,
    }));
    void get().persist();
    return right ? "right" : "wrong";
  },

  remainingToday(isPremium) {
    if (isPremium) return Number.POSITIVE_INFINITY;
    return Math.max(0, FREE_DAILY - get().answeredToday.length);
  },

  accuracyIn(category) {
    const stat = get().stats[category];
    if (!stat || stat.answered === 0) return 0;
    return stat.correct / stat.answered;
  },

  async persist() {
    const { category, answeredToday, todayKey, stats, streak, lastPlayedKey } =
      get();
    try {
      await AsyncStorage.setItem(
        QUIZ_CACHE_KEY,
        JSON.stringify({
          category,
          answeredToday,
          todayKey,
          stats,
          streak,
          lastPlayedKey,
        }),
      );
    } catch {
      // A lost record is survivable; a failed launch is not.
    }
  },

  async hydrate() {
    try {
      const raw = await AsyncStorage.getItem(QUIZ_CACHE_KEY);
      if (!raw) return;
      const parsed: unknown = JSON.parse(raw);
      if (!parsed || typeof parsed !== "object") return;
      const record = parsed as Record<string, unknown>;
      const streak = record.streak;
      set({
        category:
          typeof record.category === "string" &&
          CATEGORIES.some((c) => c.id === record.category)
            ? record.category
            : FREE_CATEGORIES[0]!,
        answeredToday: validIds(record.answeredToday),
        todayKey: typeof record.todayKey === "string" ? record.todayKey : null,
        stats: validStats(record.stats),
        streak:
          typeof streak === "number" && Number.isFinite(streak) && streak >= 0
            ? Math.floor(streak)
            : 0,
        lastPlayedKey:
          typeof record.lastPlayedKey === "string"
            ? record.lastPlayedKey
            : null,
        current: null,
        chosenIndex: null,
      });
    } catch {
      // Unreadable storage starts clean rather than preventing launch.
    }
  },
}));
