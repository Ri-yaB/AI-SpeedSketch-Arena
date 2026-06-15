import { analyzeDrawing } from './aiJudge.js';
import { WORD_LIST_WITH_DIFFICULTY } from './wordList.js';

// roomCode → room object
const rooms = new Map();

// roomCode → finished battle result (persists after room cleanup, max 100 entries)
const battleHistory = new Map();

const EASY_SECONDS           = 10;
const MED_HARD_SECONDS       = 15;
const TOTAL_WORDS            = 12;   // 4E + 4M + 4H
const ROUND_PAUSE_MS         = 4000; // pause between rounds — gives AI result time to arrive
const BATTLE_WIN_THRESHOLD   = 0.75; // minimum confidence to be eligible to win a round

function getRoundSeconds(difficulty) {
  return difficulty === 'easy' ? EASY_SECONDS : MED_HARD_SECONDS;
}

function generateCode() {
  let code;
  do { code = String(Math.floor(10 + Math.random() * 90)); }
  while (rooms.has(code));
  return code;
}

function pickBattleWords() {
  const shuffle = arr => [...arr].sort(() => Math.random() - 0.5);
  const easy   = shuffle(WORD_LIST_WITH_DIFFICULTY.filter(([, d]) => d === 'easy')).slice(0, 6);
  const medium = shuffle(WORD_LIST_WITH_DIFFICULTY.filter(([, d]) => d === 'medium')).slice(0, 4);
  const hard   = shuffle(WORD_LIST_WITH_DIFFICULTY.filter(([, d]) => d === 'hard')).slice(0, 2);
  return [...easy, ...medium, ...hard]; // 12 [word, difficulty] pairs: 6E + 4M + 2H
}

// ── Helpers ────────────────────────────────────────────────────────────────

function buildPlayerSnapshot(room) {
  return Array.from(room.players.values()).map(p => ({
    id: p.id, name: p.name, score: p.score,
    submittedWords: [...p.submittedWords],
  }));
}

function buildSubmissionsSnapshot(room) {
  const out = {};
  for (const [word, subs] of Object.entries(room.submissions)) {
    out[word] = {};
    for (const [pid, s] of Object.entries(subs)) {
      out[word][pid] = room.status === 'finished'
        ? { confidence: s.confidence, correct: s.correct }
        : { submitted: true };
    }
  }
  return out;
}

export function getRoomSnapshot(code) {
  const room = rooms.get(code);
  if (!room) return null;
  const currentWord = room.wordPairs[room.currentRound]?.word || null;
  const currentDiff = room.wordPairs[room.currentRound]?.difficulty || null;
  return {
    code: room.code,
    hostId: room.hostId,
    status: room.status,
    players: buildPlayerSnapshot(room),
    wordPool: room.wordPool,
    wordDifficulty: room.wordDifficulty,
    currentRound: room.currentRound,
    totalRounds: room.wordPairs.length,
    currentWord,
    currentDiff,
    roundTimeRemaining: room.roundTimeRemaining,
    submissions: buildSubmissionsSnapshot(room),
    wordWinners: { ...room.wordWinners },
  };
}

// ── Public API ─────────────────────────────────────────────────────────────

export function createRoom(socketId, name, email, isAdminHost = false) {
  const code = generateCode();
  const room = {
    code, hostId: socketId,
    isAdminHost,
    status: 'waiting',
    players: new Map(),
    wordPool: [], wordDifficulty: {},
    wordPairs: [],
    currentRound: -1,
    roundTimeRemaining: EASY_SECONDS,
    roundTimer: null,
    submissions: {},
    wordWinners: {},
  };
  // Admin host is not a player — only real participants join as players
  if (!isAdminHost) {
    room.players.set(socketId, { id: socketId, name, email, score: 0, submittedWords: [] });
  }
  rooms.set(code, room);
  return code;
}

export function joinRoom(code, socketId, name, email) {
  const room = rooms.get(code.trim());
  if (!room)                     return { error: 'Room not found. Check the code and try again.' };
  if (room.status !== 'waiting') return { error: 'This game has already started.' };
  if (room.players.size >= 8)    return { error: 'Room is full (max 8 players).' };
  room.players.set(socketId, { id: socketId, name, email, score: 0, submittedWords: [] });
  return { code: room.code, snapshot: getRoomSnapshot(room.code) };
}

