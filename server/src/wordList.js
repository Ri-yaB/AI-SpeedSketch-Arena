// Each entry: [word, difficulty]
export const WORD_LIST_WITH_DIFFICULTY = [
  // ── EASY (40 words) ──────────────────────────────────────────────
  ['cat', 'easy'], ['dog', 'easy'], ['fish', 'easy'], ['bird', 'easy'],
  ['pig', 'easy'], ['cow', 'easy'], ['frog', 'easy'], ['duck', 'easy'],
  ['sun', 'easy'], ['moon', 'easy'], ['star', 'easy'], ['cloud', 'easy'],
  ['rain', 'easy'], ['tree', 'easy'], ['flower', 'easy'], ['leaf', 'easy'],
  ['house', 'easy'], ['door', 'easy'], ['window', 'easy'], ['chair', 'easy'],
  ['table', 'easy'], ['cup', 'easy'], ['book', 'easy'], ['bag', 'easy'],
  ['hat', 'easy'], ['shoe', 'easy'], ['ball', 'easy'], ['car', 'easy'],
  ['bus', 'easy'], ['boat', 'easy'], ['apple', 'easy'], ['banana', 'easy'],
  ['egg', 'easy'], ['eye', 'easy'], ['hand', 'easy'], ['heart', 'easy'],
  ['flag', 'easy'], ['bell', 'easy'], ['key', 'easy'], ['box', 'easy'],

  // ── MEDIUM (35 words) ────────────────────────────────────────────
  ['elephant', 'medium'], ['penguin', 'medium'], ['rabbit', 'medium'], ['lion', 'medium'],
  ['bear', 'medium'], ['horse', 'medium'], ['turtle', 'medium'], ['snake', 'medium'],
  ['pizza', 'medium'], ['cake', 'medium'], ['donut', 'medium'], ['hamburger', 'medium'],
  ['ice cream', 'medium'], ['cookie', 'medium'], ['sandwich', 'medium'], ['popcorn', 'medium'],
  ['bicycle', 'medium'], ['airplane', 'medium'], ['rocket', 'medium'], ['umbrella', 'medium'],
  ['guitar', 'medium'], ['clock', 'medium'], ['crown', 'medium'], ['ghost', 'medium'],
  ['robot', 'medium'], ['rainbow', 'medium'], ['mountain', 'medium'], ['mushroom', 'medium'],
  ['cactus', 'medium'], ['diamond', 'medium'], ['trophy', 'medium'], ['castle', 'medium'],
  ['anchor', 'medium'], ['camera', 'medium'], ['ladder', 'medium'],

  // ── HARD (25 words) ──────────────────────────────────────────────
  ['octopus', 'hard'], ['butterfly', 'hard'], ['giraffe', 'hard'], ['crocodile', 'hard'],
  ['scorpion', 'hard'], ['peacock', 'hard'], ['dragon', 'hard'], ['mermaid', 'hard'],
  ['astronaut', 'hard'], ['volcano', 'hard'], ['tornado', 'hard'], ['lighthouse', 'hard'],
  ['submarine', 'hard'], ['dinosaur', 'hard'], ['wizard', 'hard'], ['snowman', 'hard'],
  ['saxophone', 'hard'], ['telescope', 'hard'], ['microscope', 'hard'], ['parachute', 'hard'],
  ['caterpillar', 'hard'], ['windmill', 'hard'], ['fountain', 'hard'], ['spaceship', 'hard'],
  ['pirate ship', 'hard'],
];

// Sorted: easy first, then medium, then hard
const DIFFICULTY_ORDER = { easy: 0, medium: 1, hard: 2 };
const SORTED = [...WORD_LIST_WITH_DIFFICULTY].sort(
  (a, b) => DIFFICULTY_ORDER[a[1]] - DIFFICULTY_ORDER[b[1]]
);

export const WORD_LIST = SORTED.map(([word]) => word);
export const WORD_DIFFICULTY = Object.fromEntries(SORTED);

export function shuffleWords(words) {
  // Shuffle within each difficulty group, preserving easy → medium → hard order
  const groups = { easy: [], medium: [], hard: [] };
  for (const word of words) {
    const diff = WORD_DIFFICULTY[word] || 'medium';
    groups[diff].push(word);
  }
  for (const g of Object.values(groups)) {
    for (let i = g.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [g[i], g[j]] = [g[j], g[i]];
    }
  }
  return [...groups.easy, ...groups.medium, ...groups.hard];
}
