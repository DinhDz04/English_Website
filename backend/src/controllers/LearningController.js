// backend/src/controllers/LearningController.js
const { supabase } = require("../utils/supabase");
const AIService = require('../services/AIService');

class LearningController {

  // ==================== LẤY DANH SÁCH LEVELS VỚI TIẾN ĐỘ ====================
  static async getLevelsWithProgress(req, res) {
    try {
      const userId = req.user.id;
      const { data: levels } = await supabase.from('levels').select('*');
      
      const levelsWithProgress = await Promise.all(
        levels.map(async (level) => {
          const { data: topics } = await supabase
            .from('topics')
            .select('id, name, total_words, estimated_minutes')
            .eq('level_id', level.id)
            .order('sort_order');

          let totalWords = 0, learnedWords = 0;
          
          for (const topic of topics || []) {
            totalWords += topic.total_words || 0;
            const { data: progress } = await supabase
              .from('user_topic_progress')
              .select('words_learned')
              .eq('user_id', userId)
              .eq('topic_id', topic.id)
              .single();
            learnedWords += progress?.words_learned || 0;
          }

          return {
            ...level,
            topics: topics || [],
            stats: {
              total_words: totalWords,
              learned_words: learnedWords,
              progress: totalWords > 0 ? Math.round((learnedWords / totalWords) * 100) : 0,
              total_xp: totalWords * 10
            }
          };
        })
      );

      res.json({ levels: levelsWithProgress });
    } catch (error) {
      console.error('Error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  // ==================== LẤY CHI TIẾT TOPIC ====================
  static async getTopicDetails(req, res) {
    try {
      const { topicId } = req.params;
      const userId = req.user.id;

      const { data: topic } = await supabase
        .from('topics')
        .select('*')
        .eq('id', topicId)
        .single();
        

      if (!topic) return res.status(404).json({ error: 'Topic not found' });

      // Lấy tiến độ topic
      const { data: progress } = await supabase
        .from('user_topic_progress')
        .select('*')
        .eq('user_id', userId)
        .eq('topic_id', topicId)
        .single();
        

      // Lấy từ đã học
      const { data: learnedWords } = await supabase
        .from('user_word_progress')
        .select('word_id')
        .eq('user_id', userId)
        .gte('mastery_level', 1);

      const learnedSet = new Set(learnedWords?.map(w => w.word_id) || []);

      // Lấy tất cả từ
      const { data: words } = await supabase
        .from('words')
        .select('id, word, meaning, pronunciation, example, difficulty, audio_url')
        .eq('topic_id', topicId);

      const wordsWithStatus = words?.map(word => ({
        ...word,
        is_learned: learnedSet.has(word.id),
        can_select: !learnedSet.has(word.id)
      })) || [];

      res.json({
        topic,
        progress: progress || { words_learned: 0, words_mastered: 0, accuracy: 0, is_completed: false },
        words: wordsWithStatus,
        stats: {
          total: wordsWithStatus.length,
          learned: wordsWithStatus.filter(w => w.is_learned).length,
          available: wordsWithStatus.filter(w => !w.is_learned).length
        }
      });
    } catch (error) {
      console.error('Error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  // ==================== BẮT ĐẦU PHIÊN HỌC ====================
  static async startLearningSession(req, res) {
    try {
      const userId = req.user.id;
      const { topic_id, word_ids, word_count, selection_type } = req.body;

      if (!topic_id) return res.status(400).json({ error: 'Topic ID is required' });

      let selectedWordIds = word_ids;

      // Nếu chọn ngẫu nhiên
      if (selection_type === 'random' && word_count) {
        const { data: learnedWords } = await supabase
          .from('user_word_progress')
          .select('word_id')
          .eq('user_id', userId)
          .gte('mastery_level', 1);

        const learnedSet = new Set(learnedWords?.map(w => w.word_id) || []);

        const { data: allWords } = await supabase
          .from('words')
          .select('id')
          .eq('topic_id', topic_id);

        const available = allWords?.filter(w => !learnedSet.has(w.id)).map(w => w.id) || [];
        selectedWordIds = available.sort(() => 0.5 - Math.random()).slice(0, Math.min(word_count, available.length));
      }

      if (!selectedWordIds?.length) {
        return res.status(400).json({ error: 'No words available' });
      }

      // Tạo session
      const { data: session } = await supabase
        .from('learning_sessions')
        .insert([{
          user_id: userId,
          topic_id,
          word_ids: selectedWordIds,
          total_words: selectedWordIds.length,
          words_learned: 0,
          correct_answers: 0,
          total_answers: 0,
          streak: 0,
          experience_earned: 0,
          hearts_used: 0,
          status: 'active',
          started_at: new Date().toISOString(),
          is_ai_generated: true,
          exercise_types: ['fill_blank', 'multiple_choice'],
          current_word_index: 0,
          current_exercise_type_index: 0,
          preview_completed: false
        }])
        .select()
        .single();

      // Lấy thông tin từ
      const { data: words } = await supabase
        .from('words')
        .select('*')
        .in('id', selectedWordIds);

      res.json({
        session,
        words: words || [],
        message: 'Session started - Preview mode'
      });
    } catch (error) {
      console.error('Error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  // ==================== HOÀN THÀNH PREVIEW ====================
  static async completePreview(req, res) {
    try {
      const { sessionId } = req.params;
      const userId = req.user.id;

      const { data: session } = await supabase
        .from('learning_sessions')
        .update({ preview_completed: true, current_word_index: 0, current_exercise_type_index: 0 })
        .eq('id', sessionId)
        .eq('user_id', userId)
        .select()
        .single();

      res.json({ session, message: 'Preview completed, starting exercises' });
    } catch (error) {
      console.error('Error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  // ==================== LẤY BÀI TẬP AI ====================
  static async getAIExercise(req, res) {
    try {
      const { sessionId, wordId, exerciseType } = req.query;
      const userId = req.user.id;

      // Lấy từ vựng
      const { data: word } = await supabase
        .from('words')
        .select('*')
        .eq('id', wordId)
        .single();

      if (!word) return res.status(404).json({ error: 'Word not found' });

      // Tạo bài tập bằng AI
      const exercise = await AIService.generateExercise(
        word.word,
        word.meaning,
        word.example,
        exerciseType
      );
      if (exercise.id) delete exercise.id;
      const exerciseId = `ex_${sessionId}_${wordId}_${exerciseType}_${Date.now()}`;

      // Lưu exercise tạm thời
      await supabase.from('temp_exercises').insert([{
        
        id: exerciseId,
        session_id: sessionId,
        user_id: userId,
        word_id: wordId,
        exercise_type: exerciseType,
        exercise_data: exercise,
        created_at: new Date().toISOString()
      }]);
      res.json({
        exercise: {
          id: exerciseId,
          type: exercise.type,
          question: exercise.question,
          options: exercise.options || [],
          words: exercise.words || [],
          word_id: wordId,
          word_data: {
            word: word.word,
            meaning: word.meaning,
            example: word.example,
            pronunciation: word.pronunciation
          }
        }
      });
   
    } catch (error) {
      console.error('Error:', error);
      res.status(500).json({ error: 'Failed to generate exercise: ' + error.message });
    }
  }


// backend/src/controllers/LearningController.js
static async submitAnswer(req, res) {
  try {
    console.log('🎯 SUBMIT ANSWER - DELAYED LEARNING');
    
    const { sessionId } = req.params;
    const { exercise_id, word_id, user_answer, is_heart_used = false } = req.body;
    const userId = req.user.id;

    // 1. Lấy thông tin cơ bản từ database
    const { data: word } = await supabase
      .from('words')
      .select('word, meaning')
      .eq('id', word_id)
      .single();

    if (!word) {
      return res.status(404).json({ error: 'Word not found' });
    }

    // 2. Lấy session
    const { data: session } = await supabase
      .from('learning_sessions')
      .select('*')
      .eq('id', sessionId)
      .single();

    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }

    // 3. Kiểm tra đơn giản
    const isCorrect = user_answer.trim().toLowerCase() === word.word.toLowerCase();
    
    // 4. Đếm số lần sai trước đó cho từ này
    const { data: previousAttempts } = await supabase
      .from('user_exercise_attempts')
      .select('is_correct, is_heart_used')
      .eq('user_id', userId)
      .eq('session_id', sessionId)
      .eq('word_id', word_id);

    const wrongCount = previousAttempts?.filter(a => !a.is_correct && !a.is_heart_used).length || 0;

    // 5. Xử lý tim (nếu dùng)
    let heartsUsed = session.hearts_used || 0;
    let heartUsedNow = false;
    let availableHearts = await LearningController.getAvailableHearts(userId);

    if (is_heart_used && !isCorrect) {
      if (availableHearts <= 0) {
        return res.status(400).json({ error: 'No hearts available', available_hearts: 0 });
      }
      heartsUsed += 1;
      heartUsedNow = true;
      availableHearts -= 1;

      // Cập nhật tim hàng ngày
      const today = new Date().toISOString().split('T')[0];
      const { data: dailyHearts } = await supabase
        .from('user_daily_hearts')
        .select('*')
        .eq('user_id', userId)
        .eq('date', today)
        .single();

      if (dailyHearts) {
        await supabase
          .from('user_daily_hearts')
          .update({ hearts_used: dailyHearts.hearts_used + 1 })
          .eq('id', dailyHearts.id);
      } else {
        await supabase
          .from('user_daily_hearts')
          .insert([{ user_id: userId, date: today, hearts_used: 1 }]);
      }
    }

    // 6. Tính toán kinh nghiệm (VẪN TÍNH ĐIỂM NHƯ CŨ)
    let expEarned = 0;
    let newStreak = isCorrect ? (session.streak || 0) + 1 : 0;
    let streakBonus = newStreak >= 3 ? 2 : 1;

    if (isCorrect) {
      // Kiểm tra lần đầu đúng TRONG SESSION NÀY
      const isFirstCorrectInSession = !previousAttempts?.some(a => a.is_correct);
      
      if (isFirstCorrectInSession) {
        expEarned = 10 * streakBonus;
        console.log('🎯 First correct answer in session - giving XP');
      } else {
        expEarned = 0;
        console.log('ℹ️ Already correct in this session - no XP');
      }
    } else {
      // Xử lý sai
      if (heartUsedNow) {
        expEarned = 0;
      } else if (wrongCount >= 2) {
        expEarned = 0;
      } else {
        expEarned = -5;
      }
    }

    // 7. Cập nhật session
    const exerciseTypes = session.exercise_types || ['fill_blank', 'multiple_choice', 'word_ordering'];
    let nextExerciseTypeIndex = session.current_exercise_type_index || 0;
    let nextWordIndex = session.current_word_index || 0;
    let wordsLearned = session.words_learned || 0;

    if (isCorrect) {
      nextExerciseTypeIndex += 1;
      if (nextExerciseTypeIndex >= exerciseTypes.length) {
        nextExerciseTypeIndex = 0;
        nextWordIndex += 1;
        wordsLearned += 1;
      }
    }

    // Cập nhật session
    const { data: updatedSession } = await supabase
      .from('learning_sessions')
      .update({
        correct_answers: isCorrect ? (session.correct_answers || 0) + 1 : session.correct_answers,
        total_answers: (session.total_answers || 0) + 1,
        streak: newStreak,
        experience_earned: Math.max(0, (session.experience_earned || 0) + expEarned),
        hearts_used: heartsUsed,
        current_exercise_type_index: nextExerciseTypeIndex,
        current_word_index: nextWordIndex,
        words_learned: wordsLearned,
        updated_at: new Date().toISOString()
      })
      .eq('id', sessionId)
      .select()
      .single();

    // 8. Lưu attempt
    await supabase.from('user_exercise_attempts').insert([{
      user_id: userId,
      session_id: sessionId,
      exercise_id: exercise_id,
      word_id: word_id,
      user_answer: user_answer,
      is_correct: isCorrect,
      experience_earned: expEarned,
      is_heart_used: heartUsedNow,
      attempted_at: new Date().toISOString()
    }]);

    // 9. Cập nhật tiến độ từ (NHƯNG CHƯA ĐÁNH DẤU ĐÃ HỌC)
    await LearningController.updateWordProgress(userId, word_id, isCorrect, false);

    // 10. KIỂM TRA HOÀN THÀNH SESSION - CHỈ KHI ĐÓ MỚI ĐÁNH DẤU HỌC
    const sessionCompleted = nextWordIndex >= session.word_ids.length;
    // Trong submitAnswer, tìm dòng này:
if (sessionCompleted) {
  console.log('🎉 Session completed - marking all words as learned');
  
  await supabase
    .from('learning_sessions')
    .update({ status: 'completed', completed_at: new Date().toISOString() })
    .eq('id', sessionId);

  // Cập nhật kinh nghiệm user
  await LearningController.updateUserExperience(userId, updatedSession.experience_earned);
  
  // Cập nhật topic progress
  await LearningController.updateTopicProgress(userId, session.topic_id);
  
  // SỬA: THÊM AWAIT để đảm bảo hoàn thành trước khi response
  await LearningController.markAllSessionWordsAsLearned(userId, sessionId);

  await LearningController.updateUserStreak(userId);
}

    // 11. Trả về kết quả
    const response = {
      is_correct: isCorrect,
      correct_answer: word.word,
      explanation: isCorrect ? 
        `Chính xác! "${word.word}" có nghĩa là "${word.meaning}"` :
        `Chưa chính xác. Đáp án đúng là: "${word.word}" (${word.meaning})`,
      experience_earned: expEarned,
      current_streak: newStreak,
      hearts_used: heartsUsed,
      session: updatedSession,
      requires_retry: !isCorrect && !heartUsedNow,
      progress: {
        current_word: nextWordIndex + 1,
        total_words: session.total_words,
        current_exercise: nextExerciseTypeIndex + 1,
        total_exercises: exerciseTypes.length,
        words_learned: wordsLearned
      },
      available_hearts: availableHearts,
      wrong_attempts: wrongCount + (isCorrect ? 0 : 1),
      session_completed: sessionCompleted,
      message: isCorrect ?
        (expEarned > 0 ? 
          (streakBonus > 1 ? `Chính xác! +${expEarned} XP (x2 streak) 🎉` : `Chính xác! +${expEarned} XP 🎉`) : 
          'Chính xác! (Đã đúng từ này trước đó)') :
        (heartUsedNow ? 'Đã dùng tim 💖 (Không trừ điểm)' :
          (wrongCount >= 2 ? 'Sai quá 3 lần, 0 điểm' : `Sai! -5 XP (lần ${wrongCount + 1})`))
    };

    console.log('✅ Response sent:', { 
      isCorrect, 
      expEarned, 
      sessionCompleted,
      wordsMarkedAsLearned: sessionCompleted ? session.word_ids.length : 0
    });
    res.json(response);

  } catch (error) {
    console.error('❌ submitAnswer error:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      message: error.message 
    });
  }
}

// Thêm vào LearningController
static async getAvailableHearts(userId) {
  try {
    const today = new Date().toISOString().split('T')[0];
    const { data } = await supabase
      .from('user_daily_hearts')
      .select('hearts_used')
      .eq('user_id', userId)
      .eq('date', today)
      .single();
    return Math.max(0, 5 - (data?.hearts_used || 0));
  } catch {
    return 5;
  }
}



static async markAllSessionWordsAsLearned(userId, sessionId) {
  try {
    const { data: session } = await supabase
      .from('learning_sessions')
      .select('word_ids')
      .eq('id', sessionId)
      .single();

    if (!session || !session.word_ids) return;

    console.log('📚 Marking all session words as learned:', session.word_ids);

    // SỬA: Gọi trực tiếp markWordAsLearned thay vì updateWordProgress
    for (const wordId of session.word_ids) {
      await LearningController.markWordAsLearned(userId, wordId);
    }

    console.log('✅ All words marked as learned');

    // KIỂM TRA LẠI
    const { data: learnedWords } = await supabase
      .from('user_word_progress')
      .select('word_id, is_learned, mastery_level')
      .eq('user_id', userId)
      .in('word_id', session.word_ids)
      .eq('is_learned', true);

    console.log('🔍 Verification - Words actually learned:', learnedWords?.length);
    console.log('🔍 Learned words details:', learnedWords);

  } catch (error) {
    console.error('Error marking all words as learned:', error);
  }
}

static async markWordAsLearned(userId, wordId) {
  try {
    console.log('🔍 Marking word as learned:', { userId, wordId });
    
    const { data: existing } = await supabase
      .from('user_word_progress')
      .select('*')
      .eq('user_id', userId)
      .eq('word_id', wordId)
      .single();

    const progressData = {
      user_id: userId,
      word_id: wordId,
      times_seen: (existing?.times_seen || 0) + 1,
      times_correct: (existing?.times_correct || 0) + 1,
      mastery_level: Math.max(1, (existing?.mastery_level || 0)),
      is_learned: true, // QUAN TRỌNG: Phải có trường này
      learned_at: new Date().toISOString(),
      last_reviewed_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    if (existing) {
      console.log('📝 Updating existing word progress:', existing.id);
      const { data, error } = await supabase
        .from('user_word_progress')
        .update(progressData)
        .eq('id', existing.id)
        .select();

      if (error) {
        console.error('❌ Error updating word progress:', error);
        throw error;
      }
      console.log('✅ Word progress updated:', data);
    } else {
      console.log('📝 Creating new word progress');
      // THÊM created_at cho record mới
      progressData.created_at = new Date().toISOString();
      
      const { data, error } = await supabase
        .from('user_word_progress')
        .insert([progressData])
        .select();

      if (error) {
        console.error('❌ Error creating word progress:', error);
        throw error;
      }
      console.log('✅ New word progress created:', data);
    }

    // KIỂM TRA LẠI SAU KHI UPDATE
    const { data: check } = await supabase
      .from('user_word_progress')
      .select('is_learned, mastery_level, times_seen, times_correct')
      .eq('user_id', userId)
      .eq('word_id', wordId)
      .single();

    console.log('🔍 Verification - Word learned status:', check);

  } catch (error) {
    console.error('❌ Error in markWordAsLearned:', error);
    throw error; // QUAN TRỌNG: Ném lỗi để xử lý ở nơi gọi
  }
}
static async updateUserExperience(userId, experience) {
  try {
    const { data: user } = await supabase
      .from('users')
      .select('experience')
      .eq('id', userId)
      .single();

    if (user) {
      const newExp = Math.max(0, (user.experience || 0) + experience);
      await supabase
        .from('users')
        .update({ experience: newExp, updated_at: new Date().toISOString() })
        .eq('id', userId);
    }
  } catch (error) {
    console.error('Error updating user experience:', error);
  }
}

static async debugWordProgress(userId, wordIds) {
  try {
    console.log('🐛 DEBUG Word Progress:');
    
    const { data: progress } = await supabase
      .from('user_word_progress')
      .select('*')
      .eq('user_id', userId)
      .in('word_id', wordIds);

    console.log('Current progress in database:', progress);
    
    // Kiểm tra schema
    const { data: schema } = await supabase
      .from('user_word_progress')
      .select('*')
      .limit(1);

    console.log('Table schema sample:', schema);
    
  } catch (error) {
    console.error('Debug error:', error);
  }
}

// Thêm hàm này vào LearningController
static async updateUserStreak(userId) {
  try {
    const today = new Date().toISOString().split('T')[0];
    const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
    
    // Lấy streak hiện tại
    const { data: user } = await supabase
      .from('users')
      .select('streak_data, last_activity_date')
      .eq('id', userId)
      .single();

    let currentStreak = user?.streak_data?.current_streak || 0;
    let longestStreak = user?.streak_data?.longest_streak || 0;
    const lastActivity = user?.last_activity_date?.split('T')[0];

    // Kiểm tra nếu đã học hôm nay chưa
    if (lastActivity === today) {
      return; // Đã cập nhật rồi
    }

    // Kiểm tra nếu học liên tiếp
    if (lastActivity === yesterday) {
      currentStreak += 1;
    } else if (lastActivity !== today) {
      currentStreak = 1; // Reset streak nếu bị gián đoạn
    }

    // Cập nhật longest streak
    longestStreak = Math.max(longestStreak, currentStreak);

    const streakData = {
      current_streak: currentStreak,
      longest_streak: longestStreak,
      last_activity_date: today
    };

    // Cập nhật database
    await supabase
      .from('users')
      .update({
        streak_data: streakData,
        last_activity_date: today,
        updated_at: new Date().toISOString()
      })
      .eq('id', userId);

    console.log('📅 Streak updated:', streakData);

  } catch (error) {
    console.error('Error updating streak:', error);
  }
}
// Cập nhật updateWordProgress để đồng bộ
static async updateWordProgress(userId, wordId, isCorrect, markAsLearned = false) {
  const { data: existing } = await supabase
    .from('user_word_progress')
    .select('*')
    .eq('user_id', userId)
    .eq('word_id', wordId)
    .single();

  if (existing) {
    const updateData = {
      times_seen: existing.times_seen + 1,
      times_correct: isCorrect ? existing.times_correct + 1 : existing.times_correct,
      last_reviewed_at: new Date().toISOString()
    };
    
    if (markAsLearned) {
      updateData.is_learned = true;
      updateData.learned_at = new Date().toISOString();
      updateData.mastery_level = Math.max(1, existing.mastery_level || 0);
    }
    
    await supabase.from('user_word_progress').update(updateData).eq('id', existing.id);
  } else {
    const { randomUUID } = require('crypto'); // Thêm ở đầu file
    
    const initialData = {
      id: randomUUID(), // 🚨 THÊM ID
      user_id: userId,
      word_id: wordId,
      times_seen: 1,
      times_correct: isCorrect ? 1 : 0,
      mastery_level: 0,
      is_learned: false,
      last_reviewed_at: new Date().toISOString(),
      created_at: new Date().toISOString()
    };
    
    if (markAsLearned) {
      initialData.is_learned = true;
      initialData.learned_at = new Date().toISOString();
      initialData.mastery_level = 1;
    }
    
    await supabase.from('user_word_progress').insert([initialData]);
  }
}



  static calculateLevel(exp) {
    const levels = [0, 100, 300, 600, 1000, 1500, 2100, 2800, 3600, 4500];
    for (let i = levels.length - 1; i >= 0; i--) {
      if (exp >= levels[i]) return i + 1;
    }
    return 1;
  }

  static async updateTopicProgress(userId, topicId) {
    const { data: words } = await supabase
      .from('words')
      .select('id')
      .eq('topic_id', topicId);

    const { data: learned } = await supabase
      .from('user_word_progress')
      .select('word_id')
      .eq('user_id', userId)
      .gte('mastery_level', 1)
      .in('word_id', words.map(w => w.id));

    const wordsLearned = learned?.length || 0;
    const isCompleted = wordsLearned >= words.length;

    const { data: existing } = await supabase
      .from('user_topic_progress')
      .select('id')
      .eq('user_id', userId)
      .eq('topic_id', topicId)
      .single();

    const progressData = {
      user_id: userId,
      topic_id: topicId,
      words_learned: wordsLearned,
      is_completed: isCompleted,
      completed_at: isCompleted ? new Date().toISOString() : null,
      updated_at: new Date().toISOString()
    };

    if (existing) {
      await supabase.from('user_topic_progress').update(progressData).eq('id', existing.id);
    } else {
      await supabase.from('user_topic_progress').insert([progressData]);
    }
  }

  // ==================== LẤY THÔNG TIN ====================
  
  static async getLearningProgress(req, res) {
    try {
      const userId = req.user.id;
      
      const { data: learned } = await supabase
        .from('user_word_progress')
        .select('word_id')
        .eq('user_id', userId)
        .gte('mastery_level', 1);

      const { data: user } = await supabase
        .from('users')
        .select('experience, level')
        .eq('id', userId)
        .single();

      const today = new Date().toISOString().split('T')[0];
      const { data: sessions } = await supabase
        .from('learning_sessions')
        .select('id')
        .eq('user_id', userId)
        .gte('created_at', `${today}T00:00:00`)
        .lte('created_at', `${today}T23:59:59`);

      res.json({
        stats: {
          total_learned: learned?.length || 0,
          experience: user?.experience || 0,
          level: user?.level || 1,
          available_hearts: await LearningController.getAvailableHearts(userId),
          sessions_today: sessions?.length || 0
        }
      });
    } catch (error) {
      console.error('Error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  static async getTopicProgress(req, res) {
    try {
      const { topicId } = req.params;
      const userId = req.user.id;

      const { data: progress } = await supabase
        .from('user_topic_progress')
        .select('*')
        .eq('user_id', userId)
        .eq('topic_id', topicId)
        .single();

      res.json({
        progress: progress || {
          words_learned: 0,
          words_mastered: 0,
          accuracy: 0,
          is_completed: false
        }
      });
    } catch (error) {
      console.error('Error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  static async getSessionProgress(req, res) {
    try {
      const { sessionId } = req.params;
      const userId = req.user.id;

      const { data: session } = await supabase
        .from('learning_sessions')
        .select('*')
        .eq('id', sessionId)
        .eq('user_id', userId)
        .single();

      if (!session) return res.status(404).json({ error: 'Session not found' });

      const { data: words } = await supabase
        .from('words')
        .select('*')
        .in('id', session.word_ids);

      res.json({ session, words: words || [] });
    } catch (error) {
      console.error('Error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  static async completeLearningSession(req, res) {
    try {
      const { sessionId } = req.params;
      const userId = req.user.id;

      const { data: session } = await supabase
        .from('learning_sessions')
        .select('*')
        .eq('id', sessionId)
        .eq('user_id', userId)
        .single();

      if (!session) return res.status(404).json({ error: 'Session not found' });

      // Cập nhật session
      const { data: completedSession } = await supabase
        .from('learning_sessions')
        .update({
          status: 'completed',
          completed_at: new Date().toISOString()
        })
        .eq('id', sessionId)
        .select()
        .single();

      // Cập nhật user experience
await LearningController.updateUserExperience(userId, completedSession.experience_earned);
await LearningController.updateTopicProgress(userId, session.topic_id);

      res.json({
        session: completedSession,
        message: 'Learning session completed successfully'
      });
    } catch (error) {
      console.error('Error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
}

module.exports = LearningController;