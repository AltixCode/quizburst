/**
 * The question bank.
 *
 * Bundled, not fetched. No backend, so the whole set ships in the binary and the app works
 * offline — and "every category unlocked" is something the purchase opens rather than content
 * promised for later.
 *
 * **On accuracy.** Every question here is deliberately restricted to long-settled,
 * uncontroversial material — geography, basic science, and works whose facts are not in
 * dispute. Nothing depends on a record that changes, a ranking, a population figure, or
 * anything else that would be true today and wrong next year. Each question carries an
 * explanation that is itself checkable, so a reader who doubts an answer can see the
 * reasoning rather than being asked to trust it. A wrong fact shipped as a fact is a defect
 * a player cannot detect, which is why the bank is narrow rather than large.
 *
 * The questions are English. The chrome is translated into fourteen locales and the app says
 * plainly that the questions are not, rather than implying otherwise.
 */

export interface Question {
  id: string;
  category: string;
  prompt: string;
  /** Four options. Index 0 is the correct one before shuffling. */
  options: string[];
  /** Why the answer is the answer. Shown after answering, free or paid. */
  explanation: string;
}

export interface Category {
  id: string;
  nameKey: string;
}

export const CATEGORIES: Category[] = [
  { id: "geography", nameKey: "catGeography" },
  { id: "science", nameKey: "catScience" },
  { id: "history", nameKey: "catHistory" },
  { id: "arts", nameKey: "catArts" },
  { id: "nature", nameKey: "catNature" },
];

/** The categories a free player gets. The purchase opens the rest. */
export const FREE_CATEGORIES = ["geography", "science", "history"];

const make = (
  category: string,
  rows: [string, string[], string][],
): Question[] =>
  rows.map(([prompt, options, explanation], i) => ({
    id: `${category}-${i}`,
    category,
    prompt,
    options,
    explanation,
  }));

