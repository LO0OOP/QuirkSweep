import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useMinesweeper } from '@/hooks/useMinesweeper';
import GameBoard from '@/components/minesweeper/GameBoard';
import GameStatus from '@/components/minesweeper/GameStatus';
import GameSettings from '@/components/minesweeper/GameSettings';
import GameHistory from '@/components/minesweeper/GameHistory';
import Leaderboard from '@/components/minesweeper/Leaderboard';
import ScoreSubmitDialog from '@/components/minesweeper/ScoreSubmitDialog';
import { Shield, ChevronLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';

const Minesweeper = () => {
  const [leaderboardRefreshTrigger, setLeaderboardRefreshTrigger] = useState(0);
  const {
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
  } = useMinesweeper();

  // 初始化游戏
  useEffect(() => {
    initGame();
  }, [initGame]);

  const handleSettingsChange = (newSettings) => {
    setSettings(newSettings);
  };

  // 成绩提交成功后的回调
  const handleScoreSubmitted = () => {
    // 触发排行榜刷新
    setLeaderboardRefreshTrigger(prev => prev + 1);
  };

  // 根据棋盘大小调整格子尺寸
  const getCellSize = () => {
    const totalCells = settings.rows * settings.cols;
    if (totalCells > 400) return 'sm';
    if (totalCells > 200) return 'md';
    return 'lg';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        {/* 标题栏 */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <Link to="/">
              <Button variant="outline" size="sm" className="gap-1">
                <ChevronLeft className="w-4 h-4" />
                返回
              </Button>
            </Link>
            <div className="text-center">
              <h1 className="text-4xl font-bold text-gray-800 mb-2">扫雷游戏</h1>
              <p className="text-gray-600">左键揭开，右键标记/取消标记</p>
            </div>
          </div>
          {settings.noGuessMode && (
            <div className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-medium">
              <Shield className="w-4 h-4" />
              无猜模式已开启
            </div>
          )}
        </div>

        {/* 游戏控制区 */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
          {/* 工具栏 */}
          <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
            <div className="flex gap-2 flex-wrap">
              <GameSettings
                settings={settings}
                onSettingsChange={handleSettingsChange}
                onNewGame={initGame}
              />
              <GameHistory
                history={history}
                onClearHistory={clearHistory}
              />
              <Leaderboard refreshTrigger={leaderboardRefreshTrigger} />
            </div>
            <div className="text-sm text-muted-foreground flex items-center gap-2">
              {settings.rows}×{settings.cols} | {settings.mineCount} 颗地雷
              {settings.noGuessMode && (
                <Shield className="w-4 h-4 text-blue-500" />
              )}
            </div>
          </div>

          {/* 游戏状态 */}
          <GameStatus
            gameStatus={gameStatus}
            timer={timer}
            flagCount={flagCount}
            mineCount={settings.mineCount}
            onNewGame={initGame}
            GAME_STATUS={GAME_STATUS}
          />
        </div>

        {/* 游戏棋盘 */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <div className="flex justify-center overflow-auto">
            {board.length > 0 && (
              <GameBoard
                board={board}
                onCellClick={revealCell}
                onCellRightClick={toggleFlag}
                cellSize={getCellSize()}
              />
            )}
          </div>
        </div>

        {/* 游戏说明 */}
        <div className="mt-6 text-center text-sm text-gray-500">
          <p>💡 提示：{settings.noGuessMode ? '无猜模式下所有谜题都可通过逻辑推理解决' : '第一次点击永远不会踩到地雷'}</p>
        </div>
      </div>

      {/* 成绩提交对话框 */}
      {pendingScoreSubmit && (
        <ScoreSubmitDialog
          isOpen={!!pendingScoreSubmit}
          onClose={clearPendingScoreSubmit}
          onSubmitted={handleScoreSubmitted}
          {...pendingScoreSubmit}
        />
      )}
    </div>
  );
};

export default Minesweeper;
