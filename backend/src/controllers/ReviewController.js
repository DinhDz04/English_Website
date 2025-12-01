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

   static async createReviewSession(req, res) {
    try {
      const userId = req.user.id;
      const { name, word_ids, exercise_count, difficulty = 'medium' } = req.body;

      // Validate input
      if (!name || !word_ids || !Array.isArray(word_ids) || word_ids.length === 0) {
        return res.status(400).json({ error: 'Tên và danh sách từ vựng là bắt buộc' });
      }

      if (exercise_count < 1 || exercise_count > 50) {
        return res.status(400).json({ error: 'Số câu hỏi phải từ 1 đến 50' });
      }

      // Lấy thông tin các từ được chọn
      const { data: words, error: wordsError } = await supabase
        .from('words')
        .select('id, word, meaning, example, pronunciation, audio_url')
        .in('id', word_ids);

      if (wordsError) throw wordsError;

      if (words.length === 0) {
        return res.status(400).json({ error: 'Không tìm thấy từ vựng' });
      }

      // Tạo bài tập trắc nghiệm cho mỗi từ
      const exercises = [];
      const usedWords = new Set();

      for (let i = 0; i < Math.min(exercise_count, words.length); i++) {
        const word = words[i];
        
        // Tạo câu hỏi trắc nghiệm
        const exercise = await AIService.generateExercise(
          word.word,
          word.meaning,
          word.example,
          word.pronunciation,
          'multiple_choice', // Chỉ sử dụng trắc nghiệm
          words.filter(w => w.id !== word.id) // Các từ còn lại làm phương án sai
        );

        exercises.push({
          ...exercise,
          word_id: word.id,
          type: 'multiple_choice' // Đảm bảo chỉ trắc nghiệm
        });

        usedWords.add(word.id);
      }

      // Tạo session trong database
      const sessionData = {
        user_id: userId,
        name,
        word_ids: Array.from(usedWords),
        total_words: usedWords.size,
        exercise_count: exercises.length,
        exercise_type: 'multiple_choice',
        difficulty,
        status: 'active',
        exercises: exercises,
        created_at: new Date().toISOString()
      };

      const { data: session, error: sessionError } = await supabase
        .from('review_sessions')
        .insert([sessionData])
        .select()
        .single();

      if (sessionError) throw sessionError;

      res.json({
        session_id: session.id,
        name: session.name,
        word_ids: session.word_ids,
        total_words: session.total_words,
        exercise_count: session.exercise_count,
        status: session.status,
        created_at: session.created_at,
        exercises: exercises
      });

    } catch (error) {
      console.error('Error creating review session:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  // Lấy danh sách bài ôn tập
  static async getReviewSessions(req, res) {
    try {
      const userId = req.user.id;
      const { page = 1, limit = 10 } = req.query;
      const offset = (page - 1) * limit;

      // Lấy tổng số session
      const { count, error: countError } = await supabase
        .from('review_sessions')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId);

      if (countError) throw countError;

      // Lấy danh sách session
      const { data: sessions, error } = await supabase
        .from('review_sessions')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

      if (error) throw error;

      res.json({
        sessions,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: count,
          total_pages: Math.ceil(count / limit)
        }
      });

    } catch (error) {
      console.error('Error getting review sessions:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  // Lấy chi tiết bài ôn tập
  static async getReviewSession(req, res) {
    try {
      const userId = req.user.id;
      const { sessionId } = req.params;

      const { data: session, error } = await supabase
        .from('review_sessions')
        .select('*')
        .eq('id', sessionId)
        .eq('user_id', userId)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          return res.status(404).json({ error: 'Session not found' });
        }
        throw error;
      }

      res.json(session);

    } catch (error) {
      console.error('Error getting review session:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  // Xóa bài ôn tập
  static async deleteReviewSession(req, res) {
    try {
      const userId = req.user.id;
      const { sessionId } = req.params;

      const { error } = await supabase
        .from('review_sessions')
        .delete()
        .eq('id', sessionId)
        .eq('user_id', userId);

      if (error) throw error;

      res.json({ success: true, message: 'Session deleted successfully' });

    } catch (error) {
      console.error('Error deleting review session:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }


}

module.exports = ReviewController;