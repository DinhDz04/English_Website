// backend/src/controllers/AutoQuestController.js - AUTO QUEST GENERATOR
const AutoQuestService = require('../services/AutoQuestService');
const Quest = require('../models/Quest');
const { supabase } = require('../utils/supabase');

class AutoQuestController {
  // =============================================
  // INITIALIZE SYSTEM QUESTS
  // =============================================

  static async initializeSystemQuests(req, res) {
    try {
      console.log('🚀 Initializing system quests...');

      // Generate quests
      const generatedQuests = await AutoQuestService.generateAutoQuests();

      // Get existing quests to avoid duplicates
      const { data: existingQuests } = await supabase
        .from('quests')
        .select('name, type, condition_type, condition_value')
        .eq('is_auto_generated', true);

      // Filter out existing quests
      const questsToCreate = generatedQuests.filter(newQuest => {
        return !existingQuests?.some(existing => 
          existing.name === newQuest.name &&
          existing.type === newQuest.type &&
          existing.condition_type === newQuest.condition_type &&
          existing.condition_value === newQuest.condition_value
        );
      });

      if (questsToCreate.length === 0) {
        return res.json({
          success: true,
          message: 'Hệ thống nhiệm vụ đã được khởi tạo',
          quests: []
        });
      }

      // Create quests
      const { data: createdQuests, error } = await supabase
        .from('quests')
        .insert(questsToCreate)
        .select();

      if (error) throw error;

      // Sync to all users
      const nonDailyQuests = createdQuests.filter(q => q.type !== 'daily');
      if (nonDailyQuests.length > 0) {
        await AutoQuestController.syncQuestsToAllUsers(
          nonDailyQuests.map(q => q.id)
        );
      }

      res.json({
        success: true,
        message: `Đã tạo ${createdQuests.length} nhiệm vụ và đồng bộ cho tất cả users`,
        quests: createdQuests,
        stats: AutoQuestController.getQuestStats(createdQuests)
      });
    } catch (error) {
      console.error('Initialize system quests error:', error);
      res.status(500).json({
        success: false,
        message: 'Lỗi khi khởi tạo hệ thống nhiệm vụ'
      });
    }
  }

  // =============================================
  // UPDATE AUTO QUESTS
  // =============================================

  static async updateAutoQuests(req, res) {
    try {
      console.log('🔄 Updating auto quests...');

      // Generate new quests
      const generatedQuests = await AutoQuestService.generateAutoQuests();

      // Get existing quests
      const { data: existingQuests } = await supabase
        .from('quests')
        .select('name, type, condition_type, condition_value')
        .eq('is_auto_generated', true);

      // Filter new quests
      const questsToCreate = generatedQuests.filter(newQuest => {
        return !existingQuests?.some(existing => 
          existing.name === newQuest.name &&
          existing.type === newQuest.type
        );
      });

      if (questsToCreate.length === 0) {
        return res.json({
          success: true,
          message: 'Không có nhiệm vụ mới để thêm',
          quests: []
        });
      }

      // Create new quests
      const { data: createdQuests, error } = await supabase
        .from('quests')
        .insert(questsToCreate)
        .select();

      if (error) throw error;

      // Sync to users
      const nonDailyQuests = createdQuests.filter(q => q.type !== 'daily');
      if (nonDailyQuests.length > 0) {
        await AutoQuestController.syncQuestsToAllUsers(
          nonDailyQuests.map(q => q.id)
        );
      }

      res.json({
        success: true,
        message: `Đã thêm ${createdQuests.length} nhiệm vụ mới`,
        quests: createdQuests,
        stats: AutoQuestController.getQuestStats(createdQuests)
      });
    } catch (error) {
      console.error('Update auto quests error:', error);
      res.status(500).json({
        success: false,
        message: 'Lỗi khi cập nhật nhiệm vụ tự động'
      });
    }
  }

  // =============================================
  // PREVIEW AUTO QUESTS
  // =============================================

