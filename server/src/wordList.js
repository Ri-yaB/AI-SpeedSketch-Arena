export const WORD_LIST = [
  // Animals
  'cat', 'dog', 'fish', 'bird', 'duck', 'frog', 'lion', 'pig', 'cow', 'horse',
  'rabbit', 'bear', 'elephant', 'shark', 'butterfly', 'turtle', 'snake', 'penguin',
  // Food
  'pizza', 'cake', 'apple', 'banana', 'donut', 'cookie', 'ice cream', 'egg',
  'hamburger', 'hotdog', 'sandwich', 'popcorn', 'cupcake', 'lemon', 'carrot', 'star',
  // Simple objects
  'ball', 'book', 'car', 'bus', 'boat', 'house', 'chair', 'table', 'door', 'key',
  'hat', 'shoe', 'bag', 'cup', 'spoon', 'fork', 'clock', 'bell', 'box', 'flag',
  // Nature
  'sun', 'moon', 'star', 'cloud', 'rain', 'tree', 'flower', 'leaf', 'mountain',
  'wave', 'rainbow', 'fire', 'snowman', 'cactus', 'mushroom',
  // Fun / easy shapes
  'heart', 'crown', 'ghost', 'alien', 'rocket', 'robot', 'dragon', 'castle',
  'umbrella', 'bicycle', 'airplane', 'guitar', 'trophy', 'diamond', 'anchor',
];

export function shuffleWords(words) {
  const arr = [...words];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}
