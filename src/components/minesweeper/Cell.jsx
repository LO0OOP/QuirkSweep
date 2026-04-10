import { Bomb, Flag, HelpCircle } from 'lucide-react';

const Cell = ({ cell, onClick, onRightClick, size = 'md' }) => {
  const sizeClasses = {
    sm: 'w-6 h-6 text-xs',
    md: 'w-8 h-8 text-sm',
    lg: 'w-10 h-10 text-base',
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
    }
    return null;
  };

  const getBgClass = () => {
    if (cell.state === 'revealed') {
      if (cell.isMine) {
        return 'bg-red-400';
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
      `}
      onClick={onClick}
      onContextMenu={handleRightClick}
      disabled={cell.state === 'revealed'}
    >
      {getContent()}
    </button>
  );
};

export default Cell;
