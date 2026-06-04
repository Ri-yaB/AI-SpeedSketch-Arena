// Each entry: [word, difficulty]  difficulty: 'easy' | 'medium' | 'hard'
export const WORD_LIST_WITH_DIFFICULTY = [
  // Easy — simple shapes, everyday objects anyone can sketch in seconds
  ['cat', 'easy'], ['dog', 'easy'], ['fish', 'easy'], ['bird', 'easy'],
  ['sun', 'easy'], ['moon', 'easy'], ['star', 'easy'], ['heart', 'easy'],
  ['house', 'easy'], ['tree', 'easy'], ['flower', 'easy'], ['apple', 'easy'],
  ['ball', 'easy'], ['car', 'easy'], ['boat', 'easy'], ['cloud', 'easy'],
  ['egg', 'easy'], ['hat', 'easy'], ['cup', 'easy'], ['book', 'easy'],
  ['eye', 'easy'], ['hand', 'easy'], ['door', 'easy'], ['flag', 'easy'],

  // Medium — recognizable but need a few more details
  ['elephant', 'medium'], ['penguin', 'medium'], ['frog', 'medium'], ['rabbit', 'medium'],
  ['pizza', 'medium'], ['cake', 'medium'], ['donut', 'medium'], ['hamburger', 'medium'],
  ['bicycle', 'medium'], ['airplane', 'medium'], ['guitar', 'medium'], ['umbrella', 'medium'],
  ['clock', 'medium'], ['key', 'medium'], ['crown', 'medium'], ['ghost', 'medium'],
  ['rocket', 'medium'], ['robot', 'medium'], ['rainbow', 'medium'], ['mountain', 'medium'],
  ['mushroom', 'medium'], ['cactus', 'medium'], ['diamond', 'medium'], ['trophy', 'medium'],

  // Hard — complex or abstract, requires good drawing skills
  ['octopus', 'hard'], ['butterfly', 'hard'], ['dragon', 'hard'], ['mermaid', 'hard'],
  ['astronaut', 'hard'], ['volcano', 'hard'], ['tornado', 'hard'], ['lighthouse', 'hard'],
  ['saxophone', 'hard'], ['microscope', 'hard'], ['telescope', 'hard'], ['submarine', 'hard'],
  ['castle', 'hard'], ['dinosaur', 'hard'], ['snowman', 'hard'], ['wizard', 'hard'],
];

// Flat word array for game logic
export const WORD_LIST = WORD_LIST_WITH_DIFFICULTY.map(([word]) => word);

// Map for quick difficulty lookup
export const WORD_DIFFICULTY = Object.fromEntries(WORD_LIST_WITH_DIFFICULTY);

export function shuffleWords(words) {
  const arr = [...words];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}
