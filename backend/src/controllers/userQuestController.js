// backend/src/controllers/UserQuestController.js - USER CONTROLLER
const Quest = require('../models/Quest');

class UserQuestController {
  // =============================================
  // GET QUESTS
  // =============================================

  // Get active quests for user
  static async getActiveQuests(req, res) {
    try {
      const userId = req.user.id;

      const quests = await Quest.getUserActiveQuests(userId);

      // Group by type for better organization
      const grouped = {
        daily: quests.filter(q => q.type === 'daily'),
        level: quests.filter(q => q.type === 'level'),
        topic: quests.filter(q => q.type === 'topic'),
        vocabulary: quests.filter(q => q.type === 'vocabulary'),
        streak: quests.filter(q => q.type === 'streak'),
        achievement: quests.filter(q => q.type === 'achievement')
      };

      res.json({
        success: true,
        quests,
        grouped
      });
    } catch (error) {
      console.error('Get active quests error:', error);
      res.status(500).json({
        success: false,
        message: 'Lỗi khi lấy danh sách nhiệm vụ'
      });
    }
  }

  // Get completed quests for user
  static async getCompletedQuests(req, res) {
    try {
      const userId = req.user.id;

      const quests = await Quest.getUserCompletedQuests(userId);

      res.json({
        success: true,
        quests
      });
    } catch (error) {
      console.error('Get completed quests error:', error);
      res.status(500).json({
        success: false,
        message: 'Lỗi khi lấy danh sách nhiệm vụ đã hoàn thành'
      });
    }
  }

  // Get today's daily quest
  static async getTodayDailyQuest(req, res) {
    try {
      const userId = req.user.id;

      const allQuests = await Quest.getUserActiveQuests(userId);
      const dailyQuests = allQuests.filter(q => q.type === 'daily');

      res.json({
        success: true,
        quests: dailyQuests
      });
    } catch (error) {
      console.error('Get daily quest error:', error);
      res.status(500).json({
        success: false,
        message: 'Lỗi khi lấy nhiệm vụ hằng ngày'
      });
    }
  }

  // =============================================
  // CLAIM REWARD
  // =============================================

  static async claimQuestReward(req, res) {
    try {
      const userId = req.user.id;
      const { questId } = req.params;

      const result = await Quest.claimReward(userId, questId);

      res.json({
        success: true,
        message: result.level_up 
          ? `Chúc mừng! Bạn đã lên level ${result.new_level}! 🎉`
          : 'Nhận phần thưởng thành công! 🎁',
        ...result
      });
    } catch (error) {
      console.error('Claim quest reward error:', error);

      // Handle specific errors
      if (error.message.includes('already claimed')) {
        return res.status(400).json({
          success: false,
          message: 'Phần thưởng đã được nhận rồi'
        });
      }

      if (error.message.includes('not completed')) {
        return res.status(400).json({
          success: false,
          message: 'Nhiệm vụ chưa hoàn thành'
        });
      }

      if (error.message.includes('not found')) {
        return res.status(404).json({
          success: false,
          message: 'Không tìm thấy nhiệm vụ'
        });
      }

      res.status(500).json({
        success: false,
        message: 'Lỗi khi nhận phần thưởng'
      });
    }
  }

  // =============================================
  // REFRESH PROGRESS
  // =============================================

  static async refreshProgress(req, res) {
    try {
      const userId = req.user.id;

      // Get all user's quests and recalculate progress
      const quests = await Quest.getUserActiveQuests(userId);

      // Update progress in user_quests table
      const { supabase } = require('../utils/supabase');
      
      for (const quest of quests) {
        if (quest.user_quest_id) {
          await supabase
            .from('user_quests')
            .update({
              progress: quest.user_progress,
              updated_at: new Date().toISOString()
            })
            .eq('id', quest.user_quest_id);
        }
      }

      res.json({
        success: true,
        message: 'Đã cập nhật tiến độ',
        quests
      });
    } catch (error) {
      console.error('Refresh progress error:', error);
      res.status(500).json({
        success: false,
        message: 'Lỗi khi cập nhật tiến độ'
      });
    }
  }

  // =============================================
  // QUEST STATISTICS
  // =============================================

  static async getQuestStatistics(req, res) {
    try {
      const userId = req.user.id;
      const { supabase } = require('../utils/supabase');

      // Get all user quests
      const activeQuests = await Quest.getUserActiveQuests(userId);
      const completedQuests = await Quest.getUserCompletedQuests(userId);

      // Count by status
      const stats = {
        total_active: activeQuests.length,
        active: activeQuests.filter(q => q.user_status === 'active').length,
        completed: activeQuests.filter(q => q.user_status === 'completed').length,
        claimed: completedQuests.length,
        can_claim: activeQuests.filter(q => q.can_claim).length
      };

      // Total rewards earned
      const { data: totalRewards } = await supabase
        .from('user_quest_claims')
        .select(' reward_experience')
        .eq('user_id', userId);

      const rewards = {
        total_gems: totalRewards?.reduce((sum, r) => sum + (r.reward_gems || 0), 0) || 0,     
      };

      res.json({
        success: true,
        stats,
        rewards
      });
    } catch (error) {
      console.error('Get quest statistics error:', error);
      res.status(500).json({
        success: false,
        message: 'Lỗi khi lấy thống kê nhiệm vụ'
      });
    }
  }
}

module.exports = UserQuestController;