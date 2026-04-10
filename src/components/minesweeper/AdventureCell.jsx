import { Bomb, Flag, HelpCircle, Heart, Clock, Zap, ScanEye, CloudFog } from 'lucide-react';

const AdventureCell = ({ cell, isFoggy, onClick, onRightClick, size = 'md' }) => {
  const sizeClasses = {
    sm: 'w-6 h-6 text-xs',
    md: 'w-8 h-8 text-sm',
    lg: 'w--10 text-base',
  };

  const getContent = () => {
    if (cell.state === 'flagged') {
      return <Flag className="w-4 h-4 text-red-500" />;
    }
    if (cell.state === 'questioned') {
      return <HelpCircle className="w-4 h-4 text-yellow-500" />;
    }
    if (cell.state === 'revealed') {
      if (cell.isMine) {
        return <Bomb className="w-4 h-4 text-gray-900" />;
      }
      
      // 优先显示数字（如果已触发特殊效果或需要显示数字）
      if (cell.neighborMines > 0) {
        const colors = {
          1: 'text-blue-500',
          2: 'text-green-500',
          3: 'text-red-500',
          4: 'text-purple-500',
          5: 'text-yellow-600',
          6: 'text-cyan-500',
          7: 'text-gray-700',
          8: 'text-gray-900',
        };
        return <span className={`font-bold ${colors[cell.neighborMines]}`}>{cell.neighborMines}</span>;
      }
      
      // 如果周围没有雷且是特殊格（未触发），显示特殊图标
      if (cell.specialType && cell.specialType !== 'none' && !cell.specialTriggered) {
        switch (cell.specialType) {
          case 'life':
            return <Heart className="w-5 h-5 text-red-500" />;
          case 'time':
            return <Clock className="w-5 h-5 text-blue-500" />;
          case 'lightning_yellow':
            return <Zap className="w-5 h-5 text-yellow-500" />;
          case 'lightning_red':
            return <Zap className="w-5 h-5 text-red-600" />;
          case 'scanner':
            return <ScanEye className="w-5 h-5 text-purple-500" />;
          case 'fog':
            return <CloudFog className="w-5 h-5 text-gray-500" />;
        }
      }
    }
    return null;
  };

  // 获取背景类 - 优先显示数字背景，特殊格背景作为次要显示
  const getBgClass = () => {
    if (isFoggy) {
      return 'bg-gray-600 cursor-not-allowed';
    }
    if (cell.state === 'revealed') {
      if (cell.isMine) {
        return 'bg-red-400';
      }
      
      // 如果已触发特殊效果，只显示普通揭示背景
      if (cell.specialTriggered) {
        return 'bg-gray-200';
      }
      
      // 如果周围有数字，优先显示数字背景（淡化的特殊色）
      if (cell.neighborMines > 0) {
        // 如果是特殊格，显示淡化的特殊背景色
        if (cell.specialType && cell.specialType !== 'none') {
          switch (cell.specialType) {
            case 'life':
              return 'bg-red-50';
            case 'time':
              return 'bg-blue-50';
            case 'lightning_yellow':
              return 'bg-yellow-50';
            case 'lightning_red':
              return 'bg-orange-50';
            case 'scanner':
              return 'bg-purple-50';
            case 'fog':
              return 'bg-gray-100';
          }
        }
        return 'bg-gray-200';
      }
      
      // 没有数字的特殊格显示明显背景色
      if (cell.specialType && cell.specialType !== 'none') {
        switch (cell.specialType) {
          case 'life':
            return 'bg-red-100';
          case 'time':
            return 'bg-blue-100';
          case 'lightning_yellow':
            return 'bg-yellow-100';
          case 'lightning_red':
            return 'bg-orange-100';
          case 'scanner':
            return 'bg-purple-100';
          case 'fog':
            return 'bg-gray-200';
        }
      }
      
      return 'bg-gray-200';
    }
    return 'bg-gray-300 hover:bg-gray-250 cursor-pointer';
  };

  const handleRightClick = (e) => {
    e.preventDefault();
    onRightClick();
  };

  return (
    <button
      className={`
        ${sizeClasses[size]}
        ${getBgClass()}
        flex items-center justify-center
        border border-gray-400
        transition-colors duration-150
        select-none
        rounded-sm
        relative
      `}
      onClick={onClick}
      onContextMenu={handleRightClick}
      disabled={cell.state === 'revealed' || isFoggy}
    >
      {/* 迷雾效果 */}
      {isFoggy && (
        <div className="absolute inset-0 bg-gray-600 flex items-center justify-center">
          <CloudFog className="w-5 h-5 text-gray-400" />
        </div>
      )}
      
      {/* 正常内容 */}
      {!isFoggy && getContent()}
    </button>
  );
};

export default AdventureCell;
