import { Button } from '@/components/ui/button';
import { RotateCcw, Clock, Flag, Heart } from 'lucide-react';

const AdventureStatus = ({ 
  gameStatus, 
  timeLeft, 
  flagCount, 
  mineCount, 
  lives, 
  onNewGame, 
  GAME_STATUS,
}) => {
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const getStatusDisplay = () => {
    switch (gameStatus) {
      case GAME_STATUS.IDLE:
        return { text: '准备开始', color: 'text-blue-500' };
      case GAME_STATUS.PLAYING:
        return { text: '游戏进行中', color: 'text-green-500' };
      case GAME_STATUS.WON:
        return { text: '闯关成功！', color: 'text-green-600' };
      case GAME_STATUS.LOST:
        return { text: '闯关失败', color: 'text-red-500' };
      case GAME_STATUS.PAUSED:
        return { text: '游戏暂停', color: 'text-yellow-500' };
      default:
        return { text: '', color: '' };
    }
  };

  const status = getStatusDisplay();

  return (
    <div className="space-y-4">
      {/* 主要状态栏 */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-4 bg-gray-100 rounded-lg">
        <div className="flex items-center gap-4 flex-wrap">
          {/* 倒计时 */}
          <div className="flex items-center gap-2 px-3 py-1.5 bg-white rounded-md shadow-sm">
            <Clock className="w-4 h-4 text-gray-500" />
            <span className={`font-mono font-semibold text-lg ${timeLeft < 30 ? 'text-red-500 animate-pulse' : ''}`}>
              {formatTime(timeLeft)}
            </span>
          </div>
          
          {/* 地雷计数 */}
          <div className="flex items-center gap-2 px-3 py-1.5 bg-white rounded-md shadow-sm">
            <Flag className="w-4 h-4 text-red-500" />
            <span className="font-mono font-semibold text-lg">
              {mineCount - flagCount}
            </span>
          </div>

          {/* 生命值 */}
          <div className="flex items-center gap-2 px-3 py-1.5 bg-white rounded-md shadow-sm">
            <div className="flex items-center gap-1">
              {Array.from({ length: lives }).map((_, i) => (
                <Heart key={i} className="w-5 h-5 text-red-500 fill-red-500" />
              ))}
              {Array.from({ length: Math.max(0, 5 - lives) }).map((_, i) => (
                <Heart key={`empty-${i}`} className="w-5 h-5 text-gray-300" />
              ))}
            </div>
          </div>
        </div>

        <div className={`font-semibold ${status.color}`}>
          {status.text}
        </div>

        <Button onClick={() => onNewGame()} className="gap-2">
          <RotateCcw className="w-4 h-4" />
          新游戏
        </Button>
      </div>
    </div>
  );
};

export default AdventureStatus;
