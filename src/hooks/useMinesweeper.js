
import { useState, useCallback, useEffect, useRef } from 'react';
import { generateNoGuessBoard } from '@/lib/minesweeperSolver';
import {
  getStandardDifficulty,
  canEnterLeaderboard,
} from '@/services/leaderboardService';

// 单元格状态
const CELL_STATE = {
  HIDDEN: 'hidden',
  REVEALED: 'revealed',
  FLAGGED: 'flagged',
  QUESTIONED: 'questioned',
};

// 游戏状态
const GAME_STATUS = {
  IDLE: 'idle',
  PLAYING: 'playing',
  WON: 'won',
  LOST: 'lost',
};

// 生成普通棋盘
const generateBoard = (rows, cols, mineCount, firstClickRow = -1, firstClickCol = -1) => {
  const board = Array(rows).fill(null).map(() => 
    Array(cols).fill(null).map(() => ({
      state: CELL_STATE.HIDDEN,
      isMine: false,
      neighborMines: 0,
    }))
  );

  // 放置地雷（避开第一次点击的位置）
  let minesPlaced = 0;
  while (minesPlaced < mineCount) {
    const row = Math.floor(Math.random() * rows);
    const col = Math.floor(Math.random() * cols);
    
    // 避开第一次点击的位置及其周围
    if (firstClickRow !== -1) {
      const rowDiff = Math.abs(row - firstClickRow);
      const colDiff = Math.abs(col - firstClickCol);
      if (rowDiff <= 1 && colDiff <= 1) continue;
    }
    
    if (!board[row][col].isMine) {
      board[row][col].isMine = true;
      minesPlaced++;
    }
  }

  // 计算每个格子周围的地雷数量
  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      if (!board[row][col].isMine) {
        let count = 0;
        for (let dr = -1; dr <= 1; dr++) {
          for (let dc = -1; dc <= 1; dc++) {
            const newRow = row + dr;
            const newCol = col + dc;
            if (newRow >= 0 && newRow < rows && newCol >= 0 && newCol < cols) {
              if (board[newRow][newCol].isMine) count++;
            }
          }
        }
        board[row][col].neighborMines = count;
      }
    }
  }

  return board;
};

// 获取存储的历史记录
const getStoredHistory = () => {
  const stored = localStorage.getItem('minesweeper_history');
  return stored ? JSON.parse(stored) : [];
};

// 保存历史记录
const saveHistory = (record) => {
  const history = getStoredHistory();
  const newRecord = {
    ...record,
    id: Date.now(),
    date: new Date().toLocaleString('zh-CN'),
  };
  const updatedHistory = [newRecord, ...history].slice(0, 50); // 只保留最近50条
  localStorage.setItem('minesweeper_history', JSON.stringify(updatedHistory));
};

