// backend/src/models/Quest.js - SỬA LẠI HOÀN TOÀN
const { supabase } = require('../utils/supabase');

class Quest {
  // =============================================
  // ADMIN FUNCTIONS
  // =============================================

  // Get all quests (Admin only)
  static async getAllQuests(filters = {}) {
    try {
      let query = supabase
        .from('quests')
        .select('*')
        .order('created_at', { ascending: false });

      if (filters.type) query = query.eq('type', filters.type);
      if (filters.category) query = query.eq('category', filters.category);
      if (filters.is_active !== undefined) {
        query = query.eq('is_active', filters.is_active);
      }

      const { data, error } = await query;
      if (error) throw error;

      return data || [];
    } catch (error) {
      console.error('Error getting all quests:', error);
      throw error;
    }
  }

  // Create quest (Admin only)
  static async createQuest(questData) {
    try {
      const { data, error } = await supabase
        .from('quests')
        .insert([{
          ...questData,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }])
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error creating quest:', error);
      throw error;
    }
  }

  // Update quest (Admin only)
  static async updateQuest(questId, questData) {
    try {
      const { data, error } = await supabase
        .from('quests')
        .update({
          ...questData,
          updated_at: new Date().toISOString()
        })
        .eq('id', questId)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error updating quest:', error);
      throw error;
    }
  }

  // Delete quest (Admin only)
  static async deleteQuest(questId) {
    try {
      // Xóa user_quests trước
      await supabase
        .from('user_quests')
        .delete()
        .eq('quest_id', questId);

      // Xóa quest claims
      await supabase
        .from('user_quest_claims')
        .delete()
        .eq('quest_id', questId);

      // Xóa quest
      const { error } = await supabase
        .from('quests')
        .delete()
        .eq('id', questId);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error deleting quest:', error);
      throw error;
    }
  }

  // =============================================
  // USER FUNCTIONS
  // =============================================

  // Get user's active quests
  static async getUserActiveQuests(userId) {
    try {
      // Lấy tất cả quests active
      const { data: activeQuests, error: questsError } = await supabase
        .from('quests')
        .select('*')
        .eq('is_active', true)
        .order('sort_order', { ascending: true });

      if (questsError) throw questsError;
      if (!activeQuests || activeQuests.length === 0) return [];

      // Lấy user_quests hiện có
      const { data: userQuests, error: userQuestsError } = await supabase
        .from('user_quests')
        .select('*')
        .eq('user_id', userId);

      if (userQuestsError) throw userQuestsError;

      const userQuestMap = {};
      (userQuests || []).forEach(uq => {
        userQuestMap[uq.quest_id] = uq;
      });

      // Tính progress cho từng quest
      const questsWithProgress = await Promise.all(
        activeQuests.map(async (quest) => {
          const userQuest = userQuestMap[quest.id];
          
          // Tính progress real-time
          const progress = await Quest.calculateProgress(userId, quest);
          
          // Kiểm tra đã claim chưa
          const isClaimed = await Quest.isQuestClaimed(userId, quest.id);
          
          // Xác định status
          let status = 'active';
          if (isClaimed) {
            status = 'claimed';
          } else if (progress >= quest.condition_value) {
            status = 'completed';
          }

          return {
            ...quest,
            user_progress: progress,
            user_status: status,
            can_claim: progress >= quest.condition_value && !isClaimed,
            user_quest_id: userQuest?.id || null
          };
        })
      );

      return questsWithProgress;
    } catch (error) {
      console.error('Error getting user active quests:', error);
      throw error;
    }
  }

  // Get user's completed quests
  static async getUserCompletedQuests(userId) {
    try {
      const { data: claims, error } = await supabase
        .from('user_quest_claims')
        .select(`
          claimed_at,
          reward_experience,
          quest:quests(*)
        `)
        .eq('user_id', userId)
        .order('claimed_at', { ascending: false });

      if (error) throw error;

      return (claims || []).map(claim => ({
        ...claim.quest,
        claimed_at: claim.claimed_at,
        received_experience: claim.reward_experience,
        user_status: 'claimed'
      }));
    } catch (error) {
      console.error('Error getting user completed quests:', error);
      throw error;
    }
  }