export function startBattleGame(code, hostSocketId, io) {
  const room = rooms.get(code);
  if (!room)                          return { error: 'Room not found.' };
  if (room.hostId !== hostSocketId)   return { error: 'Only the host can start.' };
  if (room.status !== 'waiting')      return { error: 'Game already started.' };
  if (room.players.size < 2)          return { error: 'Need at least 2 players to start.' };

  const pairs = pickBattleWords();
  room.wordPairs      = pairs.map(([w, d]) => ({ word: w, difficulty: d }));
  room.wordPool       = pairs.map(([w]) => w);
  room.wordDifficulty = Object.fromEntries(pairs);
  room.submissions    = Object.fromEntries(pairs.map(([w]) => [w, {}]));
  room.wordWinners    = {};
  room.status         = 'playing';
  room.currentRound   = -1;

  io.to(code).emit('battle-game-started', {
    wordPool: room.wordPool,
    wordDifficulty: room.wordDifficulty,
    players: buildPlayerSnapshot(room),
  });

  // First round starts after client orb animation finishes (~3s)
  setTimeout(() => startRound(code, 0, io), 3000);

  return { ok: true };
}

function startRound(code, roundIdx, io) {
  const room = rooms.get(code);
  if (!room || room.status !== 'playing') return;
  if (roundIdx >= room.wordPairs.length) {
    endBattleGame(code, io);
    return;
  }

  const { word, difficulty } = room.wordPairs[roundIdx];
  const roundSeconds = getRoundSeconds(difficulty);
  room.currentRound       = roundIdx;
  room.roundTimeRemaining = roundSeconds;

  io.to(code).emit('battle-round-start', {
    round: roundIdx + 1,
    totalRounds: room.wordPairs.length,
    word,
    difficulty,
    timeRemaining: roundSeconds,
    timeTotal: roundSeconds,
    players: buildPlayerSnapshot(room),
  });

  room.roundTimer = setInterval(() => {
    room.roundTimeRemaining--;
    io.to(code).emit('battle-round-tick', {
      round: roundIdx + 1,
      timeRemaining: room.roundTimeRemaining,
    });
    if (room.roundTimeRemaining <= 0) {
      clearInterval(room.roundTimer);
      room.roundTimer = null;
      resolveAndAdvance(code, roundIdx, io);
    }
  }, 1000);
}

function resolveAndAdvance(code, roundIdx, io) {
  const room = rooms.get(code);
  if (!room || room.status !== 'playing') return;

  const word = room.wordPairs[roundIdx]?.word;
  if (!word) return;

  // Guard: if this round was already resolved (race between timer + early-submit), bail out
  if (room.wordWinners[word] !== undefined) return;

  // Clear any lingering timer just in case
  if (room.roundTimer) { clearInterval(room.roundTimer); room.roundTimer = null; }

  resolveWord(code, word, io);

  setTimeout(() => {
    const next = roundIdx + 1;
    if (next >= room.wordPairs.length) {
      endBattleGame(code, io);
    } else {
      startRound(code, next, io);
    }
  }, ROUND_PAUSE_MS);
}

export async function submitBattleDrawing(code, socketId, word, imageData, textPenalty, io) {
  const room = rooms.get(code);
  if (!room || room.status !== 'playing') return;

  const player = room.players.get(socketId);
  if (!player) return;

  // Only accept submission for the current round's word
  const currentWord = room.wordPairs[room.currentRound]?.word;
  if (word !== currentWord) return;

  // Prevent duplicate submission
  if (room.submissions[word]?.[socketId]) return;

  const socket = io.sockets.sockets.get(socketId);
  socket?.emit('battle-drawing-ack', { word });

  if (textPenalty) {
    player.score = Math.max(0, player.score - 1);
    socket?.emit('battle-drawing-result', {
      word, confidence: 0, correct: false, penalty: true,
      funnyMessage: 'No cheating! -1 pt',
    });
    return;
  }

  try {
    const result = await analyzeDrawing(imageData, word);
    const difficulty = room.wordDifficulty[word] || 'easy';
    const pts = difficulty === 'hard' ? 4 : difficulty === 'medium' ? 3 : 2;

    if (!room.submissions[word]) room.submissions[word] = {};
    room.submissions[word][socketId] = {
      confidence: result.confidence,
      correct: result.correct,
      points: pts,
    };
    player.submittedWords.push(word);

    socket?.emit('battle-drawing-result', {
      word,
      confidence: result.confidence,
      correct: result.correct,
      aiGuess: result.aiGuess,
      description: result.description,
      funnyMessage: result.funnyMessage,
    });

    io.to(code).emit('battle-submissions-update', {
      word,
      submittedCount: Object.keys(room.submissions[word]).length,
      totalPlayers: room.players.size,
    });

    // All players submitted → end round early
    if (Object.keys(room.submissions[word]).length >= room.players.size) {
      resolveAndAdvance(code, room.currentRound, io);
    }
  } catch (err) {
    console.error('[Battle] Drawing analysis error:', err);
  }
}

