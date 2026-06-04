import { WORD_LIST, shuffleWords } from './wordList.js';
import { analyzeDrawing } from './aiJudge.js';

const GAME_DURATION_SECONDS = 90;
const MAX_PLAYERS = 100;
export const GLOBAL_ROOM = 'GLOBAL';

const AUTO_START_DELAY_MS = 3000;  // wait 3s after first player before starting
const AUTO_RESET_DELAY_MS = 8000;  // show results for 8s then auto-restart

function createPlayer(id, name, email) {
  return {
    id,
    name,
    email: email || '',
    score: 0,
    currentWord: null,
    completedWords: [],
    wordsAttempted: 0,
    joinedAt: Date.now(),
  };
}

// Persistent all-time leaderboard — keyed by email (falls back to name)
// Survives disconnects and game resets for the lifetime of the server process
const allTimeLeaderboard = new Map();

function getAllTimeKey(name, email) {
  return (email && email.trim()) ? email.trim().toLowerCase() : name.trim().toLowerCase();
}

// liveUpdate=true: called per-word during a game (only refreshes current score, no game count bump)
// liveUpdate=false: called at game end (bumps gamesPlayed and totalScore)
function updateAllTimeLeaderboard(players, liveUpdate = true) {
  for (const p of players) {
    if (p.score <= 0) continue;
    const key = getAllTimeKey(p.name, p.email);
    const existing = allTimeLeaderboard.get(key);
    if (!existing) {
      allTimeLeaderboard.set(key, {
        name: p.name,
        email: p.email,
        bestScore: p.score,
        totalScore: liveUpdate ? 0 : p.score, // totalScore committed at game end
        gamesPlayed: liveUpdate ? 0 : 1,
        completedWords: p.completedWords?.length || 0,
        lastPlayed: Date.now(),
      });
    } else {
      existing.bestScore = Math.max(existing.bestScore, p.score);
      existing.completedWords = p.completedWords?.length || 0;
      existing.lastPlayed = Date.now();
      existing.name = p.name;
      if (p.email) existing.email = p.email;
      if (!liveUpdate) {
        existing.totalScore += p.score;
        existing.gamesPlayed += 1;
      }
    }
  }
}

export function getAllTimeLeaderboardArray() {
  return Array.from(allTimeLeaderboard.values())
    .sort((a, b) => b.bestScore - a.bestScore);
}

// Single centralized game — no rooms, no host concept
const game = {
  players: new Map(),
  gameState: 'waiting',
  timer: null,
  autoStartTimer: null,
  autoResetTimer: null,
  timeRemaining: GAME_DURATION_SECONDS,
  wordPool: [],
  io: null,
};

export function joinGame(playerId, playerName, playerEmail, io) {
  if (game.players.size >= MAX_PLAYERS) {
    return { success: false, error: 'Server is full (max 100 players).' };
  }

  if (!game.players.has(playerId)) {
    game.players.set(playerId, createPlayer(playerId, playerName, playerEmail));
  }

  game.io = io;

  // Auto-start if this is the first player and game is still waiting
  if (game.gameState === 'waiting' && game.players.size === 1 && !game.autoStartTimer) {
    game.autoStartTimer = setTimeout(() => {
      game.autoStartTimer = null;
      if (game.gameState === 'waiting' && game.players.size >= 1) {
        startGame(io);
      }
    }, AUTO_START_DELAY_MS);
  }

  return { success: true, snapshot: getSnapshot() };
}

export function leaveGame(playerId) {
  game.players.delete(playerId);
  if (game.players.size === 0 && game.autoStartTimer) {
    clearTimeout(game.autoStartTimer);
    game.autoStartTimer = null;
  }
}

export function startGame(io) {
  if (game.gameState !== 'waiting') return { success: false, error: 'Game already started.' };
  if (game.players.size === 0) return { success: false, error: 'No players.' };

  // Defensive: clear any stale timer before starting a new one
  if (game.timer) { clearInterval(game.timer); game.timer = null; }

  game.gameState = 'playing';
  game.timeRemaining = GAME_DURATION_SECONDS;
  game.wordPool = shuffleWords(WORD_LIST);
  game.io = io;

  for (const player of game.players.values()) {
    player.score = 0;
    player.currentWord = null;
    player.completedWords = [];
    player.wordsAttempted = 0;
  }

  io.to(GLOBAL_ROOM).emit('game-started', {
    wordPool: game.wordPool,
    timeRemaining: game.timeRemaining,
    players: getPlayersArray(),
  });

  game.timer = setInterval(() => {
    game.timeRemaining -= 1;
    io.to(GLOBAL_ROOM).emit('game-tick', {
      timeRemaining: game.timeRemaining,
      leaderboard: getLeaderboard(),
    });
    if (game.timeRemaining <= 0) {
      endGame(io);
    }
  }, 1000);

  return { success: true };
}

