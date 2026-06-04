/**
 * Maps every word in the pool to an emoji used as the hint reference image.
 */
export const WORD_EMOJIS = {
  // Animals
  cat: '🐱', dog: '🐶', elephant: '🐘', penguin: '🐧', giraffe: '🦒',
  octopus: '🐙', shark: '🦈', butterfly: '🦋', lion: '🦁', duck: '🦆',
  frog: '🐸', turtle: '🐢', horse: '🐴', whale: '🐋', crab: '🦀', spider: '🕷️',
  // Food
  pizza: '🍕', sushi: '🍣', taco: '🌮', 'ice cream': '🍦', hamburger: '🍔',
  donut: '🍩', cake: '🎂', banana: '🍌', apple: '🍎', popcorn: '🍿',
  cookie: '🍪', sandwich: '🥪', hotdog: '🌭', cupcake: '🧁', watermelon: '🍉', grape: '🍇',
  // Objects
  guitar: '🎸', bicycle: '🚲', airplane: '✈️', rocket: '🚀', robot: '🤖',
  camera: '📷', umbrella: '☂️', lighthouse: '🗼', telephone: '📞', television: '📺',
  clock: '⏰', key: '🔑', hammer: '🔨', scissors: '✂️', backpack: '🎒', book: '📚',
  // Nature
  volcano: '🌋', rainbow: '🌈', snowflake: '❄️', cactus: '🌵', mushroom: '🍄',
  tornado: '🌪️', wave: '🌊', mountain: '⛰️', tree: '🌳', sun: '☀️',
  moon: '🌙', cloud: '☁️', flower: '🌸', leaf: '🍃', river: '🏞️', island: '🏝️',
  // Fun / Misc
  crown: '👑', diamond: '💎', compass: '🧭', hourglass: '⏳', lantern: '🏮',
  anchor: '⚓', trophy: '🏆', skull: '💀', boot: '👢', castle: '🏰',
  dragon: '🐉', wizard: '🧙', pirate: '🏴‍☠️', alien: '👽', ninja: '🥷',
  astronaut: '👨‍🚀', ghost: '👻', vampire: '🧛', mermaid: '🧜', unicorn: '🦄',
  // AI / Tech
  circuit: '⚡', drone: '🚁', microchip: '💾', satellite: '🛸', binary: '🔢',
  cursor: '🖱️', wifi: '📶', battery: '🔋', antenna: '📡', fingerprint: '🔏',
  chatbot: '🤖', 'neural net': '🧠', brain: '🧠', eye: '👁️', keyboard: '⌨️',
  server: '🖥️', data: '📊', bug: '🐛', code: '💻', pixel: '🎨',
  monitor: '🖥️', headset: '🎧', joystick: '🕹️',
};

export function getWordEmoji(word) {
  return WORD_EMOJIS[word?.toLowerCase()] ?? '🖼️';
}
