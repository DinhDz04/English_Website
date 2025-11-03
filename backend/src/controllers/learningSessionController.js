// backend/src/controllers/learningSessionController.js
const LearningSession = require('../models/LearningSession');

class LearningSessionController {
  /**
   * POST /api/sessions/start
   * Bắt đầu một learning session mới
   */
  static async startSession(req, res) {
    try {
      const userId = req.user.id; // Từ auth middleware
      const { topicId, wordLimit, difficulty, sessionType, includeExercises } = req.body;

      if (!topicId) {
        return res.status(400).json({ error: 'Topic ID is required' });
      }

      const sessionData = await LearningSession.createSession(userId, topicId, {
        wordLimit: wordLimit || 10,
        difficulty: difficulty || null,
        sessionType: sessionType || 'practice',
        includeExercises: includeExercises !== false
      });

      res.status(201).json({
        message: 'Session created successfully',
        ...sessionData
      });
    } catch (error) {
      console.error('Error starting session:', error);
      res.status(500).json({ 
        error: 'Failed to start session',
        details: error.message 
      });
    }
  }

  /**
   * PUT /api/sessions/:sessionId/complete
   * Hoàn thành session và lưu kết quả
   */
  static async completeSession(req, res) {
    try {
      const { sessionId } = req.params;
      const userId = req.user.id;
      const { score, correctAnswers, wrongAnswers, livesUsed, learnedWordIds } = req.body;

      // Verify session belongs to user
      const { data: session, error: sessionError } = await supabase
        .from('learning_sessions')
        .select('user_id, topic_id')
        .eq('id', sessionId)
        .single();

      if (sessionError || !session) {
        return res.status(404).json({ error: 'Session not found' });
      }

      if (session.user_id !== userId) {
        return res.status(403).json({ error: 'Unauthorized' });
      }

      // Update session
      const completedSession = await LearningSession.completeSession(sessionId, {
        score,
        correctAnswers,
        wrongAnswers,
        livesUsed
      });

      // Update user progress
      if (learnedWordIds && learnedWordIds.length > 0) {
        await LearningSession.updateUserProgress(
          userId,
          session.topic_id,
          learnedWordIds
        );
      }

      // Update user points
      const { supabase } = require('../utils/supabase');
      await supabase.rpc('increment_user_points', {
        user_id: userId,
        points_to_add: score
      });

      res.json({
        message: 'Session completed successfully',
        session: completedSession
      });
    } catch (error) {
      console.error('Error completing session:', error);
      res.status(500).json({ 
        error: 'Failed to complete session',
        details: error.message 
      });
    }
  }

  /**
   * POST /api/sessions/:sessionId/questions
   * Lưu kết quả từng câu hỏi
   */
  static async saveQuestionResult(req, res) {
    try {
      const { sessionId } = req.params;
      const questionData = req.body;

      const result = await LearningSession.saveQuestionResult(sessionId, questionData);

      res.json({
        message: 'Question result saved',
        result
      });
    } catch (error) {
      console.error('Error saving question result:', error);
      res.status(500).json({ error: 'Failed to save question result' });
    }
  }

  /**
   * GET /api/sessions/history
   * Lấy lịch sử các session của user
   */
  static async getSessionHistory(req, res) {
    try {
      const userId = req.user.id;
      const { limit, topicId } = req.query;

      const sessions = await LearningSession.getUserSessions(userId, {
        limit: parseInt(limit) || 20,
        topicId: topicId || null
      });

      res.json({ sessions });
    } catch (error) {
      console.error('Error getting session history:', error);
      res.status(500).json({ error: 'Failed to get session history' });
    }
  }

  /**
   * GET /api/sessions/:sessionId
   * Lấy chi tiết một session
   */
  static async getSessionDetails(req, res) {
    try {
      const { sessionId } = req.params;
      const userId = req.user.id;

      const { supabase } = require('../utils/supabase');
      const { data: session, error } = await supabase
        .from('learning_sessions')
        .select(`
          *,
          topics (
            id,
            name,
            description,
            icon
          ),
          session_questions (
            *,
            words (
              word,
              meaning
            )
          )
        `)
        .eq('id', sessionId)
        .eq('user_id', userId)
        .single();

      if (error || !session) {
        return res.status(404).json({ error: 'Session not found' });
      }

      res.json({ session });
    } catch (error) {
      console.error('Error getting session details:', error);
      res.status(500).json({ error: 'Failed to get session details' });
    }
  }
}

module.exports = LearningSessionController;