export async function submitDrawing(playerId, wordGuessed, imageData, textPenalty = false) {
  if (game.gameState !== 'playing') return { success: false, error: 'Game is not in progress.' };

  const player = game.players.get(playerId);
  if (!player) return { success: false, error: 'Player not found.' };

  if (player.completedWords.includes(wordGuessed)) {
    return { success: false, error: 'You already completed this word!' };
  }

  player.wordsAttempted += 1;

  if (textPenalty) {
    player.score -= 1;
    const result = {
      playerId,
      playerName: player.name,
      wordGuessed,
      correct: false,
      textPenalty: true,
      confidence: 0,
      aiGuess: wordGuessed,
      funnyMessage: 'Nice try — writing the word costs you 1 point! 🚫',
      score: player.score,
      timestamp: Date.now(),
    };
    if (game.io) {
      game.io.to(GLOBAL_ROOM).emit('leaderboard-update', { leaderboard: getLeaderboard() });
    }
    return { success: true, result };
  }

  const judgment = await analyzeDrawing(imageData, wordGuessed);

  if (judgment.correct) {
    player.score += 2;
    player.completedWords.push(wordGuessed);
    player.currentWord = null;
    // Update persistent leaderboard immediately on each correct word
    updateAllTimeLeaderboard([player]);
  }

  const result = {
    playerId,
    playerName: player.name,
    wordGuessed,
    ...judgment,
    score: player.score,
    timestamp: Date.now(),
  };

  if (game.io) {
    game.io.to(GLOBAL_ROOM).emit('leaderboard-update', { leaderboard: getLeaderboard() });
    if (judgment.correct) {
      game.io.to(GLOBAL_ROOM).emit('alltime-leaderboard', { leaderboard: getAllTimeLeaderboardArray() });
    }
  }

  return { success: true, result };
}

export function selectWord(playerId, word) {
  const player = game.players.get(playerId);
  if (player) player.currentWord = word;
}

export function getLeaderboard() {
  return getPlayersArray().sort((a, b) => b.score - a.score);
}

export function getSnapshot() {
  return {
    gameState: game.gameState,
    timeRemaining: game.timeRemaining,
    wordPool: game.wordPool,
    players: getPlayersArray(),
  };
}

// ---- Internal ----

function getPlayersArray() {
  return Array.from(game.players.values()).map(p => ({
    id: p.id,
    name: p.name,
    email: p.email,
    score: p.score,
    currentWord: p.currentWord,
    completedWords: p.completedWords,
    wordsAttempted: p.wordsAttempted,
  }));
}

function endGame(io) {
  if (game.timer) {
    clearInterval(game.timer);
    game.timer = null;
  }
  game.gameState = 'finished';
  game.timeRemaining = 0;

  // Persist final scores to all-time leaderboard
  updateAllTimeLeaderboard(getPlayersArray(), false);

  const allTime = getAllTimeLeaderboardArray();
  io.to(GLOBAL_ROOM).emit('game-over', {
    leaderboard: getLeaderboard(),
    players: getPlayersArray(),
    allTimeLeaderboard: allTime,
  });
  // Broadcast updated all-time leaderboard so the leaderboard tab refreshes
  io.to(GLOBAL_ROOM).emit('alltime-leaderboard', { leaderboard: allTime });

  // Auto-restart after delay so results are visible
  game.autoResetTimer = setTimeout(() => {
    game.autoResetTimer = null;
    resetGame(io);
  }, AUTO_RESET_DELAY_MS);
}

export function resetGame(io) {
  if (game.timer) { clearInterval(game.timer); game.timer = null; }
  if (game.autoResetTimer) { clearTimeout(game.autoResetTimer); game.autoResetTimer = null; }
  if (game.autoStartTimer) { clearTimeout(game.autoStartTimer); game.autoStartTimer = null; }

  game.gameState = 'waiting';
  game.timeRemaining = GAME_DURATION_SECONDS;
  game.wordPool = [];
  game.players.clear(); // Everyone returns to lobby — must re-join to play again

  io.to(GLOBAL_ROOM).emit('return-to-lobby');
}
