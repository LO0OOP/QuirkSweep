import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAdventureMode } from '@/hooks/useAdventureMode';
import AdventureBoard from '@/components/minesweeper/AdventureBoard';
import AdventureStatus from '@/components/minesweeper/AdventureStatus';
import { Button } from '@/components/ui/button';
import { 
  Heart, 
  Clock, 
  Zap, 
  ScanEye, 
  CloudFog, 
  Sword,
  ChevronLeft,
  Sparkles
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';

const DIFFICULTY_CONFIG = {
  medium: { name: '中级', icon: '⚡' },
  hard: { name: '高级', icon: '🔥' },
};

const SPECIAL_CELLS_INFO = [
  { type: 'life', name: '生命格', icon: <Heart className="w-5 h-5 text-red-500" />, desc: '生命值 +1（上限5）' },
  { type: 'time', name: '时间格', icon: <Clock className="w-5 h-5 text-blue-500" />, desc: '随机 +15秒 或 -10秒' },
  { type: 'lightning_yellow', name: '雷电格-黄', icon: <Zap className="w-5 h-5 text-yellow-500" />, desc: '十字形揭开并标记地雷' },
  { type: 'lightning_red', name: '雷电格-红', icon: <Zap className="w-5 h-5 text-red-600" />, desc: '连锁揭开上下左右四格' },
  { type: 'scanner', name: '扫雷器', icon: <ScanEye className="w-5 h-5 text-purple-500" />, desc: '标记周围8格中的地雷' },
  { type: 'fog', name: '迷雾格', icon: <CloudFog className="w-5 h-5 text-gray-500" />, desc: '5×5范围被迷雾遮盖15秒' },
];

const AdventureMode = () => {
  const [difficulty, setDifficulty] = useState('medium');
  const [showHelp, setShowHelp] = useState(false);
  const {
    board,
    gameStatus,
    flagCount,
    timeLeft,
    lives,
    fogCells,
    message,
    config,
    GAME_STATUS,
    initGame,
    revealCell,
    toggleFlag,
  } = useAdventureMode(difficulty);

  // 初始化游戏
  useEffect(() => {
    initGame();
  }, [difficulty, initGame]);

  // 根据棋盘大小调整格子尺寸
  const getCellSize = () => {
    const totalCells = config.rows * config.cols;
    if (totalCells > 400) return 'sm';
    if (totalCells > 200) return 'md';
    return 'lg';
  };

  const handleDifficultyChange = (newDifficulty) => {
    setDifficulty(newDifficulty);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-indigo-100 py-8 px-4">
      <div className="max-w-5xl mx-auto">
        {/* 标题栏 */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <Link to="/">
              <Button variant="outline" size="sm" className="gap-1">
                <ChevronLeft className="w-4 h-4" />
                返回
              </Button>
            </Link>
            <div>
              <h1 className="text-3xl font-bold text-gray-800 flex items-center gap-2">
                <Sword className="w-8 h-8 text-purple-600" />
                趣味闯关模式
              </h1>
              <p className="text-gray-600 text-sm">在时间耗尽前清除所有地雷！</p>
            </div>
          </div>
          <Button variant="outline" size="sm" onClick={() => setShowHelp(true)} className="gap-1">
            <Sparkles className="w-4 h-4" />
            玩法说明
          </Button>
        </div>

        {/* 难度选择 */}
        <div className="bg-white rounded-xl shadow-lg p-4 mb-6">
          <div className="flex items-center justify-between">
            <span className="text-gray-700 font-medium">选择难度：</span>
            <div className="flex gap-2">
              {Object.entries(DIFFICULTY_CONFIG).map(([key, { name, icon }]) => (
                <Button
                  key={key}
                  variant={difficulty === key ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => handleDifficultyChange(key)}
                  className="gap-1"
                >
                  <span>{icon}</span>
                  {name}
                </Button>
              ))}
            </div>
          </div>
          <div className="mt-3 text-sm text-gray-500 flex justify-between">
            <span>棋盘：{config.rows}×{config.cols} | 地雷：{config.mines} | 时间限制：{config.timeLimit}秒</span>
            <span>初始生命：{config.initialLives} | 特殊格子：{config.specialCellCount}个</span>
          </div>
        </div>

        {/* 游戏状态 */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
          <AdventureStatus
            gameStatus={gameStatus}
            timeLeft={timeLeft}
            flagCount={flagCount}
            mineCount={config.mines}
            lives={lives}
            onNewGame={initGame}
            GAME_STATUS={GAME_STATUS}
          />
        </div>

        {/* 游戏棋盘 */}
        <div className="bg-white rounded-xl shadow-lg p-6 relative">
          {/* 消息提示 */}
          {message && (
            <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-10">
              <div className="bg-primary text-primary-foreground px-6 py-3 rounded-full shadow-lg font-medium animate-bounce">
                {message}
              </div>
            </div>
          )}
          
          {/* 游戏结束遮罩 */}
          {(gameStatus === GAME_STATUS.WON || gameStatus === GAME_STATUS.LOST) && (
            <div className="absolute inset-0 bg-black/50 rounded-xl flex items-center justify-center z-20">
              <div className="bg-white p-8 rounded-2xl shadow-2xl text-center">
                <div className="text-6xl mb-4">
                  {gameStatus === GAME_STATUS.WON ? '🎉' : '💥'}
                </div>
                <h2 className="text-2xl font-bold mb-2">
                  {gameStatus === GAME_STATUS.WON ? '闯关成功！' : '闯关失败'}
                </h2>
                <p className="text-gray-600 mb-6">
                  {gameStatus === GAME_STATUS.WON 
                    ? `用时：${config.timeLimit - timeLeft}秒 | 剩余生命：${lives}` 
                    : lives === 0 ? '生命值耗尽' : '时间耗尽'}
                </p>
                <Button onClick={initGame} size="lg" className="gap-2">
                  <Sparkles className="w-5 h-5" />
                  再玩一次
                </Button>
              </div>
            </div>
          )}
          
          <div className="flex justify-center overflow-auto">
            {board.length > 0 && (
              <AdventureBoard
                board={board}
                fogCells={fogCells}
                onCellClick={revealCell}
                onCellRightClick={toggleFlag}
                cellSize={getCellSize()}
              />
            )}
          </div>
        </div>

        {/* 特殊格子图例 */}
        <div className="mt-6 bg-white rounded-xl shadow-lg p-4">
          <h3 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-yellow-500" />
            特殊格子图例
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {SPECIAL_CELLS_INFO.map(({ type, name, icon, desc }) => (
              <div key={type} className="flex items-center gap-3 p-2 bg-gray-50 rounded-lg">
                <div className="w-10 h-10 bg-white rounded-lg shadow-sm flex items-center justify-center">
                  {icon}
                </div>
                <div>
                  <div className="font-medium text-sm text-gray-900">{name}</div>
                  <div className="text-xs text-gray-500">{desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 玩法说明对话框 */}
      <Dialog open={showHelp} onOpenChange={setShowHelp}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sparkles className="w-6 h-6 text-yellow-500" />
              闯关模式玩法说明
            </DialogTitle>
            <DialogDescription>
              在限定时间内清除所有地雷即可通关！
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="bg-blue-50 p-4 rounded-lg">
              <h4 className="font-semibold text-blue-900 mb-2">🎯 基本规则</h4>
              <ul className="text-sm text-blue-800 space-y-1 list-disc list-inside">
                <li>中级初始 {config.initialLives} 点生命值，高级 3 点</li>
                <li>踩到地雷会扣除 1 点生命值，生命值归零则失败</li>
                <li>时间耗尽也会失败，要抓紧时间！</li>
              </ul>
            </div>
            
            <div className="bg-purple-50 p-4 rounded-lg">
              <h4 className="font-semibold text-purple-900 mb-2">✨ 特殊格子</h4>
              <ul className="text-sm text-purple-800 space-y-1 list-disc list-inside">
                <li><strong>生命格：</strong>回复 1 点生命（上限5）</li>
                <li><strong>时间格：</strong>60%概率+15秒，40%概率-10秒</li>
                <li><strong>雷电格-黄：</strong>直接触发，十字形揭开并标记地雷</li>
                <li><strong>雷电格-红：</strong>自动揭开上下左右四格</li>
                <li><strong>扫雷器：</strong>直接触发，标记周围8格中的地雷</li>
                <li><strong>迷雾格：</strong>5×5范围被迷雾遮盖15秒</li>
              </ul>
            </div>
            
            <div className="bg-amber-50 p-4 rounded-lg">
              <h4 className="font-semibold text-amber-900 mb-2">💡 小贴士</h4>
              <ul className="text-sm text-amber-800 space-y-1 list-disc list-inside">
                <li>合理规划路线，优先寻找特殊格子</li>
                <li>雷电格触发时若遇到地雷会优先扣除生命值</li>
                <li>特殊格子触发后会显示原本的数字</li>
              </ul>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdventureMode;
