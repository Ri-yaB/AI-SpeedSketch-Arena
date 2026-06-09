import { analyzeDrawing } from './aiJudge.js';
import { WORD_LIST_WITH_DIFFICULTY } from './wordList.js';

// roomCode → room object
const rooms = new Map();

// roomCode → finished battle result (persists after room cleanup, max 100 entries)
const battleHistory = new Map();

function generateCode() {
  let code;
  do { code = String(Math.floor(10 + Math.random() * 90)); } // 2-digit number: 10–99
  while (rooms.has(code));
  return code;
}

function pickBattleWords() {
  const shuffle = arr => [...arr].sort(() => Math.random() - 0.5);
  const easy   = shuffle(WORD_LIST_WITH_DIFFICULTY.filter(([, d]) => d === 'easy')).slice(0, 4);
  const medium = shuffle(WORD_LIST_WITH_DIFFICULTY.filter(([, d]) => d === 'medium')).slice(0, 4);
  const hard   = shuffle(WORD_LIST_WITH_DIFFICULTY.filter(([, d]) => d === 'hard')).slice(0, 2);
  return [...easy, ...medium, ...hard]; // array of [word, difficulty]
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
  return {
    code: room.code,
    hostId: room.hostId,
    status: room.status,
    players: buildPlayerSnapshot(room),
    wordPool: room.wordPool,
    wordDifficulty: room.wordDifficulty,
    timeRemaining: room.timeRemaining,
    submissions: buildSubmissionsSnapshot(room),
    wordWinners: { ...room.wordWinners },
  };
}

// ── Public API ─────────────────────────────────────────────────────────────

export function createRoom(socketId, name, email) {
  const code = generateCode();
  const room = {
    code, hostId: socketId,
    status: 'waiting',
    players: new Map(),
    wordPool: [], wordDifficulty: {},
    wordPairs: [],
    timeRemaining: 90, timer: null,
    submissions: {},  // word → { socketId: { confidence, correct } }
    wordWinners: {},  // word → socketId | 'tie'
  };
  room.players.set(socketId, { id: socketId, name, email, score: 0, submittedWords: [] });
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
  room.wordPairs     = pairs.map(([w, d]) => ({ word: w, difficulty: d }));
  room.wordPool      = pairs.map(([w]) => w);
  room.wordDifficulty = Object.fromEntries(pairs);
  room.submissions   = Object.fromEntries(pairs.map(([w]) => [w, {}]));
  room.wordWinners   = {};
  room.status        = 'playing';
  room.timeRemaining = 90;

  io.to(code).emit('battle-game-started', {
    wordPool: room.wordPool,
    wordDifficulty: room.wordDifficulty,
    players: buildPlayerSnapshot(room),
  });

  room.timer = setInterval(() => {
    room.timeRemaining--;
    io.to(code).emit('battle-tick', {
      timeRemaining: room.timeRemaining,
      players: buildPlayerSnapshot(room),
    });
    if (room.timeRemaining <= 0) {
      clearInterval(room.timer); room.timer = null;
      endBattleGame(code, io);
    }
  }, 1000);

  return { ok: true };
}

export async function submitBattleDrawing(code, socketId, word, imageData, textPenalty, io) {
  const room = rooms.get(code);
  if (!room || room.status !== 'playing') return;

  const player = room.players.get(socketId);
  if (!player) return;

  // Prevent duplicate submissions for the same word
  if (room.submissions[word]?.[socketId]) return;

  // Notify submitter immediately
  const socket = io.sockets.sockets.get(socketId);
  socket?.emit('battle-drawing-ack', { word });

  // Apply text penalty immediately to player's score
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
    const pts = difficulty === 'hard' ? 4 : 2;

    if (!room.submissions[word]) room.submissions[word] = {};
    room.submissions[word][socketId] = {
      confidence: result.confidence,
      correct: result.correct,
      points: pts,
    };
    player.submittedWords.push(word);

    // Tell submitter their result
    socket?.emit('battle-drawing-result', {
      word,
      confidence: result.confidence,
      correct: result.correct,
      aiGuess: result.aiGuess,
      description: result.description,
      funnyMessage: result.funnyMessage,
    });

    // Broadcast updated submission counts to all in room
    io.to(code).emit('battle-submissions-update', {
      word,
      submittedCount: Object.keys(room.submissions[word]).length,
      totalPlayers: room.players.size,
    });

    // If ALL players submitted for this word → resolve immediately
    if (Object.keys(room.submissions[word]).length >= room.players.size) {
      resolveWord(code, word, io);
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
    return;
  }

  let topConfidence = -1;
  let winner = null;
  let tie = false;

  for (const [pid, s] of Object.entries(subs)) {
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
    // Both top players get points
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
  if (room.timer) { clearInterval(room.timer); room.timer = null; }

  // Resolve any words not yet decided
  for (const word of room.wordPool) {
    if (room.wordWinners[word] === undefined && Object.keys(room.submissions[word] || {}).length > 0) {
      resolveWord(code, word, io);
    } else if (room.wordWinners[word] === undefined) {
      room.wordWinners[word] = null; // nobody drew this
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

  // Persist result in battle history
  battleHistory.set(code, {
    code,
    endedAt: Date.now(),
    ...gameOverPayload,
  });
  // Cap history at 100 most recent rooms
  if (battleHistory.size > 100) {
    battleHistory.delete(battleHistory.keys().next().value);
  }

  // Clean up room after 5 minutes
  setTimeout(() => rooms.delete(code), 5 * 60 * 1000);
}

export function removePlayerFromRoom(socketId, io) {
  for (const [code, room] of rooms.entries()) {
    if (!room.players.has(socketId)) continue;
    room.players.delete(socketId);

    if (room.players.size === 0) {
      if (room.timer) clearInterval(room.timer);
      rooms.delete(code);
      return;
    }

    // Re-assign host if needed
    if (room.hostId === socketId) {
      room.hostId = room.players.keys().next().value;
    }

    if (room.status === 'playing') {
      if (room.players.size < 2) {
        // Not enough players — end game
        if (room.timer) { clearInterval(room.timer); room.timer = null; }
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
