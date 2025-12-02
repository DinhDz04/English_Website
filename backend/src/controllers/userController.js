// backend/src/controllers/userController.js
const { supabase } = require("../utils/supabase");
const bcrypt = require("bcryptjs");

class UserController {
  // Get user profile
  static async getProfile(req, res) {
    try {
      const userId = req.user.id;
      
      const { data: user, error } = await supabase
        .from("users")
        .select(`
          id,
          full_name,
          email,
          avatar_url,
          level,
          experience,
          created_at,
          last_login
        `)
        .eq("id", userId)
        .single();

      if (error) throw error;

      res.json({
        success: true,
        user
      });
    } catch (error) {
      console.error('Get profile error:', error);
      res.status(500).json({
        success: false,
        message: 'Lỗi khi lấy thông tin profile'
      });
    }
  }

  // Update user profile
  static async updateProfile(req, res) {
    try {
      const userId = req.user.id;
      const { full_name, avatar_url } = req.body;

      const updateData = {};
      if (full_name) updateData.full_name = full_name;
      if (avatar_url) updateData.avatar_url = avatar_url;

      const { data: user, error } = await supabase
        .from("users")
        .update(updateData)
        .eq("id", userId)
        .select(`
          id,
          full_name,
          email,
          avatar_url,
          level,
          experience,
          created_at
        `)
        .single();

      if (error) throw error;

      res.json({
        success: true,
        message: 'Cập nhật profile thành công',
        user
      });
    } catch (error) {
      console.error('Update profile error:', error);
      res.status(500).json({
        success: false,
        message: 'Lỗi khi cập nhật profile'
      });
    }
  }

  // Change password
  static async changePassword(req, res) {
    try {
      const userId = req.user.id;
      const { current_password, new_password } = req.body;

      if (!current_password || !new_password) {
        return res.status(400).json({
          success: false,
          message: 'Vui lòng nhập mật khẩu hiện tại và mật khẩu mới'
        });
      }

      if (new_password.length < 6) {
        return res.status(400).json({
          success: false,
          message: 'Mật khẩu mới phải có ít nhất 6 ký tự'
        });
      }

      // Get current password
      const { data: user, error: fetchError } = await supabase
        .from("users")
        .select("password")
        .eq("id", userId)
        .single();

      if (fetchError) throw fetchError;

      // Verify current password
      const validPassword = await bcrypt.compare(current_password, user.password);
      if (!validPassword) {
        return res.status(400).json({
          success: false,
          message: 'Mật khẩu hiện tại không đúng'
        });
      }

      // Hash new password
      const hashedPassword = await bcrypt.hash(new_password, 10);

      // Update password
      const { error: updateError } = await supabase
        .from("users")
        .update({ password: hashedPassword })
        .eq("id", userId);

      if (updateError) throw updateError;

      res.json({
        success: true,
        message: 'Đổi mật khẩu thành công'
      });
    } catch (error) {
      console.error('Change password error:', error);
      res.status(500).json({
        success: false,
        message: 'Lỗi khi đổi mật khẩu'
      });
    }
  }