  static async previewAutoQuests(req, res) {
    try {
      const generatedQuests = await AutoQuestService.generateAutoQuests();

      const { data: existingQuests } = await supabase
        .from('quests')
        .select('name, type')
        .eq('is_auto_generated', true);

      const preview = generatedQuests.map(quest => ({
        ...quest,
        exists: existingQuests?.some(e => 
          e.name === quest.name && e.type === quest.type
        ) || false
      }));

      res.json({
        success: true,
        preview,
        stats: {
          total: preview.length,
          new: preview.filter(q => !q.exists).length,
          existing: preview.filter(q => q.exists).length,
          by_type: AutoQuestController.getQuestStats(preview)
        }
      });
    } catch (error) {
      console.error('Preview auto quests error:', error);
      res.status(500).json({
        success: false,
        message: 'Lỗi khi xem trước nhiệm vụ'
      });
    }
  }

  // =============================================
  // SYNC FUNCTIONS
  // =============================================

  static async syncQuestsToAllUsers(questIds) {
    try {
      console.log(`🔄 Syncing ${questIds.length} quests to all users...`);

      // Get quests info
      const { data: quests } = await supabase
        .from('quests')
        .select('id, condition_value')
        .in('id', questIds);

      if (!quests || quests.length === 0) return;

      // Get all users
      const { data: users } = await supabase
        .from('users')
        .select('id');

      if (!users || users.length === 0) return;

      // Get existing user_quests
      const { data: existingUserQuests } = await supabase
        .from('user_quests')
        .select('user_id, quest_id')
        .in('quest_id', questIds);

      const existingMap = new Map();
      existingUserQuests?.forEach(uq => {
        const key = `${uq.user_id}_${uq.quest_id}`;
        existingMap.set(key, true);
      });

      // Create user_quests for users who don't have them
      const userQuestsToCreate = [];

      for (const user of users) {
        for (const quest of quests) {
          const key = `${user.id}_${quest.id}`;
          if (!existingMap.has(key)) {
            userQuestsToCreate.push({
              user_id: user.id,
              quest_id: quest.id,
              progress: 0,
              target: quest.condition_value || 1,
              status: 'active',
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            });
          }
        }
      }

      if (userQuestsToCreate.length === 0) {
        console.log('✅ All users already have these quests');
        return;
      }

      // Batch insert
      const { error } = await supabase
        .from('user_quests')
        .insert(userQuestsToCreate);

      if (error) throw error;

      console.log(`✅ Created ${userQuestsToCreate.length} user_quests`);
    } catch (error) {
      console.error('Error syncing quests to users:', error);
    }
  }

  // Sync single quest
  static async syncQuestToUsers(req, res) {
    try {
      const { questId } = req.params;

      await AutoQuestController.syncQuestsToAllUsers([questId]);

      res.json({
        success: true,
        message: 'Đồng bộ nhiệm vụ thành công'
      });
    } catch (error) {
      console.error('Sync quest error:', error);
      res.status(500).json({
        success: false,
        message: 'Lỗi khi đồng bộ nhiệm vụ'
      });
    }
  }

  // Sync all quests
  static async syncAllQuestsToUsers(req, res) {
    try {
      const { data: activeQuests } = await supabase
        .from('quests')
        .select('id')
        .eq('is_active', true)
        .neq('type', 'daily');

      if (!activeQuests || activeQuests.length === 0) {
        return res.json({
          success: true,
          message: 'Không có nhiệm vụ nào để đồng bộ'
        });
      }

      const questIds = activeQuests.map(q => q.id);
      await AutoQuestController.syncQuestsToAllUsers(questIds);

      res.json({
        success: true,
        message: `Đã đồng bộ ${questIds.length} nhiệm vụ`
      });
    } catch (error) {
      console.error('Sync all quests error:', error);
      res.status(500).json({
        success: false,
        message: 'Lỗi khi đồng bộ tất cả nhiệm vụ'
      });
    }
  }

  // =============================================
  // HELPER FUNCTIONS
  // =============================================

  static getQuestStats(quests) {
    return {
      level: quests.filter(q => q.type === 'level').length,
      topic: quests.filter(q => q.type === 'topic').length,
      vocabulary: quests.filter(q => q.type === 'vocabulary').length,
      streak: quests.filter(q => q.type === 'streak').length,
      achievement: quests.filter(q => q.type === 'achievement').length,
      daily: quests.filter(q => q.type === 'daily').length,
      total: quests.length
    };
  }
}

module.exports = AutoQuestController;