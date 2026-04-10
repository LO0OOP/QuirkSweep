// 无猜模式生成器和求解器

// 检查位置是否在边界内
const isValidCell = (row, col, rows, cols) => {
  return row >= 0 && row < rows && col >= 0 && col < cols;
};

// 获取周围8个方向的格子
const getNeighbors = (row, col, rows, cols) => {
  const neighbors = [];
  for (let dr = -1; dr <= 1; dr++) {
    for (let dc = -1; dc <= 1; dc++) {
      if (dr === 0 && dc === 0) continue;
      const newRow = row + dr;
      const newCol = col + dc;
      if (isValidCell(newRow, newCol, rows, cols)) {
        neighbors.push({ row: newRow, col: newCol });
      }
    }
  }
  return neighbors;
};

// 复制棋盘
const copyBoard = (board) => {
  return board.map(row => row.map(cell => ({ ...cell })));
};

// 求解器 - 使用简单规则推断可以确定的位置
// 返回可以安全揭示的位置和可以确定是地雷的位置
export const solveStep = (board, rows, cols, revealedCells, flaggedCells) => {
  const safeCells = new Set(); // 可以确定安全的格子
  const mineCells = new Set(); // 可以确定是地雷的格子
  let changed = true;

  while (changed) {
    changed = false;

    // 遍历所有已揭示的数字格子
    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        const cell = board[row][col];
        if (cell.state !== 'revealed' || cell.neighborMines === 0) continue;

        const neighbors = getNeighbors(row, col, rows, cols);
        const hiddenNeighbors = neighbors.filter(n => 
          board[n.row][n.col].state === 'hidden'
        );
        const flaggedNeighbors = neighbors.filter(n => 
          board[n.row][n.col].state === 'flagged'
        );

        const remainingMines = cell.neighborMines - flaggedNeighbors.length;

        // 规则1: 如果剩余地雷数等于隐藏邻居数，所有隐藏邻居都是地雷
        if (remainingMines === hiddenNeighbors.length && remainingMines > 0) {
          hiddenNeighbors.forEach(n => {
            const key = `${n.row},${n.col}`;
            if (!mineCells.has(key)) {
              mineCells.add(key);
              changed = true;
            }
          });
        }

        // 规则2: 如果剩余地雷数为0，所有隐藏邻居都是安全的
        if (remainingMines === 0 && hiddenNeighbors.length > 0) {
          hiddenNeighbors.forEach(n => {
            const key = `${n.row},${n.col}`;
            if (!safeCells.has(key)) {
              safeCells.add(key);
              changed = true;
            }
          });
        }
      }
    }
  }

  return {
    safeCells: Array.from(safeCells).map(key => {
      const [row, col] = key.split(',').map(Number);
      return { row, col };
    }),
    mineCells: Array.from(mineCells).map(key => {
      const [row, col] = key.split(',').map(Number);
      return { row, col };
    }),
  };
};

// 检查棋盘是否可解（从第一次点击开始）
export const isSolvable = (board, rows, cols, startRow, startCol) => {
  // 模拟游戏过程
  const simBoard = copyBoard(board);
  const toReveal = [{ row: startRow, col: startCol }];
  const revealed = new Set([`${startRow},${startCol}`]);
  const flagged = new Set();

  // 揭示第一个格子
  simBoard[startRow][startCol].state = 'revealed';

  // 如果是0，连锁揭示
  if (simBoard[startRow][startCol].neighborMines === 0) {
    const queue = [{ row: startRow, col: startCol }];
    while (queue.length > 0) {
      const { row, col } = queue.shift();
      const neighbors = getNeighbors(row, col, rows, cols);
      for (const n of neighbors) {
        const key = `${n.row},${n.col}`;
        if (!revealed.has(key) && simBoard[n.row][n.col].state === 'hidden') {
          simBoard[n.row][n.col].state = 'revealed';
          revealed.add(key);
          if (simBoard[n.row][n.col].neighborMines === 0) {
            queue.push(n);
          }
        }
      }
    }
  }

  // 使用求解器迭代解决
  let progress = true;
  while (progress) {
    const { safeCells, mineCells } = solveStep(simBoard, rows, cols, revealed, flagged);

    // 标记确定的地雷
    for (const { row, col } of mineCells) {
      const key = `${row},${col}`;
      if (!flagged.has(key)) {
        flagged.add(key);
        simBoard[row][col].state = 'flagged';
      }
    }

    // 揭示确定安全的格子
    let newRevealed = false;
    for (const { row, col } of safeCells) {
      const key = `${row},${col}`;
      if (!revealed.has(key)) {
        revealed.add(key);
        simBoard[row][col].state = 'revealed';
        newRevealed = true;

        // 如果是0，连锁揭示
        if (simBoard[row][col].neighborMines === 0) {
          const queue = [{ row, col }];
          while (queue.length > 0) {
            const { r, c } = queue.shift();
            const neighbors = getNeighbors(r, c, rows, cols);
            for (const n of neighbors) {
              const nKey = `${n.row},${n.col}`;
              if (!revealed.has(nKey) && simBoard[n.row][n.col].state === 'hidden') {
                simBoard[n.row][n.col].state = 'revealed';
                revealed.add(nKey);
                if (simBoard[n.row][n.col].neighborMines === 0) {
                  queue.push({ row: n.row, col: n.col });
                }
              }
            }
          }
        }
      }
    }

    progress = safeCells.length > 0 || mineCells.length > 0;
  }

  // 检查是否所有非雷格子都被揭示
  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      if (!simBoard[row][col].isMine && simBoard[row][col].state === 'hidden') {
        return false; // 还有未揭示的非雷格子，但无法推断
      }
    }
  }

  return true;
};

