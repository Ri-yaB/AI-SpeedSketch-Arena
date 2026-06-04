import { useEffect, useState, useCallback, useRef } from 'react';

const INITIAL_STATE = {
  joined: false,
  gameState: 'waiting',
  players: [],
  wordPool: [],
  wordDifficulty: {},
  timeRemaining: 90,
  myScore: 0,
  completedWords: [],
  selectedWord: null,
  leaderboard: [],
  drawingResults: [],
  hintsRemaining: 2,
  hintWord: null,
};

export function useGameState(socketRef, myPlayerId) {
  const [state, setState] = useState(INITIAL_STATE);
  const stateRef = useRef(state);

  useEffect(() => {
    stateRef.current = state;
  }, [state]);

  useEffect(() => {
    const socket = socketRef.current;
    if (!socket) return;

    const onRoomUpdate = (snapshot) => {
      setState(prev => {
        const me = snapshot.players.find(p => p.id === myPlayerId);
        return {
          ...prev,
          gameState: snapshot.gameState,
          players: snapshot.players,
          wordPool: snapshot.wordPool.length ? snapshot.wordPool : prev.wordPool,
          timeRemaining: snapshot.timeRemaining,
          leaderboard: [...snapshot.players].sort((a, b) => b.score - a.score),
          myScore: me ? me.score : prev.myScore,
          completedWords: me ? me.completedWords : prev.completedWords,
        };
      });
    };

    const onGameStarted = ({ wordPool, wordDifficulty, timeRemaining, players }) => {
      setState(prev => ({
        ...prev,
        gameState: 'playing',
        wordPool,
        wordDifficulty: wordDifficulty || prev.wordDifficulty,
        timeRemaining,
        players,
        myScore: 0,
        completedWords: [],
        selectedWord: null,
        drawingResults: [],
        leaderboard: [...players].sort((a, b) => b.score - a.score),
        hintsRemaining: 2,
        hintWord: null,
      }));
    };

    const onGameTick = ({ timeRemaining, leaderboard }) => {
      setState(prev => ({ ...prev, timeRemaining, leaderboard }));
    };

    const onDrawingResult = (result) => {
      setState(prev => {
        const newResults = [result, ...prev.drawingResults].slice(0, 10);
        const newCompleted = result.correct
          ? [...prev.completedWords, result.wordGuessed]
          : prev.completedWords;
        return {
          ...prev,
          myScore: result.correct ? result.score : prev.myScore,
          completedWords: newCompleted,
          selectedWord: result.correct ? null : prev.selectedWord,
          drawingResults: newResults,
        };
      });
    };

    const onLeaderboardUpdate = ({ leaderboard }) => {
      setState(prev => ({ ...prev, leaderboard }));
    };

    const onGameOver = ({ leaderboard, players, allTimeLeaderboard }) => {
      setState(prev => ({
        ...prev,
        gameState: 'finished',
        leaderboard,
        players,
        timeRemaining: 0,
        allTimeLeaderboard: allTimeLeaderboard || prev.allTimeLeaderboard || [],
      }));
      // Push to any spectator sockets in the room
      if (allTimeLeaderboard) {
        socket.emit('alltime-leaderboard', { leaderboard: allTimeLeaderboard });
      }
    };

    const onReturnToLobby = () => {
      setState(INITIAL_STATE);
    };

    socket.on('room-update', onRoomUpdate);
    socket.on('game-started', onGameStarted);
    socket.on('game-tick', onGameTick);
    socket.on('drawing-result', onDrawingResult);
    socket.on('leaderboard-update', onLeaderboardUpdate);
    socket.on('game-over', onGameOver);
    socket.on('return-to-lobby', onReturnToLobby);

    return () => {
      socket.off('room-update', onRoomUpdate);
      socket.off('game-started', onGameStarted);
      socket.off('game-tick', onGameTick);
      socket.off('drawing-result', onDrawingResult);
      socket.off('leaderboard-update', onLeaderboardUpdate);
      socket.off('game-over', onGameOver);
      socket.off('return-to-lobby', onReturnToLobby);
    };
  }, [socketRef, myPlayerId]);

  // ---- Actions ----

  const joinGame = useCallback(({ playerName, playerEmail }, callback) => {
    const socket = socketRef.current;
    if (!socket) return;
    socket.emit('join-game', { playerName, playerEmail }, (response) => {
      if (response.success) {
        setState(prev => ({
          ...prev,
          joined: true,
          gameState: response.snapshot.gameState,
          players: response.snapshot.players,
          wordPool: response.snapshot.wordPool,
          wordDifficulty: response.snapshot.wordDifficulty || prev.wordDifficulty,
          timeRemaining: response.snapshot.timeRemaining,
          leaderboard: [...response.snapshot.players].sort((a, b) => b.score - a.score),
        }));
      }
      callback?.(response);
    });
  }, [socketRef]);

  const submitDrawing = useCallback(({ word, imageData, textPenalty }) => {
    const socket = socketRef.current;
    if (!socket) return;
    // Clear selected word immediately — don't wait for AI
    setState(prev => ({ ...prev, selectedWord: null }));
    socket.emit('submit-drawing', { word, imageData, textPenalty: !!textPenalty });
  }, [socketRef]);

  const useHint = useCallback(() => {
    setState(prev => {
      if (prev.hintsRemaining <= 0) return prev;
      const available = prev.wordPool.filter(
        w => !prev.completedWords.includes(w) && w !== prev.selectedWord
      );
      if (available.length === 0) return prev;
      const hintWord = available[Math.floor(Math.random() * available.length)];
      const socket = socketRef.current;
      if (socket) socket.emit('select-word', { word: hintWord });
      return {
        ...prev,
        selectedWord: hintWord,
        hintWord,
        hintsRemaining: prev.hintsRemaining - 1,
      };
    });
  }, [socketRef]);

  const selectWord = useCallback((word) => {
    const socket = socketRef.current;
    if (!socket) return;
    setState(prev => ({ ...prev, selectedWord: word }));
    socket.emit('select-word', { word });
  }, [socketRef]);

  const exitGame = useCallback(() => {
    setState(INITIAL_STATE);
  }, []);

  return {
    state,
    actions: {
      joinGame,
      submitDrawing,
      selectWord,
      useHint,
      exitGame,
    },
  };
}
