-- ============================================
-- 数据库迁移: 创建排行榜表
-- 文件名: create_leaderboard_table.sql
-- 变更说明: 创建扫雷游戏云端排行榜表
-- ============================================

-- 创建排行榜表
CREATE TABLE IF NOT EXISTS public.leaderboard (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  player_name TEXT NOT NULL DEFAULT '匿名玩家',
  difficulty TEXT NOT NULL CHECK (difficulty IN ('easy', 'medium', 'hard')),
  no_guess_mode BOOLEAN NOT NULL DEFAULT false,
  time_seconds INTEGER NOT NULL CHECK (time_seconds > 0),
  rows INTEGER NOT NULL,
  cols INTEGER NOT NULL,
  mine_count INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 创建索引以优化查询性能
CREATE INDEX IF NOT EXISTS idx_leaderboard_difficulty_no_guess 
  ON public.leaderboard(difficulty, no_guess_mode, time_seconds ASC);

-- 启用 RLS（Row Level Security）
ALTER TABLE public.leaderboard ENABLE ROW LEVEL SECURITY;

-- 允许任何人读取排行榜
CREATE POLICY "Allow anonymous read access" 
  ON public.leaderboard FOR SELECT USING (true);

-- 允许任何人插入新记录（匿名排行榜无需认证）
CREATE POLICY "Allow anonymous insert" 
  ON public.leaderboard FOR INSERT WITH CHECK (true);
