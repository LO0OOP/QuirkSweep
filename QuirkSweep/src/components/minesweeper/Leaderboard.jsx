import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Trophy, Clock, Medal, Loader2, RefreshCw, Database, CloudOff } from 'lucide-react';
import {
  getLeaderboard,
  formatTime,
  getDifficultyName,
} from '@/services/leaderboardService';

// 难度配置
const DIFFICULTIES = [
  { key: 'easy', name: '简单', icon: '🌱' },
  { key: 'medium', name: '中等', icon: '⚡' },
  { key: 'hard', name: '困难', icon: '🔥' },
];

// 模式配置
const MODES = [
  { key: false, name: '有猜', color: 'bg-amber-50 text-amber-700 border-amber-200' },
  { key: true, name: '无猜', color: 'bg-blue-50 text-blue-700 border-blue-200' },
];

const Leaderboard = ({ refreshTrigger }) => {
  const [open, setOpen] = useState(false);
  const [activeDifficulty, setActiveDifficulty] = useState('easy');
  const [activeNoGuess, setActiveNoGuess] = useState(false);
  const [leaderboardData, setLeaderboardData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [dataSource, setDataSource] = useState('supabase'); // 'supabase' | 'local'

  const fetchLeaderboard = useCallback(async () => {
    setLoading(true);
    try {
      // 获取前50名
      const data = await getLeaderboard(activeDifficulty, activeNoGuess, 50);
      setLeaderboardData(data);
      
      // 判断数据来源（通过检查第一条记录是否有id特征来判断）
      if (data.length > 0 && typeof data[0].id === 'number' && data[0].id > 1000000000) {
        setDataSource('local');
      } else {
        setDataSource('supabase');
      }
    } catch (error) {
      console.error('获取排行榜失败:', error);
      setLeaderboardData([]);
    } finally {
      setLoading(false);
    }
  }, [activeDifficulty, activeNoGuess]);

  // 对话框打开时或参数变化时获取数据
  useEffect(() => {
    if (open) {
      fetchLeaderboard();
    }
  }, [open, fetchLeaderboard]);

  // 当 refreshTrigger 变化时刷新数据（用于提交成绩后刷新）
  useEffect(() => {
    if (open && refreshTrigger) {
      fetchLeaderboard();
    }
  }, [refreshTrigger, open, fetchLeaderboard]);

  const getRankIcon = (index) => {
    if (index === 0) return <Medal className="w-5 h-5 text-yellow-500" />;
    if (index === 1) return <Medal className="w-5 h-5 text-gray-400" />;
    if (index === 2) return <Medal className="w-5 h-5 text-amber-600" />;
    return <span className="w-5 h-5 flex items-center justify-center text-sm font-medium text-gray-500">{index + 1}</span>;
  };

  const currentMode = MODES.find(m => m.key === activeNoGuess);
  const currentDifficulty = DIFFICULTIES.find(d => d.key === activeDifficulty);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <Trophy className="w-4 h-4 text-yellow-500" />
          排行榜
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Trophy className="w-6 h-6 text-yellow-500" />
            云端排行榜
          </DialogTitle>
        </DialogHeader>

        {/* 难度选择 */}
        <Tabs value={activeDifficulty} onValueChange={setActiveDifficulty} className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            {DIFFICULTIES.map(diff => (
              <TabsTrigger key={diff.key} value={diff.key} className="gap-1">
                <span>{diff.icon}</span>
                {diff.name}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>

        {/* 模式切换 */}
        <div className="flex justify-center">
          <div className="inline-flex rounded-lg border p-1 bg-gray-50">
            {MODES.map(mode => (
              <button
                key={mode.key ? 'no-guess' : 'normal'}
                onClick={() => setActiveNoGuess(mode.key)}
                className={`
                  px-4 py-2 rounded-md text-sm font-medium transition-all
                  ${activeNoGuess === mode.key 
                    ? 'bg-white shadow-sm ring-1 ring-gray-200' 
                    : 'text-gray-500 hover:text-gray-700'}
                `}
              >
                {mode.name}模式
              </button>
            ))}
          </div>
        </div>

        {/* 排行榜标题 */}
        <div className={`
          flex items-center justify-center gap-2 py-2 px-4 rounded-lg border
          ${currentMode.color}
        `}>
          <span className="text-lg">{currentDifficulty.icon}</span>
          <span className="font-semibold">
            {getDifficultyName(activeDifficulty)} · {currentMode.name}模式
          </span>
        </div>

        {/* 刷新按钮 */}
        <div className="flex justify-end">
          <Button
            variant="ghost"
            size="sm"
            onClick={fetchLeaderboard}
            disabled={loading}
            className="gap-2"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            刷新
          </Button>
        </div>

        {/* 排行榜列表 */}
        <div className="flex-1 min-h-0">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-6 h-6 animate-spin text-primary" />
              <span className="ml-2 text-gray-500">加载中...</span>
            </div>
          ) : (
            leaderboardData.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <Trophy className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                <p>暂无 {getDifficultyName(activeDifficulty)} {currentMode.name}模式 的记录</p>
                <p className="text-sm mt-1">快来成为第一个上榜的玩家吧！</p>
                {dataSource === 'local' && (
                  <div className="mt-4 p-3 bg-amber-50 rounded-lg border border-amber-200 inline-flex items-center gap-2 text-sm text-amber-700">
                    <CloudOff className="w-4 h-4" />
                    <span>当前使用本地存储模式</span>
                  </div>
                )}
              </div>
            ) : (
              <ScrollArea className="h-[350px] pr-4">
                <div className="space-y-1">
                  {leaderboardData.map((record, index) => (
                    <div
                      key={record.id}
                      className={`
                        flex items-center gap-3 p-3 rounded-lg border transition-colors
                        ${index < 3 ? 'bg-gradient-to-r from-yellow-50/50 to-transparent border-yellow-100' : 'bg-white border-gray-100 hover:bg-gray-50'}
                      `}
                    >
                      {/* 排名 */}
                      <div className="flex-shrink-0 w-8 flex justify-center">
                        {getRankIcon(index)}
                      </div>

                      {/* 玩家名 */}
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-gray-900 truncate">
                          {record.player_name}
                        </div>
                        <div className="text-xs text-gray-400">
                          {new Date(record.created_at).toLocaleDateString('zh-CN')}
                        </div>
                      </div>

                      {/* 用时 */}
                      <div className="flex items-center gap-1 text-primary font-semibold">
                        <Clock className="w-4 h-4" />
                        {formatTime(record.time_seconds)}
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            )
          )}
        </div>

        {/* 底部提示 */}
        <div className="text-center text-xs text-gray-400 pt-2 border-t flex items-center justify-center gap-4">
          <span>仅标准难度（9×9、16×16、16×30）支持云端排行榜 · 显示前50名</span>
          {dataSource === 'local' && leaderboardData.length > 0 && (
            <span className="inline-flex items-center gap-1 text-amber-600">
              <Database className="w-3 h-3" />
              本地数据
            </span>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default Leaderboard;
