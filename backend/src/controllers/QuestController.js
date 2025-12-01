// backend/src/controllers/QuestController.js - ADMIN CONTROLLER
const Quest = require('../models/Quest');
const { supabase } = require('../utils/supabase');

class QuestController {
  // =============================================
  // GET REQUESTS
  // =============================================

  // Get all quests
  static async getAllQuests(req, res) {
    try {
      const { type, category, is_active } = req.query;

      const filters = {};
      if (type) filters.type = type;
      if (category) filters.category = category;
      if (is_active !== undefined) filters.is_active = is_active === 'true';

      const quests = await Quest.getAllQuests(filters);

      res.json({
        success: true,
        quests
      });
    } catch (error) {
      console.error('Get all quests error:', error);
      res.status(500).json({
        success: false,
        message: 'Lỗi khi lấy danh sách nhiệm vụ'
      });
    }
  }

  // Get quest by ID
  static async getQuestById(req, res) {
    try {
      const { id } = req.params;

      const { data: quest, error } = await supabase
        .from('quests')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;

      if (!quest) {
        return res.status(404).json({
          success: false,
          message: 'Không tìm thấy nhiệm vụ'
        });
      }

      res.json({
        success: true,
        quest
      });
    } catch (error) {
      console.error('Get quest by ID error:', error);
      res.status(500).json({
        success: false,
        message: 'Lỗi khi lấy thông tin nhiệm vụ'
      });
    }
  }

  // Get quest statistics
  static async getQuestStats(req, res) {
    try {
      const { data: allQuests } = await supabase
        .from('quests')
        .select('type, is_active');

      const { data: userQuests } = await supabase
        .from('user_quests')
        .select('status');

      const { data: claims } = await supabase
        .from('user_quest_claims')
        .select('id');

      // Stats by type
      const byType = {};
      allQuests?.forEach(q => {
        byType[q.type] = (byType[q.type] || 0) + 1;
      });

      // Stats by status
      const active = allQuests?.filter(q => q.is_active).length || 0;
      const inactive = allQuests?.filter(q => !q.is_active).length || 0;

      // User completion stats
      const userStats = {
        active: userQuests?.filter(uq => uq.status === 'active').length || 0,
        completed: userQuests?.filter(uq => uq.status === 'completed').length || 0,
        claimed: claims?.length || 0
      };

      res.json({
        success: true,
        stats: {
          total: allQuests?.length || 0,
          by_type: byType,
          by_status: { active, inactive },
          user_completion: userStats
        }
      });
    } catch (error) {
      console.error('Get quest stats error:', error);
      res.status(500).json({
        success: false,
        message: 'Lỗi khi lấy thống kê nhiệm vụ'
      });
    }
  }

  // =============================================
  // CREATE REQUESTS
  // =============================================

  // Create single quest
  static async createQuest(req, res) {
    try {
      const questData = req.body;

      // Validate required fields
      if (!questData.name || !questData.type || !questData.condition_type) {
        return res.status(400).json({
          success: false,
          message: 'Thiếu thông tin bắt buộc'
        });
      }

      // Create quest
      const quest = await Quest.createQuest(questData);

      // Sync to users if active
      if (quest.is_active && quest.type !== 'daily') {
        await QuestController.syncQuestToAllUsers(quest.id);
      }

      res.status(201).json({
        success: true,
        message: 'Tạo nhiệm vụ thành công',
        quest
      });
    } catch (error) {
      console.error('Create quest error:', error);
      res.status(500).json({
        success: false,
        message: 'Lỗi khi tạo nhiệm vụ'
      });
    }
  }

  // Bulk create quests
  static async bulkCreateQuests(req, res) {
    try {
      const { quests } = req.body;

      if (!Array.isArray(quests) || quests.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'Dữ liệu không hợp lệ'
        });
      }

      const createdQuests = [];
      const errors = [];

      for (const questData of quests) {
        try {
          const quest = await Quest.createQuest(questData);
          createdQuests.push(quest);

          // Sync to users if active
          if (quest.is_active && quest.type !== 'daily') {
            await QuestController.syncQuestToAllUsers(quest.id);
          }
        } catch (error) {
          errors.push({
            quest: questData.name,
            error: error.message
          });
        }
      }

