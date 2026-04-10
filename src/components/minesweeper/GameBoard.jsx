import Cell from './Cell';

const GameBoard = ({ board, onCellClick, onCellRightClick, cellSize = 'md' }) => {
  if (!board || board.length === 0) return null;

  return (
    <div 
      className="inline-grid gap-0.5 p-2 bg-gray-400 rounded-lg"
      style={{
        gridTemplateColumns: `repeat(${board[0].length}, minmax(0, 1fr))`,
      }}
    >
      {board.map((row, rowIndex) => 
        row.map((cell, colIndex) => (
          <Cell
            key={`${rowIndex}-${colIndex}`}
            cell={cell}
            onClick={() => onCellClick(rowIndex, colIndex)}
            onRightClick={() => onCellRightClick(rowIndex, colIndex)}
            size={cellSize}
          />
        ))
      )}
    </div>
  );
};

export default GameBoard;