// 生成无猜模式棋盘
export const generateNoGuessBoard = (rows, cols, mineCount, startRow, startCol) => {
  const maxAttempts = 1000;
  
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    // 创建空白棋盘
    const board = Array(rows).fill(null).map(() => 
      Array(cols).fill(null).map(() => ({
        state: 'hidden',
        isMine: false,
        neighborMines: 0,
      }))
    );

    // 放置地雷（避开起始位置及其周围）
    let minesPlaced = 0;
    const safeZone = new Set();
    for (let dr = -1; dr <= 1; dr++) {
      for (let dc = -1; dc <= 1; dc++) {
        const r = startRow + dr;
        const c = startCol + dc;
        if (isValidCell(r, c, rows, cols)) {
          safeZone.add(`${r},${c}`);
        }
      }
    }
    safeZone.add(`${startRow},${startCol}`);

    while (minesPlaced < mineCount) {
      const row = Math.floor(Math.random() * rows);
      const col = Math.floor(Math.random() * cols);
      
      if (safeZone.has(`${row},${col}`)) continue;
      
      if (!board[row][col].isMine) {
        board[row][col].isMine = true;
        minesPlaced++;
      }
    }

    // 计算邻居地雷数
    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        if (!board[row][col].isMine) {
          const neighbors = getNeighbors(row, col, rows, cols);
          board[row][col].neighborMines = neighbors.filter(n => 
            board[n.row][n.col].isMine
          ).length;
        }
      }
    }

    // 验证是否可解
    if (isSolvable(board, rows, cols, startRow, startCol)) {
      return board;
    }
  }

  // 如果多次尝试失败，返回一个简单模式（地雷只放在边缘）
  console.warn('无法生成无猜模式棋盘，使用边缘布局');
  return generateEdgeBoard(rows, cols, mineCount, startRow, startCol);
};

// 边缘布局 - 一种简单的无猜策略
const generateEdgeBoard = (rows, cols, mineCount, startRow, startCol) => {
  const board = Array(rows).fill(null).map(() => 
    Array(cols).fill(null).map(() => ({
      state: 'hidden',
      isMine: false,
      neighborMines: 0,
    }))
  );

  // 标记起始区域为安全
  const safeZone = new Set();
  for (let dr = -1; dr <= 1; dr++) {
    for (let dc = -1; dc <= 1; dc++) {
      const r = startRow + dr;
      const c = startCol + dc;
      if (isValidCell(r, c, rows, cols)) {
        safeZone.add(`${r},${c}`);
      }
    }
  }

  // 优先在边缘放置地雷
  const edgeCells = [];
  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      if (safeZone.has(`${row},${col}`)) continue;
      const isEdge = row === 0 || row === rows - 1 || col === 0 || col === cols - 1;
      if (isEdge) {
        edgeCells.push({ row, col });
      }
    }
  }

  // 随机打乱边缘单元格
  for (let i = edgeCells.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [edgeCells[i], edgeCells[j]] = [edgeCells[j], edgeCells[i]];
  }

  // 放置地雷
  let minesPlaced = 0;
  for (const { row, col } of edgeCells) {
    if (minesPlaced >= mineCount) break;
    board[row][col].isMine = true;
    minesPlaced++;
  }

  // 如果边缘不够，放在远离起始位置的地方
  if (minesPlaced < mineCount) {
    const remainingCells = [];
    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        if (safeZone.has(`${row},${col}`) || board[row][col].isMine) continue;
        const dist = Math.abs(row - startRow) + Math.abs(col - startCol);
        remainingCells.push({ row, col, dist });
      }
    }
    remainingCells.sort((a, b) => b.dist - a.dist);
    
    for (const { row, col } of remainingCells) {
      if (minesPlaced >= mineCount) break;
      board[row][col].isMine = true;
      minesPlaced++;
    }
  }

  // 计算邻居地雷数
  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      if (!board[row][col].isMine) {
        let count = 0;
        for (let dr = -1; dr <= 1; dr++) {
          for (let dc = -1; dc <= 1; dc++) {
            if (dr === 0 && dc === 0) continue;
            const newRow = row + dr;
            const newCol = col + dc;
            if (isValidCell(newRow, newCol, rows, cols) && board[newRow][newCol].isMine) {
              count++;
            }
          }
        }
        board[row][col].neighborMines = count;
      }
    }
  }

  return board;
};
