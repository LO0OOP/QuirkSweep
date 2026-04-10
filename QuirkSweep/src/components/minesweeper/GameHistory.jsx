import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { History, Trophy, Trash2, Clock, Shield } from 'lucide-react';

const GameHistory = ({ history, onClearHistory }) => {
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const wins = history.filter(h => h.result === 'win');

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <History className="w-4 h-4" />
          历史记录
          {wins.length > 0 && (
            <span className="ml-1 text-xs bg-primary text-primary-foreground px-1.5 py-0.5 rounded-full">
              {wins.length}
            </span>
          )}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Trophy className="w-5 h-5 text-yellow-500" />
            游戏历史
          </DialogTitle>
        </DialogHeader>
        
        <div className="py-4">
          {history.length === 0 ? (
            <div className="text-center text-muted-foreground py-8">
              暂无游戏记录
            </div>
          ) : (
            <>
              <div className="flex justify-between items-center mb-4 text-sm text-muted-foreground">
                <span>共 {history.length} 局游戏</span>
                <span>获胜 {wins.length} 局</span>
              </div>
              
              <ScrollArea className="h-[300px] pr-4">
                <div className="space-y-2">
                  {history.map((record) => (
                    <div
                      key={record.id}
                      className={`
                        flex items-center justify-between p-3 rounded-lg border
                        ${record.result === 'win' ? 'bg-green-50 border-green-200' : 'bg-gray-50 border-gray-200'}
                      `}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`
                          w-8 h-8 rounded-full flex items-center justify-center
                          ${record.result === 'win' ? 'bg-green-100 text-green-600' : 'bg-gray-200 text-gray-600'}
                        `}>
                          {record.result === 'win' ? (
                            <Trophy className="w-4 h-4" />
                          ) : (
                            <span className="text-xs">败</span>
                          )}
                        </div>
                        <div>
                          <div className="font-medium text-sm flex items-center gap-1">
                            {record.rows}×{record.cols} | {record.mineCount} 雷
                            {record.noGuessMode && (
                              <Shield className="w-3 h-3 text-blue-500" title="无猜模式" />
                            )}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {record.date}
                          </div>
                        </div>
                      </div>
                      {record.result === 'win' && (
                        <div className="flex items-center gap-1 text-green-600 font-semibold">
                          <Clock className="w-4 h-4" />
                          {formatTime(record.time)}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </ScrollArea>

              <div className="mt-4 flex justify-end">
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={onClearHistory}
                  className="gap-2"
                >
                  <Trash2 className="w-4 h-4" />
                  清空记录
                </Button>
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default GameHistory;
