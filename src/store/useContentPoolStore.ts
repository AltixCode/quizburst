/**
 * Syncs the question bank shown by `src/logic/questions.ts` with
 * content-drip on launch.
 *
 * "on launch, then leave it alone" — a full-sync pool has no per-day
 * cadence to chase, so there is nothing to poll for during a session. The
 * swap into `setActivePool` is skipped while a question is already on
 * screen and unanswered (`useQuizStore`'s `current`), so a sync landing
 * mid-question never pulls the content out from under an answer the player
 * is about to submit.
 */
import { create } from "zustand";

import { setActivePool } from "@/logic/questions";
import { cachedQuestionPool, fetchQuestionPool } from "@/content/sync";
import { useQuizStore } from "@/store/useQuizStore";

interface ContentPoolState {
  /** True once a sync (successful or fallen back) has completed at least once. */
  synced: boolean;
  refresh: () => Promise<void>;
}

/** Whether it is safe to swap the active pool right now. */
function nothingInProgress(): boolean {
  return useQuizStore.getState().current === null;
}

export const useContentPoolStore = create<ContentPoolState>((set) => ({
  synced: false,

  async refresh() {
    const cached = await cachedQuestionPool();
    if (cached && nothingInProgress()) setActivePool(cached);

    const fresh = await fetchQuestionPool();
    if (nothingInProgress()) setActivePool(fresh);
    set({ synced: true });
  },
}));