  // Get user statistics
 // backend/src/controllers/userController.js
// backend/src/controllers/userController.js
// Trong UserController.js hoặc ProgressController.js
static async getStatistics(req, res) {
  try {
    const userId = req.user.id;

    // Lấy tổng số từ đã học
    const { data: learnedWords, error: wordsError } = await supabase
      .from('user_word_progress')
      .select('word_id, is_learned, mastery_level')
      .eq('user_id', userId)
      .eq('is_learned', true);

    if (wordsError) throw wordsError;

    // Lấy thông tin streak từ users table
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('streak_data, experience, level')
      .eq('id', userId)
      .single();

    if (userError) throw userError;

    // Lấy độ chính xác trung bình
    const { data: sessions, error: sessionsError } = await supabase
      .from('learning_sessions')
      .select('correct_answers, total_answers')
      .eq('user_id', userId)
      .eq('status', 'completed');

    if (sessionsError) throw sessionsError;

    const totalCorrect = sessions.reduce((sum, session) => sum + (session.correct_answers || 0), 0);
    const totalAnswers = sessions.reduce((sum, session) => sum + (session.total_answers || 0), 0);
    const accuracy = totalAnswers > 0 ? (totalCorrect / totalAnswers) * 100 : 0;

    // Lấy số quests đã hoàn thành
    const { data: completedQuests, error: questsError } = await supabase
      .from('user_quests')
      .select('id')
      .eq('user_id', userId)
      .eq('status', 'claimed');

    const stats = {
      progress: {
        words_learned: learnedWords?.length || 0,
        words_mastered: learnedWords?.filter(w => w.mastery_level >= 3).length || 0,
        accuracy: Math.round(accuracy * 10) / 10,
        total_time_spent: 0, // Có thể tính từ sessions nếu có
        last_learned_at: null // Có thể lấy từ session gần nhất
      },
      streak: user?.streak_data || {
        current_streak: 0,
        longest_streak: 0,
        last_activity_date: null
      },
      achievements: 0, // Có thể tính từ achievements table
      completed_quests: completedQuests?.length || 0
    };

    res.json({ stats });
  } catch (error) {
    console.error('Error getting user statistics:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

  // Get learning history
  static async getLearningHistory(req, res) {
    try {
      const userId = req.user.id;
      const { page = 1, limit = 20 } = req.query;

      const from = (page - 1) * limit;
      const to = from + limit - 1;

      const { data: history, error, count } = await supabase
        .from("learning_sessions")
        .select(`
          id,
          topic:topics(name, level:levels(name)),
          words_learned,
          correct_answers,
          total_questions,
          time_spent,
          completed_at
        `, { count: 'exact' })
        .eq("user_id", userId)
        .order("completed_at", { ascending: false })
        .range(from, to);

      if (error) throw error;

      res.json({
        success: true,
        history,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: count
        }
      });
    } catch (error) {
      console.error('Get learning history error:', error);
      res.status(500).json({
        success: false,
        message: 'Lỗi khi lấy lịch sử học tập'
      });
    }
  }
  // backend/src/controllers/userController.js
// backend/src/controllers/userController.js
static async updateDailyLogin(req, res) {
  try {
    const userId = req.user.id;
    const today = new Date().toISOString().split('T')[0];

    // Kiểm tra và tạo user_streaks nếu chưa có
    let { data: streak, error: streakError } = await supabase
      .from('user_streaks')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (streakError || !streak) {
      // Tạo mới user_streaks với ID
      const newStreak = {
        id: require('crypto').randomUUID(), // Thêm ID
        user_id: userId,
        current_streak: 0,
        longest_streak: 0,
        last_activity_date: today,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      const { data: createdStreak, error: createError } = await supabase
        .from('user_streaks')
        .insert([newStreak])
        .select()
        .single();

      if (createError) throw createError;
      streak = createdStreak;
    }

    // Cập nhật streak logic (giữ nguyên phần còn lại)
    const lastActivity = streak.last_activity_date;
    let newStreak = streak.current_streak;

    if (lastActivity) {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayStr = yesterday.toISOString().split('T')[0];

      if (lastActivity === yesterdayStr) {
        newStreak += 1;
      } else if (lastActivity !== today) {
        newStreak = 1;
      }
    } else {
      newStreak = 1;
    }

    // Cập nhật streak
    const { error: updateError } = await supabase
      .from('user_streaks')
      .update({
        current_streak: newStreak,
        longest_streak: Math.max(newStreak, streak.longest_streak),
        last_activity_date: today,
        updated_at: new Date().toISOString()
      })
      .eq('user_id', userId);

    if (updateError) throw updateError;

    // Cập nhật last_login cho user
    await supabase
      .from('users')
      .update({
        last_login: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', userId);

    res.json({
      success: true,
      streak: newStreak,
      message: 'Daily login updated successfully'
    });

  } catch (error) {
    console.error('Update daily login error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating daily login'
    });
  }
}

}

module.exports = UserController;