import {
  CATEGORIES,
  FREE_CATEGORIES,
  QUESTIONS,
  canUseCategory,
  presentOptions,
  questionById,
  questionsIn,
} from '../questions';

describe('the question bank', () => {
  it('has questions in every listed category', () => {
    for (const category of CATEGORIES) {
      expect(questionsIn(category.id).length).toBeGreaterThan(0);
    }
  });

  it('gives every question a unique id', () => {
    expect(new Set(QUESTIONS.map((q) => q.id)).size).toBe(QUESTIONS.length);
  });

  it('gives every question exactly four distinct options', () => {
    // Three options is a different game, and a repeated option means two right answers.
    for (const question of QUESTIONS) {
      expect(question.options).toHaveLength(4);
      expect(new Set(question.options).size).toBe(4);
    }
  });

  it('gives every question a non-empty prompt and explanation', () => {
    // The explanation is a paid claim: "full answer explanations". A blank one is a lie.
    for (const question of QUESTIONS) {
      expect(question.prompt.trim().length).toBeGreaterThan(0);
      expect(question.explanation.trim().length).toBeGreaterThan(10);
    }
  });

  it('ends every prompt with a question mark', () => {
    for (const question of QUESTIONS) expect(question.prompt.trim().endsWith('?')).toBe(true);
  });

  it('only uses categories that exist', () => {
    const ids = new Set(CATEGORIES.map((c) => c.id));
    for (const question of QUESTIONS) expect(ids.has(question.category)).toBe(true);
  });

  it('finds a question by id and returns undefined for one that is not there', () => {
    expect(questionById(QUESTIONS[0]!.id)).toEqual(QUESTIONS[0]);
    expect(questionById('invented')).toBeUndefined();
  });
});

describe('canUseCategory', () => {
  it('gives a free player the three free categories', () => {
    for (const id of FREE_CATEGORIES) expect(canUseCategory(id, false)).toBe(true);
  });

  it('withholds the rest from a free player', () => {
    const locked = CATEGORIES.filter((c) => !FREE_CATEGORIES.includes(c.id));
    expect(locked.length).toBeGreaterThan(0);
    for (const category of locked) expect(canUseCategory(category.id, false)).toBe(false);
  });

  it('opens them all for a paying player', () => {
    for (const category of CATEGORIES) expect(canUseCategory(category.id, true)).toBe(true);
  });

  it('refuses a category that does not exist', () => {
    expect(canUseCategory('invented', true)).toBe(false);
  });
});

describe('presentOptions', () => {
  it('keeps all four options', () => {
    for (const question of QUESTIONS) {
      const shown = presentOptions(question);
      expect([...shown.options].sort()).toEqual([...question.options].sort());
    }
  });

  it('points at the right answer wherever it landed', () => {
    for (const question of QUESTIONS) {
      const shown = presentOptions(question);
      expect(shown.options[shown.correctIndex]).toBe(question.options[0]);
    }
  });

  it('is stable, so a repeated question is not a memory test for a position', () => {
    const question = QUESTIONS[0]!;
    expect(presentOptions(question)).toEqual(presentOptions(question));
  });

  it('does not leave the answer first every time', () => {
    // A bank where the answer is always option one is not a quiz.
    const firsts = QUESTIONS.filter((q) => presentOptions(q).correctIndex === 0);
    expect(firsts.length).toBeLessThan(QUESTIONS.length);
  });
});
