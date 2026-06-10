import { useState, useEffect, useCallback, useRef } from 'react';

const INITIAL = {
  status: 'idle',       // idle | lobby | playing | finished
  roomCode: null,
  isHost: false,
  players: [],
  wordPool: [],
  wordDifficulty: {},
  timeRemaining: 90,
  selectedWord: null,
  // per-player: which words I've submitted
  mySubmittedWords: [],
  // last AI result for me { word, confidence, correct, aiGuess, funnyMessage }
  myResults: [],
  // submissions status: { word: { submittedCount, totalPlayers } }
  submissionStatus: {},
  // word → { winnerId, winnerName, isTie, topConfidence }
  wordWinners: {},
  // final game over data
  finalPlayers: [],
  finalWordWinners: {},
  finalSubmissions: {},
};

export function useBattleState(socketRef, myPlayerId) {
  const [state, setState] = useState(INITIAL);
  const resultIdRef = useRef(0);

  const update = (patch) => setState(prev => ({ ...prev, ...patch }));

  useEffect(() => {
    const s = socketRef.current;
    if (!s) return;

    const onRoomUpdate = (snapshot) => {
      setState(prev => ({
        ...prev,
        players: snapshot.players,
        wordPool: snapshot.wordPool || [],
        wordDifficulty: snapshot.wordDifficulty || {},
        timeRemaining: snapshot.timeRemaining,
      }));
    };

    const onGameStarted = ({ wordPool, wordDifficulty, players }) => {
      // Brief 'starting' state so the orb shows for all players, then jump to playing
      setState(prev => ({ ...prev, status: 'starting' }));
      setTimeout(() => {
        setState(prev => ({
          ...prev,
          status: 'playing',
          wordPool,
          wordDifficulty,
          players,
          selectedWord: null,
          mySubmittedWords: [],
          myResults: [],
          submissionStatus: Object.fromEntries(wordPool.map(w => [w, { submittedCount: 0, totalPlayers: players.length }])),
          wordWinners: {},
        }));
      }, 2500);
    };

    const onTick = ({ timeRemaining, players }) => {
      setState(prev => ({ ...prev, timeRemaining, players }));
    };

    const onDrawingResult = (result) => {
      const id = ++resultIdRef.current;
      setState(prev => ({
        ...prev,
        myResults: [{ ...result, id }, ...prev.myResults].slice(0, 10),
        mySubmittedWords: prev.mySubmittedWords.includes(result.word)
          ? prev.mySubmittedWords
          : [...prev.mySubmittedWords, result.word],
      }));
    };

    const onSubmissionsUpdate = ({ word, submittedCount, totalPlayers }) => {
      setState(prev => ({
        ...prev,
        submissionStatus: {
          ...prev.submissionStatus,
          [word]: { submittedCount, totalPlayers },
        },
      }));
    };

    const onWordWinner = ({ word, winnerId, winnerName, isTie, topConfidence, players }) => {
      setState(prev => ({
        ...prev,
        players,
        wordWinners: {
          ...prev.wordWinners,
          [word]: { winnerId, winnerName, isTie, topConfidence },
        },
      }));
    };

    const onGameOver = ({ players, wordWinners, wordPool, wordDifficulty, submissions }) => {
      setState(prev => ({
        ...prev,
        status: 'finished',
        finalPlayers: players,
        finalWordWinners: wordWinners,
        wordPool,
        wordDifficulty,
        finalSubmissions: submissions,
      }));
    };

    s.on('battle-room-update',      onRoomUpdate);
    s.on('battle-game-started',     onGameStarted);
    s.on('battle-tick',             onTick);
    s.on('battle-drawing-result',   onDrawingResult);
    s.on('battle-submissions-update', onSubmissionsUpdate);
    s.on('battle-word-winner',      onWordWinner);
    s.on('battle-game-over',        onGameOver);

    return () => {
      s.off('battle-room-update',      onRoomUpdate);
      s.off('battle-game-started',     onGameStarted);
      s.off('battle-tick',             onTick);
      s.off('battle-drawing-result',   onDrawingResult);
      s.off('battle-submissions-update', onSubmissionsUpdate);
      s.off('battle-word-winner',      onWordWinner);
      s.off('battle-game-over',        onGameOver);
    };
  }, [socketRef]);

  const createRoom = useCallback((name, email) => {
    return new Promise((resolve) => {
      socketRef.current?.emit('battle-create', { playerName: name, playerEmail: email }, (res) => {
        if (res.success) {
          setState(prev => ({
            ...prev,
            status: 'lobby',
            roomCode: res.code,
            isHost: true,
            players: res.snapshot.players,
          }));
        }
        resolve(res);
      });
    });
  }, [socketRef]);

  const joinRoom = useCallback((code, name, email) => {
    return new Promise((resolve) => {
      socketRef.current?.emit('battle-join', { roomCode: code, playerName: name, playerEmail: email }, (res) => {
        if (res.success) {
          setState(prev => ({
            ...prev,
            status: 'lobby',
            roomCode: res.code,
            isHost: false,
            players: res.snapshot.players,
          }));
        }
        resolve(res);
      });
    });
  }, [socketRef]);

  const startGame = useCallback(() => {
    return new Promise((resolve) => {
      socketRef.current?.emit('battle-start', { roomCode: state.roomCode }, (res) => {
        resolve(res);
      });
    });
  }, [socketRef, state.roomCode]);

  const submitDrawing = useCallback(({ word, imageData, textPenalty }) => {
    setState(prev => ({ ...prev, selectedWord: null }));
    socketRef.current?.emit('battle-submit', {
      roomCode: state.roomCode, word, imageData, textPenalty,
    });
  }, [socketRef, state.roomCode]);

  const selectWord = useCallback((word) => {
    setState(prev => ({ ...prev, selectedWord: word }));
  }, []);

  const reset = useCallback(() => {
    setState(INITIAL);
  }, []);

  return {
    state,
    actions: { createRoom, joinRoom, startGame, submitDrawing, selectWord, reset },
  };
}
