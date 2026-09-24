import AsyncStorage from "@react-native-async-storage/async-storage";

import { QUESTIONS } from "@/logic/questions";
import {
  CONTENT_BASE_URL,
  cachedQuestionPool,
  fetchQuestionPool,
} from "../sync";

const RAW = {
  category: "geography",
  prompt: "Swapped?",
  options: ["A", "B", "C", "D"],
  explanation: "Because this is a fetched item.",
};

const install = (fn: unknown) => {
  (globalThis as { fetch?: unknown }).fetch = fn;
};

const ok = (body: unknown) =>
  jest.fn(async () => ({ ok: true, status: 200, json: async () => body }));

beforeEach(async () => {
  jest.restoreAllMocks();
  await AsyncStorage.clear();
});

describe("fetchQuestionPool", () => {
  it("hits the content-drip questions pool for this app", async () => {
    const fetcher = ok({ items: [RAW] });
    install(fetcher);
    await fetchQuestionPool();
    expect((fetcher as jest.Mock).mock.calls[0]![0]).toBe(
      `${CONTENT_BASE_URL}/api/v1/quizburst/questions/all`,
    );
  });

  it("reconstructs ids in the bundled bank's shape, per category", async () => {
    install(
      ok({
        items: [
          RAW,
          { ...RAW, prompt: "Second?" },
          { ...RAW, category: "science", prompt: "Science one?" },
        ],
      }),
    );
    const pool = await fetchQuestionPool();
    expect(pool.map((q) => q.id)).toEqual([
      "geography-0",
      "geography-1",
      "science-0",
    ]);
  });

  it("falls back to the bundled bank on a network failure", async () => {
    install(
      jest.fn(async () => {
        throw new Error("Network request failed");
      }),
    );
    expect(await fetchQuestionPool()).toEqual(QUESTIONS);
  });

  it("falls back to the bundled bank on an HTTP error", async () => {
    install(
      jest.fn(async () => ({ ok: false, status: 503, json: async () => ({}) })),
    );
    expect(await fetchQuestionPool()).toEqual(QUESTIONS);
  });

  it("falls back to the bundled bank on a malformed response", async () => {
    install(ok({ items: [{ prompt: "missing everything else" }] }));
    expect(await fetchQuestionPool()).toEqual(QUESTIONS);
  });

  it("falls back to the bundled bank on an empty pool", async () => {
    install(ok({ items: [] }));
    expect(await fetchQuestionPool()).toEqual(QUESTIONS);
  });

  it("caches a successful fetch for cachedQuestionPool to read back", async () => {
    install(ok({ items: [RAW] }));
    await fetchQuestionPool();
    const cached = await cachedQuestionPool();
    expect(cached).toEqual([{ id: "geography-0", ...RAW }]);
  });
});

describe("cachedQuestionPool", () => {
  it("is null when nothing has been cached yet", async () => {
    expect(await cachedQuestionPool()).toBeNull();
  });

  it("is null when the cache holds garbage", async () => {
    await AsyncStorage.setItem(
      "quizburst.content.v1.questions",
      "not json at all {{{",
    );
    expect(await cachedQuestionPool()).toBeNull();
  });
});