      res.status(201).json({
        success: true,
        message: `Tạo thành công ${createdQuests.length}/${quests.length} nhiệm vụ`,
        created: createdQuests,
        errors: errors.length > 0 ? errors : undefined
      });
    } catch (error) {
      console.error('Bulk create quests error:', error);
      res.status(500).json({
        success: false,
        message: 'Lỗi khi tạo nhiệm vụ hàng loạt'
      });
    }
  }

  // =============================================
  // UPDATE REQUESTS
  // =============================================

  // Update quest
  static async updateQuest(req, res) {
    try {
      const { id } = req.params;
      const questData = req.body;

      // Get old quest data
      const { data: oldQuest } = await supabase
        .from('quests')
        .select('*')
        .eq('id', id)
        .single();

      if (!oldQuest) {
        return res.status(404).json({
          success: false,
          message: 'Không tìm thấy nhiệm vụ'
        });
      }

      // Update quest
      const updatedQuest = await Quest.updateQuest(id, questData);

      // Sync changes to users
      await QuestController.syncQuestChanges(id, oldQuest, updatedQuest);

      res.json({
        success: true,
        message: 'Cập nhật nhiệm vụ thành công',
        quest: updatedQuest
      });
    } catch (error) {
      console.error('Update quest error:', error);
      res.status(500).json({
        success: false,
        message: 'Lỗi khi cập nhật nhiệm vụ'
      });
    }
  }

  // Toggle quest status
  static async toggleQuestStatus(req, res) {
    try {
      const { id } = req.params;

      const { data: quest } = await supabase
        .from('quests')
        .select('is_active, type')
        .eq('id', id)
        .single();

      if (!quest) {
        return res.status(404).json({
          success: false,
          message: 'Không tìm thấy nhiệm vụ'
        });
      }

      const newStatus = !quest.is_active;

      const updatedQuest = await Quest.updateQuest(id, {
        is_active: newStatus
      });

      // Sync to users
      if (newStatus && quest.type !== 'daily') {
        await QuestController.syncQuestToAllUsers(id);
      } else if (!newStatus) {
        await QuestController.hideQuestFromAllUsers(id);
      }

      res.json({
        success: true,
        message: newStatus ? 'Đã kích hoạt nhiệm vụ' : 'Đã vô hiệu hóa nhiệm vụ',
        quest: updatedQuest
      });
    } catch (error) {
      console.error('Toggle quest status error:', error);
      res.status(500).json({
        success: false,
        message: 'Lỗi khi thay đổi trạng thái nhiệm vụ'
      });
    }
  }

  // =============================================
  // DELETE REQUESTS
  // =============================================

  // Delete quest
  static async deleteQuest(req, res) {
    try {
      const { id } = req.params;

      await Quest.deleteQuest(id);

      res.json({
        success: true,
        message: 'Xóa nhiệm vụ thành công'
      });
    } catch (error) {
      console.error('Delete quest error:', error);
      res.status(500).json({
        success: false,
        message: 'Lỗi khi xóa nhiệm vụ'
      });
    }
  }

  // =============================================
  // SYNC FUNCTIONS
  // =============================================

  // Sync quest to all users
  static async syncQuestToAllUsers(questId) {
    try {
      console.log(`🔄 Syncing quest ${questId} to all users...`);

      const { data: quest } = await supabase
        .from('quests')
        .select('condition_value')
        .eq('id', questId)
        .single();

      if (!quest) return;

      const { data: users } = await supabase
        .from('users')
        .select('id');

      if (!users || users.length === 0) return;

      // Check existing user_quests
      const { data: existingUserQuests } = await supabase
        .from('user_quests')
        .select('user_id')
        .eq('quest_id', questId);

      const existingUserIds = existingUserQuests?.map(uq => uq.user_id) || [];
      const newUsers = users.filter(u => !existingUserIds.includes(u.id));

      if (newUsers.length === 0) {
        console.log('✅ All users already have this quest');
        return;
      }

      // Create user_quests for new users
      const userQuests = newUsers.map(user => ({
        user_id: user.id,
        quest_id: questId,
        progress: 0,
        target: quest.condition_value || 1,
        status: 'active',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }));

      await supabase
        .from('user_quests')
        .insert(userQuests);

      console.log(`✅ Synced quest to ${newUsers.length} users`);
    } catch (error) {
      console.error('Error syncing quest to users:', error);
    }
  }

  // Hide quest from all users
  static async hideQuestFromAllUsers(questId) {
    try {
      await supabase
        .from('user_quests')
        .update({
          status: 'hidden',
          updated_at: new Date().toISOString()
        })
        .eq('quest_id', questId);

      console.log(`✅ Hidden quest ${questId} from all users`);
    } catch (error) {
      console.error('Error hiding quest from users:', error);
    }
  }

  // Sync quest changes to users
  static async syncQuestChanges(questId, oldQuest, newQuest) {
    try {
      const updates = {};

      // If condition_value changed, update target
      if (oldQuest.condition_value !== newQuest.condition_value) {
        updates.target = newQuest.condition_value;
      }

      // If is_active changed
      if (oldQuest.is_active !== newQuest.is_active) {
        if (newQuest.is_active && newQuest.type !== 'daily') {
          await QuestController.syncQuestToAllUsers(questId);
        } else if (!newQuest.is_active) {
          await QuestController.hideQuestFromAllUsers(questId);
        }
      }

      // Apply updates if any
      if (Object.keys(updates).length > 0) {
        updates.updated_at = new Date().toISOString();
        
        await supabase
          .from('user_quests')
          .update(updates)
          .eq('quest_id', questId);

        console.log(`✅ Updated user_quests for quest ${questId}`);
      }
    } catch (error) {
      console.error('Error syncing quest changes:', error);
    }
  }

  // Sync single quest to users (endpoint)
  static async syncQuestToUsers(req, res) {
    try {
      const { questId } = req.params;

      await QuestController.syncQuestToAllUsers(questId);

      res.json({
        success: true,
        message: 'Đồng bộ nhiệm vụ thành công'
      });
    } catch (error) {
      console.error('Sync quest to users error:', error);
      res.status(500).json({
        success: false,
        message: 'Lỗi khi đồng bộ nhiệm vụ'
      });
    }
  }

  // Sync all quests to users (endpoint)
  static async syncAllQuestsToUsers(req, res) {
    try {
      const { data: activeQuests } = await supabase
        .from('quests')
        .select('id, type')
        .eq('is_active', true);

      if (!activeQuests || activeQuests.length === 0) {
        return res.json({
          success: true,
          message: 'Không có nhiệm vụ nào để đồng bộ'
        });
      }

      let syncCount = 0;
      for (const quest of activeQuests) {
        if (quest.type !== 'daily') {
          await QuestController.syncQuestToAllUsers(quest.id);
          syncCount++;
        }
      }

      res.json({
        success: true,
        message: `Đã đồng bộ ${syncCount} nhiệm vụ`
      });
    } catch (error) {
      console.error('Sync all quests error:', error);
      res.status(500).json({
        success: false,
        message: 'Lỗi khi đồng bộ tất cả nhiệm vụ'
      });
    }
  }
}

module.exports = QuestController;