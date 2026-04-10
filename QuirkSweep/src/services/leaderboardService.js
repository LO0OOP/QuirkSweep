import { supabase } from '@/integrations/supabase/client';

/**
 * 排行榜服务
 * 处理云端排行榜的增删改查操作
 * 当Supabase不可用时，使用本地存储作为回退
 */

// 难度映射
const DIFFICULTY_MAP = {
  '9-9-10': 'easy',      // 简单
  '16-16-40': 'medium',  // 中等
  '16-30-99': 'hard',    // 困难
};

// 本地存储键名
const LOCAL_LEADERBOARD_KEY = 'minesweeper_leaderboard';

// 获取本地存储的排行榜
const getLocalLeaderboard = (difficulty, noGuessMode, limit = 50) => {
  try {
    const stored = localStorage.getItem(LOCAL_LEADERBOARD_KEY);
    if (!stored) {
      return [];
    }
    
    const allData = JSON.parse(stored);
    const filtered = allData.filter(r => r.difficulty === difficulty && r.no_guess_mode === noGuessMode);
    
    return filtered.sort((a, b) => a.time_seconds - b.time_seconds).slice(0, limit);
  } catch (error) {
    console.error('获取本地排行榜失败:', error);
    return [];
  }
};

// 保存到本地存储
const saveLocalLeaderboard = (data) => {
  try {
    localStorage.setItem(LOCAL_LEADERBOARD_KEY, JSON.stringify(data));
  } catch (error) {
    console.error('保存本地排行榜失败:', error);
  }
};

// 提交成绩到本地存储
const submitLocalScore = (record) => {
  try {
    const stored = localStorage.getItem(LOCAL_LEADERBOARD_KEY);
    let allData = stored ? JSON.parse(stored) : [];
    
    // 添加新记录
    const newRecord = {
      ...record,
      id: Date.now(),
      player_name: record.playerName || '匿名玩家',
      no_guess_mode: record.noGuessMode,
      time_seconds: record.timeSeconds,
      mine_count: record.mineCount,
      created_at: new Date().toISOString(),
    };
    
    allData.push(newRecord);
    
    // 只保留每种难度模式下前100名
    const difficulties = ['easy', 'medium', 'hard'];
    const modes = [true, false];
    let filteredData = [];
    
    for (const diff of difficulties) {
      for (const mode of modes) {
        const categoryData = allData
          .filter(r => r.difficulty === diff && r.no_guess_mode === mode)
          .sort((a, b) => a.time_seconds - b.time_seconds)
          .slice(0, 100);
        filteredData = [...filteredData, ...categoryData];
      }
    }
    
    saveLocalLeaderboard(filteredData);
    return { success: true, data: newRecord };
  } catch (error) {
    console.error('提交本地成绩失败:', error);
    return { success: false, error: error.message };
  }
};

// 检查是否可以进入本地排行榜前50
const canEnterLocalLeaderboard = (difficulty, noGuessMode, timeSeconds, topN = 50) => {
  const data = getLocalLeaderboard(difficulty, noGuessMode, topN);
  if (data.length < topN) return true;
  return timeSeconds < data[data.length - 1].time_seconds;
};

/**
 * 判断是否为标准难度
 * @param {number} rows - 行数
 * @param {number} cols - 列数
 * @param {number} mineCount - 地雷数
 * @returns {string|null} 难度标识或null
 */
export const getStandardDifficulty = (rows, cols, mineCount) => {
  const key = `${rows}-${cols}-${mineCount}`;
  return DIFFICULTY_MAP[key] || null;
};

/**
 * 获取排行榜数据
 * @param {string} difficulty - 难度 ('easy' | 'medium' | 'hard')
 * @param {boolean} noGuessMode - 是否无猜模式
 * @param {number} limit - 返回数量限制（默认50）
 * @returns {Promise<Array>} 排行榜数据
 */
export const getLeaderboard = async (difficulty, noGuessMode, limit = 50) => {
  try {
    // 先尝试从Supabase获取
    const { data, error } = await supabase
      .from('leaderboard')
      .select('*')
      .eq('difficulty', difficulty)
      .eq('no_guess_mode', noGuessMode)
      .order('time_seconds', { ascending: true })
      .order('created_at', { ascending: true })
      .limit(limit);

    if (error) {
      // Supabase错误，使用本地存储
      console.warn('Supabase获取失败，使用本地排行榜:', error);
      return getLocalLeaderboard(difficulty, noGuessMode, limit);
    }
    
    // 如果Supabase有数据，直接返回
    if (data && data.length > 0) {
      return data;
    }
    
    // Supabase没有数据，尝试从本地存储获取
    const localData = getLocalLeaderboard(difficulty, noGuessMode, limit);
    return localData;
  } catch (error) {
    console.error('获取排行榜失败:', error);
    // 出错时使用本地存储
    return getLocalLeaderboard(difficulty, noGuessMode, limit);
  }
};

