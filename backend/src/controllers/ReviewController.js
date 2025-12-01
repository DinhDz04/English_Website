// backend/src/controllers/ReviewController.js
const { supabase } = require("../utils/supabase");
const AIService = require('../services/AIService');

class ReviewController {
  

  static async getLearnedWords(req, res) {
    try {
      const userId = req.user.id;
      const { page = 1, limit = 50, search = '' } = req.query;
      const offset = (page - 1) * limit;

      // Lấy tổng số từ đã học
      const { count, error: countError } = await supabase
        .from('user_word_progress')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)
        .eq('is_learned', true);

      if (countError) throw countError;

      // Lấy danh sách từ đã học với thông tin từ
      let query = supabase
        .from('user_word_progress')
        .select(`
          id,
          times_seen,
          times_correct,
          mastery_level,
          last_reviewed_at,
          learned_at,
          words:word_id (
            id,
            word,
            meaning,
            pronunciation,
            example,
            audio_url,
            topics:topic_id (
              id,
              name
            )
          )
        `)
        .eq('user_id', userId)
        .eq('is_learned', true)
        .order('last_reviewed_at', { ascending: false })
        .range(offset, offset + limit - 1);

      // Thêm search nếu có
      if (search) {
        query = query.ilike('words.word', `%${search}%`);
      }

      const { data: progress, error } = await query;

      if (error) throw error;

      // Format dữ liệu trả về
      const learnedWords = progress
        .filter(item => item.words)
        .map(item => ({
          progress_id: item.id,
          word_id: item.words.id,
          word: item.words.word,
          meaning: item.words.meaning,
          pronunciation: item.words.pronunciation,
          example: item.words.example,
          audio_url: item.words.audio_url,
          topic: item.words.topics?.name || 'General',
          times_seen: item.times_seen,
          times_correct: item.times_correct,
          mastery_level: item.mastery_level,
          accuracy: item.times_seen > 0 ? Math.round((item.times_correct / item.times_seen) * 100) : 0,
          last_reviewed_at: item.last_reviewed_at,
          learned_at: item.learned_at
        }));

      res.json({
        words: learnedWords,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: count,
          total_pages: Math.ceil(count / limit)
        }
      });

    } catch (error) {
      console.error('Error getting learned words:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

}

module.exports = ReviewController;