import 'dotenv/config';
import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import {
  joinGame,
  leaveGame,
  submitDrawing,
  selectWord,
  getSnapshot,
  getAllTimeLeaderboardArray,
  resetGame,
  GLOBAL_ROOM,
} from './gameManager.js';

const PORT = process.env.PORT || 3001;

const app = express();
const ALLOWED_ORIGINS = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(',')
  : ['http://localhost:5173', 'http://127.0.0.1:5173'];

app.use(cors({ origin: ALLOWED_ORIGINS }));
app.use(express.json({ limit: '10mb' }));

const httpServer = createServer(app);

const io = new Server(httpServer, {
  cors: {
    origin: ALLOWED_ORIGINS,
    methods: ['GET', 'POST'],
  },
  maxHttpBufferSize: 10e6,
});

app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: Date.now(), snapshot: getSnapshot() });
});

app.post('/admin/reset', (req, res) => {
  const key = req.headers['x-admin-key'];
  if (key !== (process.env.ADMIN_KEY || 'dhs2026reset')) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  resetGame(io);
  res.json({ success: true, message: 'Game reset' });
});

app.get('/leaderboard', (req, res) => {
  res.json({ leaderboard: getAllTimeLeaderboardArray() });
});

io.on('connection', (socket) => {
  console.log(`[+] Connected: ${socket.id}`);

  // ----------------------------------------------------------------
  // join-game: Join the centralized game
  // Payload: { playerName: string, playerEmail: string }
  // ----------------------------------------------------------------
  socket.on('join-game', ({ playerName, playerEmail }, callback) => {
    try {
      if (!playerName?.trim()) {
        return callback?.({ success: false, error: 'Name is required.' });
      }

      const name = playerName.trim().slice(0, 30);
      const email = (playerEmail || '').trim().slice(0, 100);

      const result = joinGame(socket.id, name, email, io);
      if (!result.success) {
        return callback?.({ success: false, error: result.error });
      }

      socket.join(GLOBAL_ROOM);

      // Broadcast updated player list to everyone
      io.to(GLOBAL_ROOM).emit('room-update', result.snapshot);

      // If game is already playing, send game-started directly to this socket
      if (result.snapshot.gameState === 'playing') {
        socket.emit('game-started', {
          wordPool: result.snapshot.wordPool,
          timeRemaining: result.snapshot.timeRemaining,
          players: result.snapshot.players,
        });
      }

      console.log(`[Join] ${name} <${email}>`);
      return callback?.({ success: true, snapshot: result.snapshot });
    } catch (err) {
      console.error('[join-game] Error:', err);
      callback?.({ success: false, error: 'Internal server error.' });
    }
  });

  // ----------------------------------------------------------------
  // spectate: Watch the game leaderboard without joining as a player
  // ----------------------------------------------------------------
  socket.on('spectate', () => {
    socket.join(GLOBAL_ROOM);
    socket.emit('room-update', getSnapshot());
    socket.emit('alltime-leaderboard', { leaderboard: getAllTimeLeaderboardArray() });
  });

  // ----------------------------------------------------------------
  // get-alltime-leaderboard: Fetch persistent leaderboard on demand
  // ----------------------------------------------------------------
  socket.on('get-alltime-leaderboard', (callback) => {
    callback?.({ leaderboard: getAllTimeLeaderboardArray() });
  });

  // ----------------------------------------------------------------
  // select-word: Player selects a word to draw
  // ----------------------------------------------------------------
  socket.on('select-word', ({ word }) => {
    selectWord(socket.id, word);
  });

  // ----------------------------------------------------------------
  // submit-drawing: Acknowledge instantly, judge async in background
  // ----------------------------------------------------------------
  socket.on('submit-drawing', ({ word, imageData, textPenalty }, callback) => {
    if (!word || !imageData) {
      return callback?.({ success: false, error: 'Missing required fields.' });
    }

    // Ack immediately so client can reset and draw next word
    callback?.({ success: true, queued: true });

    // Run AI judgment in background — result pushed via drawing-result event
    submitDrawing(socket.id, word, imageData, !!textPenalty)
      .then(result => {
        if (!result.success) return;
        socket.emit('drawing-result', result.result);
        console.log(
          `[Judge] ${result.result.playerName} drew "${word}" → ` +
          `${result.result.correct ? 'CORRECT' : 'WRONG'} (${result.result.confidence})`
        );
      })
      .catch(err => console.error('[submit-drawing] Error:', err));
  });

  // ----------------------------------------------------------------
  // disconnect
  // ----------------------------------------------------------------
  socket.on('disconnect', () => {
    console.log(`[-] Disconnected: ${socket.id}`);
    leaveGame(socket.id);
    // Broadcast updated player list
    const snapshot = getSnapshot();
    io.to(GLOBAL_ROOM).emit('room-update', snapshot);
  });
});

httpServer.listen(PORT, () => {
  console.log(`\n AI SpeedSketch Arena Server`);
  console.log(`=================================`);
  console.log(` Listening on http://localhost:${PORT}`);
  console.log(` Health: http://localhost:${PORT}/health`);
  console.log(`=================================\n`);
});
