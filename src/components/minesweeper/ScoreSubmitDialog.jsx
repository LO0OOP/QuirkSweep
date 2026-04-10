import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Trophy, Loader2, AlertCircle, CheckCircle } from 'lucide-react';
import {
  submitScore,
  formatTime,
  getDifficultyName,
} from '@/services/leaderboardService';

const ScoreSubmitDialog = ({
  isOpen,
  onClose,
  onSubmitted,
  difficulty,
  noGuessMode,
  timeSeconds,
  rows,
  cols,
  mineCount,
}) => {
  const [playerName, setPlayerName] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState(null); // 'success' | 'error' | null

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!playerName.trim() || submitting) return;

    setSubmitting(true);
    setResult(null);

    const response = await submitScore({
      playerName: playerName.trim(),
      difficulty,
      noGuessMode,
      timeSeconds,
      rows,
      cols,
      mineCount,
    });

    setSubmitting(false);

    if (response.success) {
      setResult('success');
      // 延迟关闭，让用户看到成功提示
      setTimeout(() => {
        onSubmitted();
        onClose();
        setResult(null);
        setPlayerName('');
      }, 1500);
    } else {
      setResult('error');
    }
  };

  const handleSkip = () => {
    setResult(null);
    setPlayerName('');
    onClose();
  };

  const modeText = noGuessMode ? '无猜' : '有猜';

  return (
    <Dialog open={isOpen} onOpenChange={(open) => {
      if (!open) handleSkip();
    }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Trophy className="w-6 h-6 text-yellow-500" />
            恭喜进入排行榜！
          </DialogTitle>
          <DialogDescription>
            你的成绩进入了 {getDifficultyName(difficulty)} {modeText}模式 的前50名
          </DialogDescription>
        </DialogHeader>

        <div className="py-4">
          {/* 成绩展示 */}
          <div className="bg-gradient-to-r from-yellow-50 to-amber-50 rounded-lg p-4 mb-6 border border-yellow-100">
            <div className="text-center">
              <div className="text-sm text-gray-500 mb-1">你的成绩</div>
              <div className="text-4xl font-bold text-primary font-mono">
                {formatTime(timeSeconds)}
              </div>
              <div className="text-sm text-gray-500 mt-2">
                {rows}×{cols} · {mineCount}雷 · {modeText}模式
              </div>
            </div>
          </div>

          {/* 成功提示 */}
          {result === 'success' && (
            <div className="flex items-center gap-2 p-4 mb-4 bg-green-50 text-green-700 rounded-lg border border-green-200">
              <CheckCircle className="w-5 h-5" />
              <span>成绩提交成功！</span>
            </div>
          )}

          {/* 错误提示 */}
          {result === 'error' && (
            <div className="flex items-center gap-2 p-4 mb-4 bg-red-50 text-red-700 rounded-lg border border-red-200">
              <AlertCircle className="w-5 h-5" />
              <span>提交失败，请检查网络后重试</span>
            </div>
          )}

          {/* 输入表单 */}
          {!result && (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="playerName">
                  输入你的昵称 <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="playerName"
                  placeholder="请输入昵称（最多20个字符）"
                  value={playerName}
                  onChange={(e) => setPlayerName(e.target.value.slice(0, 20))}
                  maxLength={20}
                  autoFocus
                  className="text-lg"
                />
                <p className="text-xs text-gray-400">
                  昵称将显示在排行榜上，其他玩家可以看到
                </p>
              </div>

              <div className="flex gap-3 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleSkip}
                  className="flex-1"
                >
                  跳过
                </Button>
                <Button
                  type="submit"
                  disabled={!playerName.trim() || submitting}
                  className="flex-1 gap-2"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      提交中...
                    </>
                  ) : (
                    <>
                      <Trophy className="w-4 h-4" />
                      提交成绩
                    </>
                  )}
                </Button>
              </div>
            </form>
          )}

          {/* 成功后的确认按钮 */}
          {result === 'success' && (
            <div className="flex justify-center">
              <Button onClick={() => {
                onSubmitted();
                onClose();
                setResult(null);
                setPlayerName('');
              }}>
                查看排行榜
              </Button>
            </div>
          )}

          {/* 失败后的重试按钮 */}
          {result === 'error' && (
            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={handleSkip}
                className="flex-1"
              >
                跳过
              </Button>
              <Button
                onClick={() => setResult(null)}
                className="flex-1"
              >
                重试
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ScoreSubmitDialog;
