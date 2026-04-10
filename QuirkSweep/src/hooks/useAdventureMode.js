import { useState, useCallback, useEffect, useRef } from 'react';

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
  PAUSED: 'paused',
};

// 特殊格子类型
const SPECIAL_CELL = {
  NONE: 'none',
  LIFE: 'life',           // 生命格 - 增加生命值
  TIME: 'time',           // 时间格 - 增加或减少时间
  LIGHTNING_YELLOW: 'lightning_yellow',  // 雷电格-黄色 - 直接触发十字形揭开
  LIGHTNING_RED: 'lightning_red',        // 雷电格-红色 - 连锁揭开
  SCANNER: 'scanner',     // 扫雷器 - 直接标记周围地雷
  FOG: 'fog',             // 迷雾格 - 释放迷雾
};

// 道具类型（保留用于兼容，但不再使用）
const ITEM = {
  NONE: 'none',
  LIGHTNING: 'lightning',
  SCANNER: 'scanner',
};

// 游戏配置
const CONFIG = {
  medium: {
    rows: 16,
    cols: 16,
    mines: 40,
    timeLimit: 180,        // 3分钟
    initialLives: 2,       // 改为2点生命
    fogDuration: 15000,    // 改为15秒
    specialCellCount: 10,  // 特殊格子数量改为10个
  },
  hard: {
    rows: 16,
    cols: 30,
    mines: 99,
    timeLimit: 300,        // 5分钟
    initialLives: 3,
    fogDuration: 15000,    // 改为15秒
    specialCellCount: 25,  // 特殊格子数量改为25个
  },
};