export const QUESTIONS: Question[] = [
  ...make("geography", [
    [
      "Which ocean lies between Africa and Australia?",
      ["Indian", "Atlantic", "Pacific", "Arctic"],
      "The Indian Ocean is bounded by Africa to the west, Asia to the north and Australia to the east.",
    ],
    [
      "Which river flows through Cairo?",
      ["The Nile", "The Congo", "The Niger", "The Zambezi"],
      "Cairo sits on the Nile, close to where the river fans out into its delta before the Mediterranean.",
    ],
    [
      "Which country has the longest land border with the United States?",
      ["Canada", "Mexico", "Russia", "Cuba"],
      "The Canada–United States border is the longest land border between any two countries.",
    ],
    [
      "On which continent is the Atacama Desert?",
      ["South America", "Africa", "Asia", "Australia"],
      "The Atacama runs down the Pacific coast of South America, mostly in Chile.",
    ],
    [
      "Which sea is the saltiest of these?",
      ["The Dead Sea", "The Baltic Sea", "The North Sea", "The Black Sea"],
      "The Dead Sea is far saltier than ocean water, which is why swimmers float so easily in it.",
    ],
    [
      "Which strait separates Europe from Africa at its narrowest point?",
      ["Gibraltar", "Bosphorus", "Dover", "Hormuz"],
      "The Strait of Gibraltar is about 13 km across at its narrowest, between Spain and Morocco.",
    ],
    [
      "Lake Baikal, the deepest lake in the world, is in which country?",
      ["Russia", "Canada", "Mongolia", "Kazakhstan"],
      "Baikal lies in southern Siberia and holds a very large share of the world’s unfrozen fresh water.",
    ],
    [
      "Which of these cities lies furthest north?",
      ["Reykjavík", "Oslo", "Helsinki", "Stockholm"],
      "Reykjavík sits at roughly 64°N, north of all three of the Nordic capitals listed.",
    ],
  ]),
  ...make("science", [
    [
      "What is the chemical symbol for potassium?",
      ["K", "P", "Po", "Pt"],
      "K comes from kalium, the Latin name; P is phosphorus and Pt is platinum.",
    ],
    [
      "How many bones does an adult human skeleton normally have?",
      ["206", "186", "226", "246"],
      "A newborn has roughly 270; several fuse during growth, leaving about 206 in an adult.",
    ],
    [
      "Which gas makes up most of the air you are breathing?",
      ["Nitrogen", "Oxygen", "Carbon dioxide", "Argon"],
      "Dry air is about 78% nitrogen and about 21% oxygen.",
    ],
    [
      "What does DNA stand for?",
      [
        "Deoxyribonucleic acid",
        "Dinucleic acid",
        "Deoxyribose nucleotide",
        "Diribonucleic acid",
      ],
      "The name describes the molecule: a nucleic acid built on deoxyribose sugar.",
    ],
    [
      "Light travels fastest through which of these?",
      ["A vacuum", "Water", "Glass", "Air"],
      "Light is fastest in a vacuum; any medium slows it, which is what refraction measures.",
    ],
    [
      "Which planet is closest to the Sun?",
      ["Mercury", "Venus", "Mars", "Earth"],
      "Mercury orbits nearest the Sun; Venus is second and is the hotter of the two.",
    ],
    [
      "What is the powerhouse of the cell, in the usual phrase?",
      ["The mitochondrion", "The nucleus", "The ribosome", "The Golgi body"],
      "Mitochondria carry out respiration, releasing the energy a cell runs on.",
    ],
    [
      "Water freezes at 0°C. What is that in Fahrenheit?",
      ["32°F", "0°F", "100°F", "212°F"],
      "The Fahrenheit scale puts freezing at 32° and boiling at 212°, a hundred and eighty degrees apart.",
    ],
  ]),
  ...make("history", [
    [
      "The Rosetta Stone was key to reading which script?",
      ["Egyptian hieroglyphs", "Cuneiform", "Linear B", "Old Persian"],
      "It carries the same decree in Greek and in Egyptian, which gave scholars a way in to hieroglyphs.",
    ],
    [
      "Which empire built Machu Picchu?",
      ["The Inca", "The Maya", "The Aztec", "The Olmec"],
      "Machu Picchu is a fifteenth-century Inca site in the Peruvian Andes.",
    ],
    [
      "The Magna Carta was sealed in which country?",
      ["England", "France", "Scotland", "Ireland"],
      "It was sealed at Runnymede in 1215 by King John of England.",
    ],
    [
      "Who was the first person to walk on the Moon?",
      ["Neil Armstrong", "Buzz Aldrin", "Michael Collins", "Yuri Gagarin"],
      "Armstrong stepped out first on Apollo 11; Aldrin followed, and Collins stayed in orbit.",
    ],
    [
      "The Terracotta Army was built for a ruler of which country?",
      ["China", "Japan", "Korea", "Mongolia"],
      "It guards the tomb of Qin Shi Huang, the first emperor of a unified China.",
    ],
    [
      "Which ancient city was destroyed by the eruption of Vesuvius in AD 79?",
      ["Pompeii", "Carthage", "Troy", "Ephesus"],
      "Pompeii and nearby Herculaneum were buried, which is why so much of both survives.",
    ],
    [
      "The Berlin Wall came down in which decade?",
      ["The 1980s", "The 1960s", "The 1970s", "The 1990s"],
      "The border was opened in November 1989, near the end of the decade.",
    ],
  ]),
  ...make("arts", [
    [
      "Who painted the ceiling of the Sistine Chapel?",
      ["Michelangelo", "Leonardo da Vinci", "Raphael", "Titian"],
      "Michelangelo painted it between 1508 and 1512, at the commission of Pope Julius II.",
    ],
    [
      "How many strings does a standard violin have?",
      ["Four", "Five", "Six", "Three"],
      "A violin is strung G, D, A and E, from lowest to highest.",
    ],
    [
      'Which playwright wrote "Hamlet"?',
      [
        "William Shakespeare",
        "Christopher Marlowe",
        "Ben Jonson",
        "John Webster",
      ],
      "Hamlet is Shakespeare’s, written around the turn of the seventeenth century.",
    ],
    [
      'In music, what does "forte" instruct a player to do?',
      ["Play loudly", "Play quietly", "Play faster", "Play slower"],
      "Forte is Italian for strong; piano is its opposite, and a pianoforte can do both.",
    ],
    [
      'Which novel opens "Call me Ishmael"?',
      [
        "Moby-Dick",
        "Great Expectations",
        "The Old Man and the Sea",
        "Treasure Island",
      ],
      "It is the first line of Herman Melville’s Moby-Dick.",
    ],
    [
      "The Mona Lisa hangs in which museum?",
      ["The Louvre", "The Uffizi", "The Prado", "The Rijksmuseum"],
      "It has been in the Louvre in Paris for centuries, apart from a famous theft in 1911.",
    ],
  ]),
  ...make("nature", [
    [
      "What is the largest animal alive today?",
      [
        "The blue whale",
        "The African elephant",
        "The giraffe",
        "The whale shark",
      ],
      "The blue whale is the largest animal known to have lived, larger than any dinosaur yet found.",
    ],
    [
      "How many legs does a spider have?",
      ["Eight", "Six", "Ten", "Twelve"],
      "Spiders are arachnids, with eight legs; insects have six.",
    ],
    [
      "Which bird is famously unable to fly and native to New Zealand?",
      ["The kiwi", "The puffin", "The albatross", "The heron"],
      "Kiwis are flightless, nocturnal, and found only in New Zealand.",
    ],
    [
      "What do you call a group of crows?",
      ["A murder", "A pod", "A pride", "A school"],
      "A murder of crows is the traditional collective noun; a pride is lions and a pod is whales.",
    ],
    [
      "Which of these is a mammal?",
      ["The dolphin", "The shark", "The tuna", "The octopus"],
      "Dolphins breathe air, are warm-blooded and nurse their young — all mammal traits.",
    ],
    [
      "Trees take in which gas to make their food?",
      ["Carbon dioxide", "Oxygen", "Nitrogen", "Hydrogen"],
      "Photosynthesis takes in carbon dioxide and water and gives out oxygen.",
    ],
  ]),
];