  // Claim quest reward
  static async claimReward(userId, questId) {
    try {
      // 1. Lấy thông tin quest
      const { data: quest, error: questError } = await supabase
        .from('quests')
        .select('*')
        .eq('id', questId)
        .eq('is_active', true)
        .single();

      if (questError || !quest) {
        throw new Error('Quest not found or inactive');
      }

      // 2. Kiểm tra đã claim chưa
      const isClaimed = await Quest.isQuestClaimed(userId, questId);
      if (isClaimed) {
        throw new Error('Reward already claimed');
      }

      // 3. Tính progress hiện tại
      const progress = await Quest.calculateProgress(userId, quest);

      // 4. Kiểm tra điều kiện hoàn thành
      if (progress < quest.condition_value) {
        throw new Error(`Quest not completed. Progress: ${progress}/${quest.condition_value}`);
      }

      // 5. Ghi nhận đã claim
      const { error: claimError } = await supabase
        .from('user_quest_claims')
        .insert([{
          user_id: userId,
          quest_id: questId,
          claimed_at: new Date().toISOString(),
          reward_experience: quest.reward_experience || 0
        }]);

      if (claimError) throw claimError;

      // 6. Cập nhật user_quests status
      const { data: existingUserQuest } = await supabase
        .from('user_quests')
        .select('id')
        .eq('user_id', userId)
        .eq('quest_id', questId)
        .single();

      if (existingUserQuest) {
        await supabase
          .from('user_quests')
          .update({
            status: 'claimed',
            updated_at: new Date().toISOString()
          })
          .eq('id', existingUserQuest.id);
      }

      // 7. Cộng reward cho user
      const { data: user, error: userError } = await supabase
        .from('users')
        .select(' experience, level')
        .eq('id', userId)
        .single();

      if (userError) throw userError;

      const newExperience = (user.experience || 0) + (quest.reward_experience || 0);
      const newLevel = Quest.calculateLevel(newExperience);

      const { error: updateError } = await supabase
        .from('users')
        .update({
          experience: newExperience,
          level: newLevel,
          updated_at: new Date().toISOString()
        })
        .eq('id', userId);

      if (updateError) throw updateError;

      return {
        success: true,
        quest,
        reward: {
          experience: quest.reward_experience || 0
        },
        new_level: newLevel,
        level_up: newLevel > user.level
      };
    } catch (error) {
      console.error('Error claiming reward:', error);
      throw error;
    }
  }

  // =============================================
  // HELPER FUNCTIONS
  // =============================================

  // Check if quest is claimed
  static async isQuestClaimed(userId, questId) {
    try {
      const { data, error } = await supabase
        .from('user_quest_claims')
        .select('id')
        .eq('user_id', userId)
        .eq('quest_id', questId)
        .single();

      return !!data;
    } catch (error) {
      return false;
    }
  }

  // Calculate progress based on condition_type
  static async calculateProgress(userId, quest) {
    try {
      switch (quest.condition_type) {
        case 'daily_login':
          return await Quest.getDailyLoginProgress(userId);

        case 'words_learned':
          return await Quest.getWordsLearned(userId);
        
        case 'words_learned_today':
          return await Quest.getWordsLearnedToday(userId);

        case 'words_mastered':
          return await Quest.getWordsMastered(userId);

        case 'topics_completed':
          return await Quest.getTopicsCompleted(userId);

        case 'sessions_completed':
          return await Quest.getSessionsCompleted(userId);
        
        case 'sessions_completed_today':
          return await Quest.getSessionsCompletedToday(userId);

        case 'login_streak':
          return await Quest.getLoginStreak(userId);

        case 'time_spent':
          return await Quest.getTimeSpent(userId);

        case 'accuracy':
          return await Quest.getAccuracy(userId);

        case 'level_completed':
          return await Quest.getLevelCompleted(userId, quest.condition_value);

        case 'topic_completed':
          // Sử dụng topic_id từ quest nếu có
          return await Quest.getTopicCompleted(userId, quest.condition_value, quest.topic_id);

        default:
          console.warn(`Unknown condition_type: ${quest.condition_type}`);
          return 0;
      }
    } catch (error) {
      console.error('Error calculating progress:', error);
      return 0;
    }
  }