function resolveWord(code, word, io) {
  const room = rooms.get(code);
  if (!room || room.wordWinners[word] !== undefined) return;

  const subs = room.submissions[word];
  if (!subs || Object.keys(subs).length === 0) {
    room.wordWinners[word] = null;
    io.to(code).emit('battle-word-winner', {
      word,
      winnerId: null,
      winnerName: null,
      isTie: false,
      topConfidence: 0,
      players: buildPlayerSnapshot(room),
    });
    return;
  }

  // Only consider submissions that meet the minimum confidence threshold
  const eligibleSubs = Object.entries(subs).filter(([, s]) => s.confidence >= BATTLE_WIN_THRESHOLD);

  if (eligibleSubs.length === 0) {
    room.wordWinners[word] = null;
    io.to(code).emit('battle-word-winner', {
      word,
      winnerId: null,
      winnerName: null,
      isTie: false,
      topConfidence: 0,
      players: buildPlayerSnapshot(room),
    });
    return;
  }

  let topConfidence = -1;
  let winner = null;
  let tie = false;

  for (const [pid, s] of eligibleSubs) {
    if (s.confidence > topConfidence) {
      topConfidence = s.confidence;
      winner = pid;
      tie = false;
    } else if (s.confidence === topConfidence) {
      tie = true;
    }
  }

  const difficulty = room.wordDifficulty[word] || 'easy';
  const pts = difficulty === 'hard' ? 4 : 2;

  if (tie) {
    room.wordWinners[word] = 'tie';
    for (const [pid, s] of Object.entries(subs)) {
      if (s.confidence === topConfidence) {
        const p = room.players.get(pid);
        if (p) p.score += pts;
      }
    }
  } else if (winner) {
    room.wordWinners[word] = winner;
    const p = room.players.get(winner);
    if (p) p.score += pts;
  } else {
    room.wordWinners[word] = null;
  }

  io.to(code).emit('battle-word-winner', {
    word,
    winnerId: room.wordWinners[word],
    winnerName: winner && !tie ? room.players.get(winner)?.name : null,
    isTie: tie,
    topConfidence: Math.round(topConfidence * 100),
    players: buildPlayerSnapshot(room),
  });
}

export function endBattleGame(code, io) {
  const room = rooms.get(code);
  if (!room || room.status === 'finished') return;

  room.status = 'finished';
  if (room.roundTimer) { clearInterval(room.roundTimer); room.roundTimer = null; }

  for (const word of room.wordPool) {
    if (room.wordWinners[word] === undefined) {
      if (Object.keys(room.submissions[word] || {}).length > 0) {
        resolveWord(code, word, io);
      } else {
        room.wordWinners[word] = null;
      }
    }
  }

  const finalPlayers = Array.from(room.players.values())
    .sort((a, b) => b.score - a.score)
    .map((p, i) => ({ id: p.id, name: p.name, score: p.score, rank: i + 1 }));

  const gameOverPayload = {
    players: finalPlayers,
    wordWinners: room.wordWinners,
    wordPool: room.wordPool,
    wordDifficulty: room.wordDifficulty,
    submissions: buildSubmissionsSnapshot({ ...room, status: 'finished' }),
  };

  io.to(code).emit('battle-game-over', gameOverPayload);

  battleHistory.set(code, { code, endedAt: Date.now(), ...gameOverPayload });
  if (battleHistory.size > 100) {
    battleHistory.delete(battleHistory.keys().next().value);
  }

  setTimeout(() => rooms.delete(code), 5 * 60 * 1000);
}

export function removePlayerFromRoom(socketId, io) {
  for (const [code, room] of rooms.entries()) {
    // Admin host disconnect — clean up room if still waiting
    if (room.isAdminHost && room.hostId === socketId && !room.players.has(socketId)) {
      if (room.roundTimer) clearInterval(room.roundTimer);
      if (room.status === 'waiting') rooms.delete(code);
      return;
    }
    if (!room.players.has(socketId)) continue;
    room.players.delete(socketId);

    if (room.players.size === 0) {
      if (room.roundTimer) clearInterval(room.roundTimer);
      rooms.delete(code);
      return;
    }

    if (room.hostId === socketId) {
      room.hostId = room.players.keys().next().value;
    }

    if (room.status === 'playing') {
      if (room.players.size < 2) {
        if (room.roundTimer) { clearInterval(room.roundTimer); room.roundTimer = null; }
        endBattleGame(code, io);
      } else {
        io.to(code).emit('battle-room-update', getRoomSnapshot(code));
      }
    } else {
      io.to(code).emit('battle-room-update', getRoomSnapshot(code));
    }
    return;
  }
}

export function getPlayerRoom(socketId) {
  for (const [code, room] of rooms.entries()) {
    if (room.players.has(socketId)) return code;
  }
  return null;
}

export function getBattleResult(code) {
  return battleHistory.get((code || '').trim()) || null;
}

export function getAllBattleResults() {
  return Array.from(battleHistory.values()).sort((a, b) => b.endedAt - a.endedAt);
}
