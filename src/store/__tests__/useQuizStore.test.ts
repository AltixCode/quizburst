import AsyncStorage from '@react-native-async-storage/async-storage';

import { FREE_DAILY, QUIZ_CACHE_KEY, useQuizStore } from '../useQuizStore';
import { FREE_CATEGORIES, presentOptions, questionsIn } from '@/logic/questions';

const TODAY = '2026-09-15';
const YESTERDAY = '2026-09-14';
const FREE = FREE_CATEGORIES[0]!;

const reset = () =>
  useQuizStore.setState({
    category: FREE,
    answeredToday: [],
    todayKey: null,
    stats: {},
    streak: 0,
    lastPlayedKey: null,
    current: null,
    chosenIndex: null,
  });

/** Answers the served question correctly. */
const answerRight = () => {
  const question = useQuizStore.getState().current!;
  const { correctIndex } = presentOptions(question);
  return useQuizStore.getState().submit(correctIndex, correctIndex);
};

beforeEach(async () => {
  jest.clearAllMocks();
  await AsyncStorage.clear();
  reset();
  useQuizStore.getState().startDay(TODAY);
});

describe('serving questions', () => {
  it('serves one from the chosen category', () => {
    expect(useQuizStore.getState().next(false)).toBe('served');
    expect(useQuizStore.getState().current!.category).toBe(FREE);
  });

  it('does not serve the same question twice in a day', () => {
    useQuizStore.getState().next(false);
    const first = useQuizStore.getState().current!.id;
    answerRight();
    useQuizStore.getState().next(false);
    expect(useQuizStore.getState().current!.id).not.toBe(first);
  });

  it('says a category is finished, which is not the same as hitting the cap', () => {
    // The screen says something different for each, so the store must distinguish them.
    useQuizStore.setState({ answeredToday: questionsIn(FREE).map((q) => q.id) });
    expect(useQuizStore.getState().next(true)).toBe('category-done');
  });
});

describe('the daily cap', () => {
  it('stops a free player after five', () => {
    for (let i = 0; i < FREE_DAILY; i += 1) {
      expect(useQuizStore.getState().next(false)).toBe('served');
      answerRight();
    }
    expect(useQuizStore.getState().next(false)).toBe('daily-cap');
  });

  it('does not stop a paying player', () => {
    for (let i = 0; i < FREE_DAILY + 3; i += 1) {
      expect(useQuizStore.getState().next(true)).toBe('served');
      answerRight();
    }
  });

  it('counts down honestly, and is unlimited when paid', () => {
    expect(useQuizStore.getState().remainingToday(false)).toBe(FREE_DAILY);
    useQuizStore.getState().next(false);
    answerRight();
    expect(useQuizStore.getState().remainingToday(false)).toBe(FREE_DAILY - 1);
    expect(useQuizStore.getState().remainingToday(true)).toBe(Number.POSITIVE_INFINITY);
  });

  it('resets on a new day', () => {
    // Otherwise the "daily" cap is a lifetime cap, which is a different product.
    useQuizStore.setState({ answeredToday: ['a', 'b', 'c', 'd', 'e'] });
    useQuizStore.getState().startDay('2026-09-16');
    expect(useQuizStore.getState().remainingToday(false)).toBe(FREE_DAILY);
  });
});

describe('answering', () => {
  it('reports right and wrong', () => {
    useQuizStore.getState().next(false);
    const { correctIndex } = presentOptions(useQuizStore.getState().current!);
    const wrong = (correctIndex + 1) % 4;
    expect(useQuizStore.getState().submit(wrong, correctIndex)).toBe('wrong');
  });

  it('ignores a second answer to the same question', () => {
    // Otherwise accuracy is whatever a player taps until it is right.
    useQuizStore.getState().next(false);
    const { correctIndex } = presentOptions(useQuizStore.getState().current!);
    useQuizStore.getState().submit((correctIndex + 1) % 4, correctIndex);
    expect(useQuizStore.getState().submit(correctIndex, correctIndex)).toBe('ignored');
    expect(useQuizStore.getState().stats[FREE]!.answered).toBe(1);
    expect(useQuizStore.getState().stats[FREE]!.correct).toBe(0);
  });

  it('ignores an answer when nothing has been served', () => {
    expect(useQuizStore.getState().submit(0, 0)).toBe('ignored');
  });

  it('keeps per-category accuracy', () => {
    useQuizStore.getState().next(false);
    answerRight();
    expect(useQuizStore.getState().accuracyIn(FREE)).toBe(1);
    expect(useQuizStore.getState().accuracyIn('nature')).toBe(0);
  });
});

describe('the streak', () => {
  it('starts at one on the first day played', () => {
    useQuizStore.getState().next(false);
    answerRight();
    expect(useQuizStore.getState().streak).toBe(1);
  });

  it('advances when yesterday was played', () => {
    useQuizStore.setState({ streak: 4, lastPlayedKey: YESTERDAY });
    useQuizStore.getState().next(false);
    answerRight();
    expect(useQuizStore.getState().streak).toBe(5);
  });

  it('resets when a day was missed', () => {
    useQuizStore.setState({ streak: 9, lastPlayedKey: '2026-09-01' });
    useQuizStore.getState().next(false);
    answerRight();
    expect(useQuizStore.getState().streak).toBe(1);
  });

  it('does not advance twice in the same day', () => {
    useQuizStore.getState().next(false);
    answerRight();
    useQuizStore.getState().next(false);
    answerRight();
    expect(useQuizStore.getState().streak).toBe(1);
  });
});

describe('categories', () => {
  it('opens the free ones to everybody', () => {
    for (const id of FREE_CATEGORIES) {
      expect(useQuizStore.getState().setCategory(id, false)).toBe('set');
    }
  });

  it('withholds the rest until paid', () => {
    expect(useQuizStore.getState().setCategory('nature', false)).toBe('locked');
    expect(useQuizStore.getState().setCategory('nature', true)).toBe('set');
  });
});

describe('persistence', () => {
  it('round-trips the streak and the stats', async () => {
    useQuizStore.setState({ streak: 6, stats: { [FREE]: { answered: 10, correct: 7 } } });
    await useQuizStore.getState().persist();

    reset();
    await useQuizStore.getState().hydrate();
    expect(useQuizStore.getState().streak).toBe(6);
    expect(useQuizStore.getState().accuracyIn(FREE)).toBeCloseTo(0.7, 6);
  });

  it('rejects a stat claiming more correct than answered', async () => {
    await AsyncStorage.setItem(
      QUIZ_CACHE_KEY,
      JSON.stringify({ stats: { [FREE]: { answered: 3, correct: 9 } } }),
    );
    await useQuizStore.getState().hydrate();
    expect(useQuizStore.getState().stats[FREE]).toBeUndefined();
  });

  it('drops answered ids for questions that no longer exist', async () => {
    await AsyncStorage.setItem(QUIZ_CACHE_KEY, JSON.stringify({ answeredToday: ['retired'] }));
    await useQuizStore.getState().hydrate();
    expect(useQuizStore.getState().answeredToday).toEqual([]);
  });

  it('starts clean on stored rubbish', async () => {
    await AsyncStorage.setItem(QUIZ_CACHE_KEY, '{"streak":-4,"stats":"none","category":9}');
    await useQuizStore.getState().hydrate();
    expect(useQuizStore.getState().streak).toBe(0);
    expect(useQuizStore.getState().stats).toEqual({});
    expect(useQuizStore.getState().category).toBe(FREE);
  });
});
