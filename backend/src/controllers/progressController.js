// backend/src/controllers/progressController.js
const { supabase } = require("../utils/supabase");

class ProgressController {
  // Get overview progress
  static async getOverview(req, res) {
    try {
      const userId = req.user.id;

      // Get overall stats
      const { data: overallStats, error: statsError } = await supabase
        .from("user_progress")
        .select(`
          words_learned,
          words_mastered,
          accuracy,
          total_time_spent
        `)
        .eq("user_id", userId)
        .single();

      // Get level progress
      const { data: levelProgress, error: levelError } = await supabase
        .from("user_level_progress")
        .select(`
          level:levels(name, level_number),
          completed_topics,
          total_topics,
          is_completed
        `)
        .eq("user_id", userId)
        .order("levels.level_number", { ascending: true });

      // Get recent activity
      const { data: recentActivity, error: activityError } = await supabase
        .from("learning_sessions")
        .select(`
          topic:topics(name),
          correct_answers,
          total_questions,
          accuracy,
          completed_at
        `)
        .eq("user_id", userId)
        .order("completed_at", { ascending: false })
        .limit(5);

      if (statsError && statsError.code !== 'PGRST116') throw statsError;

      res.json({
        success: true,
        overview: {
          stats: overallStats || {
            words_learned: 0,
            words_mastered: 0,
            accuracy: 0,
            total_time_spent: 0
          },
          level_progress: levelProgress || [],
          recent_activity: recentActivity || []
        }
      });
    } catch (error) {
      console.error('Get progress overview error:', error);
      res.status(500).json({
        success: false,
        message: 'Lỗi khi lấy tổng quan tiến độ'
      });
    }
  }

  // Get topic progress
  static async getTopicProgress(req, res) {
    try {
      const userId = req.user.id;
      const { topicId } = req.params;

      const { data: progress, error } = await supabase
        .from("user_topic_progress")
        .select(`
          words_learned,
          mastery_level,
          is_completed,
          last_learned_at,
          topic:topics(
            name,
            description,
            word_count,
            level:levels(name)
          )
        `)
        .eq("user_id", userId)
        .eq("topic_id", topicId)
        .single();

      if (error && error.code !== 'PGRST116') throw error;

      res.json({
        success: true,
        progress: progress || {
          words_learned: 0,
          mastery_level: 0,
          is_completed: false,
          last_learned_at: null,
          topic: null
        }
      });
    } catch (error) {
      console.error('Get topic progress error:', error);
      res.status(500).json({
        success: false,
        message: 'Lỗi khi lấy tiến độ topic'
      });
    }
  }

  // Get word progress
  static async getWordProgress(req, res) {
    try {
      const userId = req.user.id;
      const { page = 1, limit = 50, mastery } = req.query;

      const from = (page - 1) * limit;
      const to = from + limit - 1;

      let query = supabase
        .from("user_word_progress")
        .select(`
          word:words(
            word,
            meaning,
            example,
            difficulty
          ),
          times_seen,
          times_correct,
          mastery_level,
          last_reviewed_at
        `, { count: 'exact' })
        .eq("user_id", userId);

      if (mastery) {
        query = query.eq("mastery_level", parseInt(mastery));
      }

      const { data: wordProgress, error, count } = await query
        .order("last_reviewed_at", { ascending: false })
        .range(from, to);

      if (error) throw error;

      // Calculate mastery distribution
      const { data: masteryStats } = await supabase
        .from("user_word_progress")
        .select("mastery_level")
        .eq("user_id", userId);

      const masteryDistribution = {
        0: 0, 1: 0, 2: 0, 3: 0, 4: 0, 5: 0
      };

      masteryStats?.forEach(stat => {
        masteryDistribution[stat.mastery_level] = (masteryDistribution[stat.mastery_level] || 0) + 1;
      });

      res.json({
        success: true,
        word_progress: wordProgress || [],
        mastery_distribution: masteryDistribution,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: count
        }
      });
    } catch (error) {
      console.error('Get word progress error:', error);
      res.status(500).json({
        success: false,
        message: 'Lỗi khi lấy tiến độ từ vựng'
      });
    }
  }

  // Get detailed statistics
  static async getStatistics(req, res) {
    try {
      const userId = req.user.id;

      // Weekly activity
      const oneWeekAgo = new Date();
      oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

      const { data: weeklySessions, error: weeklyError } = await supabase
        .from("learning_sessions")
        .select("completed_at, words_learned, time_spent")
        .eq("user_id", userId)
        .gte("completed_at", oneWeekAgo.toISOString())
        .order("completed_at", { ascending: true });

      // Most practiced topics
      const { data: topTopics, error: topicsError } = await supabase
        .from("learning_sessions")
        .select(`
          topic:topics(name),
          count:total_questions
        `)
        .eq("user_id", userId)
        .order("total_questions", { ascending: false })
        .limit(5);

      // Accuracy over time
      const { data: accuracyTrend, error: accuracyError } = await supabase
        .from("learning_sessions")
        .select("completed_at, accuracy")
        .eq("user_id", userId)
        .order("completed_at", { ascending: true })
        .limit(30);

      if (weeklyError) throw weeklyError;

      res.json({
        success: true,
        statistics: {
          weekly_activity: weeklySessions || [],
          top_topics: topTopics || [],
          accuracy_trend: accuracyTrend || []
        }
      });
    } catch (error) {
      console.error('Get statistics error:', error);
      res.status(500).json({
        success: false,
        message: 'Lỗi khi lấy thống kê chi tiết'
      });
    }
  }
}

module.exports = ProgressController;