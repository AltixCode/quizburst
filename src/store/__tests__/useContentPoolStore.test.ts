import { questionById, resetActivePool } from "@/logic/questions";
import { useContentPoolStore } from "../useContentPoolStore";
import { useQuizStore } from "../useQuizStore";

jest.mock("@/content/sync", () => ({
  cachedQuestionPool: jest.fn(),
  fetchQuestionPool: jest.fn(),
}));

// eslint-disable-next-line @typescript-eslint/no-var-requires
const sync = require("@/content/sync") as {
  cachedQuestionPool: jest.Mock;
  fetchQuestionPool: jest.Mock;
};

const REMOTE = [
  {
    id: "geography-0",
    category: "geography",
    prompt: "Remote question?",
    options: ["A", "B", "C", "D"],
    explanation: "From the service.",
  },
];

beforeEach(() => {
  jest.clearAllMocks();
  resetActivePool();
  useContentPoolStore.setState({ synced: false });
  useQuizStore.setState({ current: null, chosenIndex: null });
});

it("swaps in the synced pool when nothing is on screen", async () => {
  sync.cachedQuestionPool.mockResolvedValue(null);
  sync.fetchQuestionPool.mockResolvedValue(REMOTE);

  await useContentPoolStore.getState().refresh();

  expect(questionById("geography-0")).toEqual(REMOTE[0]);
  expect(useContentPoolStore.getState().synced).toBe(true);
});

it("does not swap the pool while a question is on screen, unanswered", async () => {
  sync.cachedQuestionPool.mockResolvedValue(null);
  sync.fetchQuestionPool.mockResolvedValue(REMOTE);
  useQuizStore.setState({
    current: {
      id: "geography-0",
      category: "geography",
      prompt: "Bundled question in progress",
      options: ["A", "B", "C", "D"],
      explanation: "Local.",
    },
    chosenIndex: null,
  });

  await useContentPoolStore.getState().refresh();

  // Still the bundled bank's own question, not the remote one — nothing
  // swapped underneath the question already on screen.
  expect(questionById("geography-0")?.prompt).toBe(
    "Which ocean lies between Africa and Australia?",
  );
  // The sync itself still completes and is marked done.
  expect(useContentPoolStore.getState().synced).toBe(true);
});

it("uses the cache first, then the fresh fetch", async () => {
  const cached = [{ ...REMOTE[0]!, prompt: "Cached question" }];
  sync.cachedQuestionPool.mockResolvedValue(cached);
  sync.fetchQuestionPool.mockResolvedValue(REMOTE);

  await useContentPoolStore.getState().refresh();

  expect(questionById("geography-0")).toEqual(REMOTE[0]);
});