/**
 * 检查成绩是否可以进入排行榜前N名
 * @param {string} difficulty - 难度
 * @param {boolean} noGuessMode - 是否无猜模式
 * @param {number} timeSeconds - 用时（秒）
 * @param {number} topN - 前N名（默认50）
 * @returns {Promise<boolean>} 是否可以上榜
 */
export const canEnterLeaderboard = async (difficulty, noGuessMode, timeSeconds, topN = 50) => {
  try {
    // 先尝试从Supabase获取
    const { count, error: countError } = await supabase
      .from('leaderboard')
      .select('*', { count: 'exact', head: true })
      .eq('difficulty', difficulty)
      .eq('no_guess_mode', noGuessMode);

    if (countError) {
      // Supabase错误，使用本地存储
      return canEnterLocalLeaderboard(difficulty, noGuessMode, timeSeconds, topN);
    }

    // 如果记录数不足topN条，可以直接上榜
    if (count < topN) return true;

    // 获取第topN名的成绩
    const { data, error: rankError } = await supabase
      .from('leaderboard')
      .select('time_seconds')
      .eq('difficulty', difficulty)
      .eq('no_guess_mode', noGuessMode)
      .order('time_seconds', { ascending: true })
      .order('created_at', { ascending: true })
      .range(topN - 1, topN - 1)
      .maybeSingle();

    if (rankError) {
      // 出错时使用本地存储
      return canEnterLocalLeaderboard(difficulty, noGuessMode, timeSeconds, topN);
    }

    // 如果没有第topN名数据，说明可以上榜
    if (!data) return true;

    // 用时更短可以上榜（时间越短越好）
    return timeSeconds < data.time_seconds;
  } catch (error) {
    console.error('检查排行榜资格失败:', error);
    // 出错时使用本地存储
    return canEnterLocalLeaderboard(difficulty, noGuessMode, timeSeconds, topN);
  }
};

/**
 * 提交成绩到排行榜
 * @param {Object} record - 成绩记录
 * @param {string} record.playerName - 玩家昵称
 * @param {string} record.difficulty - 难度
 * @param {boolean} record.noGuessMode - 是否无猜模式
 * @param {number} record.timeSeconds - 用时
 * @param {number} record.rows - 行数
 * @param {number} record.cols - 列数
 * @param {number} record.mineCount - 地雷数
 * @returns {Promise<{success: boolean, error?: string}>} 提交结果
 */
export const submitScore = async ({
  playerName,
  difficulty,
  noGuessMode,
  timeSeconds,
  rows,
  cols,
  mineCount,
}) => {
  try {
    // 先尝试提交到Supabase
    const { data, error } = await supabase.from('leaderboard').insert({
      player_name: playerName.trim() || '匿名玩家',
      difficulty,
      no_guess_mode: noGuessMode,
      time_seconds: timeSeconds,
      rows,
      cols,
      mine_count: mineCount,
    }).select();

    if (error) {
      // Supabase错误，使用本地存储
      console.warn('Supabase提交失败，使用本地存储:', error);
      return submitLocalScore({
        playerName,
        difficulty,
        noGuessMode,
        timeSeconds,
        rows,
        cols,
        mineCount,
      });
    }

    return { success: true, data };
  } catch (error) {
    console.error('提交成绩失败:', error);
    // 出错时使用本地存储
    return submitLocalScore({
      playerName,
      difficulty,
      noGuessMode,
      timeSeconds,
      rows,
      cols,
      mineCount,
    });
  }
};

/**
 * 格式化时间显示
 * @param {number} seconds - 秒数
 * @returns {string} 格式化后的时间
 */
export const formatTime = (seconds) => {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
};

/**
 * 获取难度中文名称
 * @param {string} difficulty - 难度标识
 * @returns {string} 中文名称
 */
export const getDifficultyName = (difficulty) => {
  const names = {
    easy: '简单',
    medium: '中等',
    hard: '困难',
  };
  return names[difficulty] || difficulty;
};