/**
 * The pool `questionsIn`/`questionById` actually read from. Defaults to the
 * bundled `QUESTIONS`; `setActivePool` (called from `src/content`, never
 * from here) swaps in the content-drip service's synced set. Kept as a
 * plain module-level variable rather than a parameter so every existing
 * call site keeps working unchanged — this file still imports nothing from
 * react, react-native or expo-*.
 */
let activePool: Question[] = QUESTIONS;

export function setActivePool(pool: Question[]): void {
  activePool = pool;
}

/** Test-only: restores the bundled bank as the active pool. */
export function resetActivePool(): void {
  activePool = QUESTIONS;
}

export const questionsIn = (category: string): Question[] =>
  activePool.filter((q) => q.category === category);

export const questionById = (id: string): Question | undefined =>
  activePool.find((q) => q.id === id);

/** Whether a player may open a category. */
export function canUseCategory(category: string, isPremium: boolean): boolean {
  if (!CATEGORIES.some((c) => c.id === category)) return false;
  return isPremium || FREE_CATEGORIES.includes(category);
}

/**
 * The options in a stable but non-obvious order, with the index of the correct one.
 *
 * Shuffled by a seed derived from the question id, so the right answer is not always first —
 * but it is in the *same* place every time that question appears, so a player who sees it
 * twice is not being tested on whether they remember a position.
 */
export function presentOptions(question: Question): {
  options: string[];
  correctIndex: number;
} {
  let seed = 2166136261;
  for (let i = 0; i < question.id.length; i += 1) {
    seed ^= question.id.charCodeAt(i);
    seed = Math.imul(seed, 16777619);
  }
  const order = question.options.map((_, i) => i);
  for (let i = order.length - 1; i > 0; i -= 1) {
    seed = (Math.imul(seed, 1103515245) + 12345) >>> 0;
    const j = seed % (i + 1);
    const a = order[i]!;
    order[i] = order[j]!;
    order[j] = a;
  }
  return {
    options: order.map((i) => question.options[i]!),
    correctIndex: order.indexOf(0),
  };
}