// 生成普通棋盘（有猜模式）
const generateBoard = (rows, cols, mineCount, firstClickRow, firstClickCol) => {
  const board = Array(rows).fill(null).map(() => 
    Array(cols).fill(null).map(() => ({
      state: 'hidden',
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
    const rowDiff = Math.abs(row - firstClickRow);
    const colDiff = Math.abs(col - firstClickCol);
    if (rowDiff <= 1 && colDiff <= 1) continue;
    
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

// 生成带特殊格子的棋盘（有猜模式）
const generateAdventureBoard = (difficulty, startRow, startCol) => {
  const config = CONFIG[difficulty];
  
  // 先生成基础棋盘（使用普通生成器，有猜模式）
  let board = generateBoard(
    config.rows,
    config.cols,
    config.mines,
    startRow,
    startCol
  );

  // 定义特殊格子类型（不含 NONE ）
  const specialTypes = [
    SPECIAL_CELL.LIFE,
    SPECIAL_CELL.TIME,
    SPECIAL_CELL.TIME,
    SPECIAL_CELL.LIGHTNING_YELLOW,
    SPECIAL_CELL.LIGHTNING_RED,
    SPECIAL_CELL.SCANNER,
    SPECIAL_CELL.FOG,
    SPECIAL_CELL.FOG,
  ];

  // 随机放置特殊格子
  let placed = 0;
  const maxAttempts = 1000;
  let attempts = 0;
  
  while (placed < config.specialCellCount && attempts < maxAttempts) {
    attempts++;
    const row = Math.floor(Math.random() * config.rows);
    const col = Math.floor(Math.random() * config.cols);
    
    // 不能是地雷，不能是起始位置，不能已经是特殊格子
    if (board[row][col].isMine) continue;
    if (Math.abs(row - startRow) <= 1 && Math.abs(col - startCol) <= 1) continue;
    if (board[row][col].specialType && board[row][col].specialType !== SPECIAL_CELL.NONE) continue;
    
    // 随机选择特殊类型
    const type = specialTypes[Math.floor(Math.random() * specialTypes.length)];
    board[row][col].specialType = type;
    placed++;
  }

  return board;
};

export const useAdventureMode = (difficulty = 'medium') => {
  const config = CONFIG[difficulty];
  
  const [board, setBoard] = useState([]);
  const [gameStatus, setGameStatus] = useState(GAME_STATUS.IDLE);
  const [flagCount, setFlagCount] = useState(0);
  const [timeLeft, setTimeLeft] = useState(config.timeLimit);
  const [lives, setLives] = useState(config.initialLives);
  const [currentItem, setCurrentItem] = useState(ITEM.NONE);
  const [fogCells, setFogCells] = useState(new Set());
  const [message, setMessage] = useState(null);
  
  const timerRef = useRef(null);
  const fogTimerRef = useRef(null);
  const firstClickRef = useRef(true);

  // 清除所有定时器
  const clearAllTimers = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    if (fogTimerRef.current) {
      clearTimeout(fogTimerRef.current);
      fogTimerRef.current = null;
    }
  }, []);

  // 初始化游戏
  const initGame = useCallback(() => {
    clearAllTimers();
    
    const emptyBoard = Array(config.rows).fill(null).map(() => 
      Array(config.cols).fill(null).map(() => ({
        state: CELL_STATE.HIDDEN,
        isMine: false,
        neighborMines: 0,
        specialType: SPECIAL_CELL.NONE,
      }))
    );
    
    setBoard(emptyBoard);
    setGameStatus(GAME_STATUS.IDLE);
    setFlagCount(0);
    setTimeLeft(config.timeLimit);
    setLives(config.initialLives);
    setCurrentItem(ITEM.NONE);
    setFogCells(new Set());
    setMessage(null);
    firstClickRef.current = true;
  }, [config, clearAllTimers]);

  // 开始计时
  const startTimer = useCallback(() => {
    if (!timerRef.current) {
      timerRef.current = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            setGameStatus(GAME_STATUS.LOST);
            clearAllTimers();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
  }, [clearAllTimers]);

  // 显示临时消息
  const showMessage = useCallback((msg, duration = 2000) => {
    setMessage(msg);
    setTimeout(() => setMessage(null), duration);
  }, []);

  // 递归揭开格子
  const revealCells = useCallback((currentBoard, row, col) => {
    if (row < 0 || row >= config.rows || col < 0 || col >= config.cols) return;
    if (currentBoard[row][col].state !== CELL_STATE.HIDDEN) return;
    
    currentBoard[row][col].state = CELL_STATE.REVEALED;
    
    if (currentBoard[row][col].neighborMines === 0 && !currentBoard[row][col].isMine) {
      for (let dr = -1; dr <= 1; dr++) {
        for (let dc = -1; dc <= 1; dc++) {
          if (dr === 0 && dc === 0) continue;
          revealCells(currentBoard, row + dr, col + dc);
        }
      }
    }
  }, [config]);

  // 处理生命格
  const handleLifeCell = useCallback((newBoard, row, col) => {
    setLives(prev => {
      const newLives = Math.min(prev + 1, 5);
      if (newLives > prev) {
        showMessage('❤️ 获得生命 +1！');
      }
      return newLives;
    });
    newBoard[row][col].specialTriggered = true;
  }, [showMessage]);

  // 处理时间格（概率改为55开）
  const handleTimeCell = useCallback((newBoard, row, col) => {
    const isBonus = Math.random() > 0.5;  // 改为50%概率
    const amount = isBonus ? 15 : -10;
    setTimeLeft(prev => {
      const newTime = Math.max(0, prev + amount);
      if (isBonus) {
        showMessage(`⏰ 时间 +${amount}秒！`);
      } else {
        showMessage(`⚠️ 时间 ${amount}秒！`);
      }
      return newTime;
    });
    newBoard[row][col].specialTriggered = true;
  }, [showMessage]);

  // 处理雷电格-黄色（改为直接触发：揭开上2下2左2右2，并标记地雷）
  const handleLightningYellow = useCallback((newBoard, row, col) => {
    const cellsToProcess = [];
    // 上2格
    if (row - 1 >= 0) cellsToProcess.push({ row: row - 1, col, delay: 0 });
    if (row - 2 >= 0) cellsToProcess.push({ row: row - 2, col, delay: 100 });
    // 下2格
    if (row + 1 < config.rows) cellsToProcess.push({ row: row + 1, col, delay: 200 });
    if (row + 2 < config.rows) cellsToProcess.push({ row: row + 2, col, delay: 300 });
    // 左2格
    if (col - 1 >= 0) cellsToProcess.push({ row, col: col - 1, delay: 400 });
    if (col - 2 >= 0) cellsToProcess.push({ row, col: col - 2, delay: 500 });
    // 右2格
    if (col + 1 < config.cols) cellsToProcess.push({ row, col: col + 1, delay: 600 });
    if (col + 2 < config.cols) cellsToProcess.push({ row, col: col + 2, delay: 700 });

    let markedMines = 0;

    cellsToProcess.forEach(({ row: r, col: c, delay }) => {
      setTimeout(() => {
        setBoard(prev => {
          const updated = prev.map(row => row.map(cell => ({ ...cell })));
          if (updated[r][c].state === CELL_STATE.HIDDEN) {
            if (updated[r][c].isMine) {
              updated[r][c].state = CELL_STATE.FLAGGED;
              markedMines++;
            } else {
              revealCells(updated, r, c);
            }
          }
          return updated;
        });
      }, delay);
    });

    setTimeout(() => {
      if (markedMines > 0) {
        setFlagCount(prev => prev + markedMines);
        showMessage(`⚡ 雷电发现并标记了 ${markedMines} 个地雷！`, 2000);
      } else {
        showMessage('⚡ 雷电已释放！', 1500);
      }
    }, 800);

    newBoard[row][col].specialTriggered = true;
  }, [config, revealCells, showMessage]);

  // 处理雷电格-红色（连锁揭开上下左右）
  const handleLightningRed = useCallback((newBoard, row, col) => {
    const directions = [[-1, 0], [1, 0], [0, -1], [0, 1]];
    const cellsToReveal = [];
    
    for (const [dr, dc] of directions) {
      const newRow = row + dr;
      const newCol = col + dc;
      if (newRow >= 0 && newRow < config.rows && newCol >= 0 && newCol < config.cols) {
        cellsToReveal.push({ row: newRow, col: newCol });
      }
    }
    
    let delay = 0;
    cellsToReveal.forEach(({ row: r, col: c }) => {
      setTimeout(() => {
        setBoard(prev => {
          const updated = prev.map(row => row.map(cell => ({ ...cell })));
          if (updated[r][c].state === CELL_STATE.HIDDEN) {
            if (updated[r][c].isMine) {
              setLives(prevLives => {
                if (prevLives > 1) {
                  showMessage('💥 连锁触发地雷！护盾抵挡！', 2000);
                  updated[r][c].state = CELL_STATE.FLAGGED;
                  setFlagCount(f => f + 1);
                  return prevLives - 1;
                } else {
                  updated[r][c].state = CELL_STATE.REVEALED;
                  const revealed = updated.map(row => 
                    row.map(cell => ({
                      ...cell,
                      state: cell.isMine ? CELL_STATE.REVEALED : cell.state,
                    }))
                  );
                  setGameStatus(GAME_STATUS.LOST);
                  clearAllTimers();
                  return 0;
                }
              });
            } else {
              revealCells(updated, r, c);
            }
          }
          return updated;
        });
      }, delay);
      delay += 100;
    });
    
    showMessage('⚡ 连锁释放！', 2000);
    newBoard[row][col].specialTriggered = true;
  }, [config, revealCells, showMessage, clearAllTimers]);

  // 处理扫雷器（改为直接触发：标记周围8格中的雷）
  const handleScanner = useCallback((newBoard, row, col) => {
    let markedMines = 0;
    const boardCopy = newBoard.map(r => r.map(c => ({ ...c })));
    
    // 检查周围8格
    for (let dr = -1; dr <= 1; dr++) {
      for (let dc = -1; dc <= 1; dc++) {
        if (dr === 0 && dc === 0) continue;
        const newRow = row + dr;
        const newCol = col + dc;
        if (newRow >= 0 && newRow < config.rows && newCol >= 0 && newCol < config.cols) {
          if (boardCopy[newRow][newCol].state === CELL_STATE.HIDDEN && boardCopy[newRow][newCol].isMine) {
            boardCopy[newRow][newCol].state = CELL_STATE.FLAGGED;
            markedMines++;
          }
        }
      }
    }
    
    if (markedMines > 0) {
      setFlagCount(prev => prev + markedMines);
      showMessage(`🔍 扫雷器发现并标记了 ${markedMines} 个地雷！`, 2500);
    } else {
      showMessage('🔍 扫雷器：周围没有地雷', 2000);
    }
    
    boardCopy[row][col].specialTriggered = true;
    return boardCopy;
  }, [config, showMessage]);

  // 处理迷雾格
  const handleFogCell = useCallback((newBoard, row, col) => {
    const fogSet = new Set();
    for (let dr = -2; dr <= 2; dr++) {
      for (let dc = -2; dc <= 2; dc++) {
        const newRow = row + dr;
        const newCol = col + dc;
        if (newRow >= 0 && newRow < config.rows && newCol >= 0 && newCol < config.cols) {
          if (newBoard[newRow][newCol].state === CELL_STATE.HIDDEN) {
            fogSet.add(`${newRow},${newCol}`);
          }
        }
      }
    }
    setFogCells(fogSet);
    showMessage('🌫️ 迷雾释放！周围区域被遮盖', 2000);
    
    if (fogTimerRef.current) {
      clearTimeout(fogTimerRef.current);
    }
    
    fogTimerRef.current = setTimeout(() => {
      setFogCells(new Set());
      showMessage('🌤️ 迷雾消散！', 1500);
    }, config.fogDuration);
    
    newBoard[row][col].specialTriggered = true;
  }, [config, showMessage]);

  // 揭示格子（主要游戏逻辑）
  const revealCell = useCallback(async (row, col) => {
    if (gameStatus === GAME_STATUS.WON || gameStatus === GAME_STATUS.LOST) return;
    
    const cell = board[row]?.[col];
    if (!cell || cell.state !== CELL_STATE.HIDDEN) return;
    
    if (fogCells.has(`${row},${col}`)) {
      showMessage('🌫️ 该区域被迷雾覆盖，无法操作！', 1500);
      return;
    }
    
    // 第一次点击
    if (firstClickRef.current) {
      const newBoard = generateAdventureBoard(difficulty, row, col);
      firstClickRef.current = false;
      setGameStatus(GAME_STATUS.PLAYING);
      startTimer();
      
      const boardCopy = newBoard.map(r => r.map(c => ({ ...c })));
      revealCells(boardCopy, row, col);
      
      // 处理特殊格子效果
      if (boardCopy[row][col].specialType) {
        switch (boardCopy[row][col].specialType) {
          case SPECIAL_CELL.LIFE:
            handleLifeCell(boardCopy, row, col);
            break;
          case SPECIAL_CELL.TIME:
            handleTimeCell(boardCopy, row, col);
            break;
          case SPECIAL_CELL.LIGHTNING_YELLOW:
            handleLightningYellow(boardCopy, row, col);
            break;
          case SPECIAL_CELL.LIGHTNING_RED:
            handleLightningRed(boardCopy, row, col);
            break;
          case SPECIAL_CELL.SCANNER:
            // 扫雷器返回新board
            const updatedBoard = handleScanner(boardCopy, row, col);
            setBoard(updatedBoard);
            checkWinCondition(updatedBoard);
            return;
          case SPECIAL_CELL.FOG:
            handleFogCell(boardCopy, row, col);
            break;
        }
      }
      
      setBoard(boardCopy);
      checkWinCondition(boardCopy);
      return;
    }
    
    // 正常点击
    const newBoard = board.map(r => r.map(c => ({ ...c })));
    
    // 踩到地雷
    if (newBoard[row][col].isMine) {
      if (lives > 1) {
        setLives(prev => prev - 1);
        newBoard[row][col].state = CELL_STATE.FLAGGED;
        showMessage('💥 踩到地雷！护盾抵挡！剩余生命：' + (lives - 1), 2000);
        setFlagCount(prev => prev + 1);
        setBoard(newBoard);
      } else {
        newBoard[row][col].state = CELL_STATE.REVEALED;
        const revealed = newBoard.map(r => 
          r.map(c => ({
            ...c,
            state: c.isMine ? CELL_STATE.REVEALED : c.state,
          }))
        );
        setBoard(revealed);
        setGameStatus(GAME_STATUS.LOST);
        setLives(0);
        clearAllTimers();
      }
      return;
    }
    
    revealCells(newBoard, row, col);
    
    // 处理特殊格子效果
    if (newBoard[row][col].specialType && !newBoard[row][col].specialTriggered) {
      switch (newBoard[row][col].specialType) {
        case SPECIAL_CELL.LIFE:
          handleLifeCell(newBoard, row, col);
          break;
        case SPECIAL_CELL.TIME:
          handleTimeCell(newBoard, row, col);
          break;
        case SPECIAL_CELL.LIGHTNING_YELLOW:
          handleLightningYellow(newBoard, row, col);
          break;
        case SPECIAL_CELL.LIGHTNING_RED:
          handleLightningRed(newBoard, row, col);
          break;
        case SPECIAL_CELL.SCANNER:
          const updatedBoard = handleScanner(newBoard, row, col);
          setBoard(updatedBoard);
          checkWinCondition(updatedBoard);
          return;
        case SPECIAL_CELL.FOG:
          handleFogCell(newBoard, row, col);
          break;
      }
    }
    
    setBoard(newBoard);
    checkWinCondition(newBoard);
  }, [board, gameStatus, fogCells, lives, difficulty, revealCells, showMessage, handleLifeCell, handleTimeCell, handleLightningYellow, handleLightningRed, handleScanner, handleFogCell, startTimer, clearAllTimers]);

  // 检查获胜条件
  const checkWinCondition = useCallback((currentBoard) => {
    const revealedCount = currentBoard.flat().filter(c => c.state === CELL_STATE.REVEALED).length;
    const totalCells = config.rows * config.cols;
    if (revealedCount === totalCells - config.mines) {
      setGameStatus(GAME_STATUS.WON);
      clearAllTimers();
    }
  }, [config, clearAllTimers]);

  // 标记/取消标记
  const toggleFlag = useCallback((row, col) => {
    if (gameStatus === GAME_STATUS.WON || gameStatus === GAME_STATUS.LOST) return;
    
    const cell = board[row]?.[col];
    if (!cell || cell.state === CELL_STATE.REVEALED) return;
    
    if (fogCells.has(`${row},${col}`)) {
      showMessage('🌫️ 该区域被迷雾覆盖，无法操作！', 1500);
      return;
    }

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
  }, [board, gameStatus, fogCells, showMessage]);

  // 取消道具使用（保留函数但不再使用）
  const cancelItem = useCallback(() => {
    if (currentItem !== ITEM.NONE) {
      setCurrentItem(ITEM.NONE);
      showMessage('已取消道具使用', 1000);
    }
  }, [currentItem, showMessage]);

  // 清理
  useEffect(() => {
    return () => clearAllTimers();
  }, [clearAllTimers]);

  return {
    board,
    gameStatus,
    flagCount,
    timeLeft,
    lives,
    currentItem,
    fogCells,
    message,
    config,
    CELL_STATE,
    GAME_STATUS,
    SPECIAL_CELL,
    ITEM,
    initGame,
    revealCell,
    toggleFlag,
    cancelItem,
  };
};