export const useMinesweeper = () => {
  const [settings, setSettings] = useState({
    rows: 9,
    cols: 9,
    mineCount: 10,
    noGuessMode: false, // 无猜模式开关
  });
  
  const [board, setBoard] = useState([]);
  const [gameStatus, setGameStatus] = useState(GAME_STATUS.IDLE);
  const [flagCount, setFlagCount] = useState(0);
  const [timer, setTimer] = useState(0);
  const [history, setHistory] = useState([]);
  const [pendingScoreSubmit, setPendingScoreSubmit] = useState(null);
  const timerRef = useRef(null);
  const firstClickRef = useRef(true);
  const pendingFirstClick = useRef(null); // 存储第一次点击位置

  // 加载历史记录
  useEffect(() => {
    setHistory(getStoredHistory());
  }, []);

  // 初始化游戏
  const initGame = useCallback((newSettings = null) => {
    if (newSettings) {
      setSettings(newSettings);
    }
    const currentSettings = newSettings || settings;
    
    // 清除待提交的排行榜成绩
    setPendingScoreSubmit(null);
    
    // 根据模式生成棋盘
    let newBoard;
    if (currentSettings.noGuessMode) {
      // 无猜模式：先不生成完整棋盘，等待第一次点击
      newBoard = Array(currentSettings.rows).fill(null).map(() => 
        Array(currentSettings.cols).fill(null).map(() => ({
          state: CELL_STATE.HIDDEN,
          isMine: false,
          neighborMines: 0,
        }))
      );
      pendingFirstClick.current = null;
    } else {
      newBoard = generateBoard(currentSettings.rows, currentSettings.cols, currentSettings.mineCount);
    }
    
    setBoard(newBoard);
    setGameStatus(GAME_STATUS.IDLE);
    setFlagCount(0);
    setTimer(0);
    firstClickRef.current = true;
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, [settings]);

  // 开始计时
  const startTimer = useCallback(() => {
    if (!timerRef.current) {
      timerRef.current = setInterval(() => {
        setTimer(prev => prev + 1);
      }, 1000);
    }
  }, []);

  // 停止计时
  const stopTimer = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  // 递归揭开格子及其周围的空白格子
  const revealCells = useCallback((currentBoard, row, col, rows, cols) => {
    // 边界检查
    if (row < 0 || row >= rows || col < 0 || col >= cols) return;
    // 只处理隐藏的格子
    if (currentBoard[row][col].state !== CELL_STATE.HIDDEN) return;
    
    // 揭开当前格子
    currentBoard[row][col].state = CELL_STATE.REVEALED;
    
    // 如果当前格子周围没有地雷，递归揭开周围8个格子
    if (currentBoard[row][col].neighborMines === 0 && !currentBoard[row][col].isMine) {
      for (let dr = -1; dr <= 1; dr++) {
        for (let dc = -1; dc <= 1; dc++) {
          if (dr === 0 && dc === 0) continue; // 跳过当前格子
          revealCells(currentBoard, row + dr, col + dc, rows, cols);
        }
      }
    }
  }, []);

  // 检查是否进入排行榜
  const checkLeaderboard = useCallback(async (finalTime) => {
    const difficulty = getStandardDifficulty(settings.rows, settings.cols, settings.mineCount);
    if (!difficulty) return; // 非标准难度不上榜

    const canEnter = await canEnterLeaderboard(difficulty, settings.noGuessMode, finalTime, 100);
    if (canEnter) {
      setPendingScoreSubmit({
        difficulty,
        noGuessMode: settings.noGuessMode,
        timeSeconds: finalTime,
        rows: settings.rows,
        cols: settings.cols,
        mineCount: settings.mineCount,
      });
    }
  }, [settings]);

  // 揭示格子
  const revealCell = useCallback(async (row, col) => {
    if (gameStatus === GAME_STATUS.WON || gameStatus === GAME_STATUS.LOST) return;
    
    const cell = board[row]?.[col];
    if (!cell || cell.state !== CELL_STATE.HIDDEN) return;

    // 第一次点击处理
    if (firstClickRef.current) {
      let currentBoard;
      
      if (settings.noGuessMode) {
        // 无猜模式：根据第一次点击位置生成可解棋盘
        currentBoard = generateNoGuessBoard(
          settings.rows, 
          settings.cols, 
          settings.mineCount, 
          row, 
          col
        );
      } else {
        // 普通模式：生成避开第一次点击的棋盘
        currentBoard = generateBoard(settings.rows, settings.cols, settings.mineCount, row, col);
      }
      
      firstClickRef.current = false;
      setGameStatus(GAME_STATUS.PLAYING);
      startTimer();
      
      // 创建深拷贝并揭开
      const newBoard = currentBoard.map(r => r.map(c => ({ ...c })));
      revealCells(newBoard, row, col, settings.rows, settings.cols);
      
      // 检查是否获胜（可能第一次点击就赢了小棋盘）
      const revealedCount = newBoard.flat().filter(c => c.state === CELL_STATE.REVEALED).length;
      const totalCells = settings.rows * settings.cols;
      
      if (revealedCount === totalCells - settings.mineCount) {
        setBoard(newBoard);
        setGameStatus(GAME_STATUS.WON);
        stopTimer();
        const finalTime = 1;
        saveHistory({
          rows: settings.rows,
          cols: settings.cols,
          mineCount: settings.mineCount,
          time: finalTime,
          result: 'win',
          noGuessMode: settings.noGuessMode,
        });
        setHistory(getStoredHistory());
        await checkLeaderboard(finalTime);
        return;
      }
      
      setBoard(newBoard);
      return;
    }

    // 后续点击处理（与普通模式相同）
    const newBoard = board.map(r => r.map(c => ({ ...c })));
    revealCells(newBoard, row, col, settings.rows, settings.cols);
    
    // 检查是否踩到地雷
    if (newBoard[row][col].isMine) {
      const revealedBoard = newBoard.map(r => 
        r.map(c => ({
          ...c,
          state: c.isMine ? CELL_STATE.REVEALED : c.state,
        }))
      );
      setBoard(revealedBoard);
      setGameStatus(GAME_STATUS.LOST);
      stopTimer();
      saveHistory({
        rows: settings.rows,
        cols: settings.cols,
        mineCount: settings.mineCount,
        time: timer + 1,
        result: 'lose',
        noGuessMode: settings.noGuessMode,
      });
      setHistory(getStoredHistory());
    } else {
      setBoard(newBoard);
      const revealedCount = newBoard.flat().filter(c => c.state === CELL_STATE.REVEALED).length;
      const totalCells = settings.rows * settings.cols;
      if (revealedCount === totalCells - settings.mineCount) {
        setGameStatus(GAME_STATUS.WON);
        stopTimer();
        const finalTime = timer + 1;
        saveHistory({
          rows: settings.rows,
          cols: settings.cols,
          mineCount: settings.mineCount,
          time: finalTime,
          result: 'win',
          noGuessMode: settings.noGuessMode,
        });
        setHistory(getStoredHistory());
        await checkLeaderboard(finalTime);
      }
    }
  }, [board, gameStatus, settings, timer, startTimer, stopTimer, revealCells, checkLeaderboard]);

  // 标记/取消标记格子
  const toggleFlag = useCallback((row, col) => {
    if (gameStatus === GAME_STATUS.WON || gameStatus === GAME_STATUS.LOST) return;
    
    const cell = board[row]?.[col];
    if (!cell || cell.state === CELL_STATE.REVEALED) return;

    const newBoard = board.map(r => r.map(c => ({ ...c })));
    
    if (cell.state === CELL_STATE.HIDDEN) {
      newBoard[row][col].state = CELL_STATE.FLAGGED;
      setFlagCount(prev => prev + 1);
    } else if (cell.state === CELL_STATE.FLAGGED) {
      newBoard[row][col].state = CELL_STATE.QUESTIONED;
      setFlagCount(prev => prev - 1);
    } else {
      newBoard[row][col].state = CELL_STATE.HIDDEN;
    }
    
    setBoard(newBoard);
  }, [board, gameStatus]);

  // 清除历史记录
  const clearHistory = useCallback(() => {
    localStorage.removeItem('minesweeper_history');
    setHistory([]);
  }, []);

  // 清除待提交的排行榜成绩
  const clearPendingScoreSubmit = useCallback(() => {
    setPendingScoreSubmit(null);
  }, []);

  return {
    board,
    gameStatus,
    flagCount,
    timer,
    settings,
    history,
    pendingScoreSubmit,
    CELL_STATE,
    GAME_STATUS,
    initGame,
    revealCell,
    toggleFlag,
    setSettings,
    clearHistory,
    clearPendingScoreSubmit,
  };
};

