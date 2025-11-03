// backend/src/models/LearningSession.js
const { supabase } = require('../utils/supabase');

class LearningSession {
  // Lấy danh sách từ chưa học của user trong topic
  static async getAvailableWords(userId, topicId) {
    const { data: allWords, error: wordsError } = await supabase
      .from('words')
      .select('id, word, meaning, pronunciation, example, difficulty, audio_url')
      .eq('topic_id', topicId);

    if (wordsError) throw wordsError;

    const { data: learnedWords, error: learnedError } = await supabase
      .from('user_learned_words')
      .select('word_id')
      .eq('user_id', userId);

    if (learnedError) throw learnedError;

    const learnedWordIds = new Set(learnedWords.map(w => w.word_id));
    const availableWords = allWords.filter(w => !learnedWordIds.has(w.id));

    return {
      total: allWords.length,
      learned: learnedWords.length,
      available: availableWords
    };
  }

  // Tạo session học mới
  static async createSession(userId, topicId, selectedWordIds) {
    const { data, error } = await supabase
      .from('user_learning_sessions')
      .insert([{
        user_id: userId,
        topic_id: topicId,
        selected_words: selectedWordIds,
        total_words: selectedWordIds.length,
        status: 'in_progress'
      }])
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  // Lấy bài tập fill_blank cho từ
  static async getExerciseForWord(wordId, topicId) {
    const { data, error } = await supabase
      .from('exercises')
      .select('*')
      .eq('word_id', wordId)
      .eq('type', 'fill_blank')
      .maybeSingle();

    if (error) throw error;
    return data;
  }

  // Lưu câu trả lời
  static async saveAnswer(sessionId, wordId, exerciseType, isCorrect, timeTaken) {
    const { error } = await supabase
      .from('session_answers')
      .insert([{
        session_id: sessionId,
        word_id: wordId,
        exercise_type: exerciseType,
        is_correct: isCorrect,
        time_taken_seconds: timeTaken
      }]);

    if (error) throw error;
    return true;
  }

  // Đánh dấu từ đã học
  static async markWordAsLearned(userId, wordId) {
    const { error } = await supabase
      .from('user_learned_words')
      .insert([{
        user_id: userId,
        word_id: wordId
      }])
      .on_conflict('user_id,word_id')
      .ignore();

    if (error) throw error;
    return true;
  }

  // Cập nhật session
  static async updateSession(sessionId, updates) {
    const { data, error } = await supabase
      .from('user_learning_sessions')
      .update(updates)
      .eq('id', sessionId)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  // Lấy thông tin session
  static async getSession(sessionId) {
    const { data, error } = await supabase
      .from('user_learning_sessions')
      .select(`
        *,
        topics (
          id,
          name,
          icon,
          description
        )
      `)
      .eq('id', sessionId)
      .single();

    if (error) throw error;
    return data;
  }

  // Lấy từ theo IDs
  static async getWordsByIds(wordIds) {
    const { data, error } = await supabase
      .from('words')
      .select('*')
      .in('id', wordIds);

    if (error) throw error;
    return data;
  }
}

module.exports = LearningSession;