  // Progress calculation helpers
  static async getDailyLoginProgress(userId) {
    const { data } = await supabase
      .from('users')
      .select('last_login')
      .eq('id', userId)
      .single();

    if (!data?.last_login) return 0;

    const today = new Date().toISOString().split('T')[0];
    const lastLogin = new Date(data.last_login).toISOString().split('T')[0];

    return lastLogin === today ? 1 : 0;
  }

  static async getWordsLearned(userId) {
    const { data } = await supabase
      .from('user_progress')
      .select('words_learned')
      .eq('user_id', userId)
      .single();

    return data?.words_learned || 0;
  }

  static async getWordsLearnedToday(userId) {
    const today = new Date().toISOString().split('T')[0];
    
    const { data } = await supabase
      .from('learning_sessions')
      .select('words_learned')
      .eq('user_id', userId)
      .gte('completed_at', `${today}T00:00:00`)
      .lte('completed_at', `${today}T23:59:59`);

    const total = data?.reduce((sum, session) => sum + (session.words_learned || 0), 0) || 0;
    return total;
  }

  static async getWordsMastered(userId) {
    const { data } = await supabase
      .from('user_progress')
      .select('words_mastered')
      .eq('user_id', userId)
      .single();

    return data?.words_mastered || 0;
  }

  static async getTopicsCompleted(userId) {
    const { data } = await supabase
      .from('user_topic_progress')
      .select('id')
      .eq('user_id', userId)
      .eq('is_completed', true);

    return data?.length || 0;
  }

  static async getSessionsCompleted(userId) {
    const { data } = await supabase
      .from('learning_sessions')
      .select('id')
      .eq('user_id', userId);

    return data?.length || 0;
  }

  static async getSessionsCompletedToday(userId) {
    const today = new Date().toISOString().split('T')[0];
    
    const { data } = await supabase
      .from('learning_sessions')
      .select('id')
      .eq('user_id', userId)
      .gte('completed_at', `${today}T00:00:00`)
      .lte('completed_at', `${today}T23:59:59`);

    return data?.length || 0;
  }

  static async getLoginStreak(userId) {
    const { data } = await supabase
      .from('user_streaks')
      .select('current_streak')
      .eq('user_id', userId)
      .single();

    return data?.current_streak || 0;
  }

  static async getTimeSpent(userId) {
    const { data } = await supabase
      .from('user_progress')
      .select('total_time_spent')
      .eq('user_id', userId)
      .single();

    return data?.total_time_spent || 0;
  }

  static async getAccuracy(userId) {
    const { data } = await supabase
      .from('user_progress')
      .select('accuracy')
      .eq('user_id', userId)
      .single();

    return data?.accuracy || 0;
  }

  static async getLevelCompleted(userId, levelNumber) {
    // Kiểm tra tất cả topics trong level đã hoàn thành chưa
    const { data: level } = await supabase
      .from('levels')
      .select('id')
      .eq('level_number', levelNumber)
      .single();

    if (!level) return 0;

    const { data: topics } = await supabase
      .from('topics')
      .select('id')
      .eq('level_id', level.id);

    if (!topics || topics.length === 0) return 0;

    const { data: completedTopics } = await supabase
      .from('user_topic_progress')
      .select('id')
      .eq('user_id', userId)
      .eq('is_completed', true)
      .in('topic_id', topics.map(t => t.id));

    return completedTopics?.length === topics.length ? 1 : 0;
  }

  static async getTopicCompleted(userId, conditionValue, topicId) {
    // Nếu có topic_id trong quest, sử dụng nó
    if (topicId) {
      const { data } = await supabase
        .from('user_topic_progress')
        .select('is_completed')
        .eq('user_id', userId)
        .eq('topic_id', topicId)
        .single();

      return data?.is_completed ? 1 : 0;
    }
    
    // Fallback về cách cũ (không nên xảy ra)
    return 0;
  }

  // Calculate level from experience
  static calculateLevel(experience) {
    const levels = [
      0, 100, 300, 600, 1000, 1500, 2100, 2800, 3600, 4500,
      5500, 6600, 7800, 9100, 10500, 12000, 13600, 15300, 17100, 19000
    ];

    for (let i = levels.length - 1; i >= 0; i--) {
      if (experience >= levels[i]) {
        return i + 1;
      }
    }
    return 1;
  }
}

module.exports = Quest;