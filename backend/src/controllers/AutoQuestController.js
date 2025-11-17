// backend/src/controllers/AutoQuestController.js
const AutoQuestService = require('../services/AutoQuestService');
const { supabase } = require("../utils/supabase");

class AutoQuestController {
  // Cập nhật tự động - CHỈ TẠO THÊM, KHÔNG XÓA
  static async updateAutoQuests(req, res) {
    try {
      // Tạo nhiệm vụ mới
      const newQuests = await AutoQuestService.generateAutoQuests();
      
      // Lọc ra những nhiệm vụ chưa tồn tại
      const existingQuests = await AutoQuestController.getExistingAutoQuests();
      const questsToCreate = newQuests.filter(newQuest => 
        !existingQuests.some(existing => 
          existing.name === newQuest.name && 
          existing.type === newQuest.type
        )
      );

      if (questsToCreate.length === 0) {
        return res.json({
          message: 'Không có nhiệm vụ mới để thêm',
          stats: AutoQuestController.getQuestStatsByType(newQuests)
        });
      }

      // Lưu vào database
      const { data: createdQuests, error } = await supabase
        .from('quests')
        .insert(questsToCreate)
        .select();

      if (error) throw error;

      res.json({
        message: `Đã thêm ${createdQuests.length} nhiệm vụ mới`,
        quests: createdQuests,
        stats: AutoQuestController.getQuestStatsByType(createdQuests)
      });

    } catch (error) {
      console.error('Error updating auto quests:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  // Khởi tạo hệ thống - DÙNG AUTOQUEST SERVICE
  static async initializeSystemQuests(req, res) {
    try {
      // Tạo nhiệm vụ tự động
      const autoQuests = await AutoQuestService.generateAutoQuests();
      
      // Lọc ra những nhiệm vụ chưa tồn tại
      const existingQuests = await AutoQuestController.getExistingAutoQuests();
      const questsToCreate = autoQuests.filter(newQuest => 
        !existingQuests.some(existing => 
          existing.name === newQuest.name
        )
      );

      if (questsToCreate.length === 0) {
        return res.json({
          message: 'Hệ thống nhiệm vụ đã được khởi tạo trước đó',
          quests: []
        });
      }

      // Lưu vào database
      const { data: createdQuests, error } = await supabase
        .from('quests')
        .insert(questsToCreate)
        .select();

      if (error) throw error;

      res.json({
        message: `Đã khởi tạo ${createdQuests.length} nhiệm vụ hệ thống`,
        quests: createdQuests,
        stats: AutoQuestController.getQuestStatsByType(createdQuests)
      });

    } catch (error) {
      console.error('Error initializing system quests:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  // Xem trước các nhiệm vụ sẽ được tạo
  static async previewAutoQuests(req, res) {
    try {
      const previewQuests = await AutoQuestService.generateAutoQuests();
      const existingQuests = await AutoQuestController.getExistingAutoQuests();
      
      // Đánh dấu nhiệm vụ nào đã tồn tại
      const previewWithStatus = previewQuests.map(quest => ({
        ...quest,
        exists: existingQuests.some(existing => 
          existing.name === quest.name && 
          existing.type === quest.type
        )
      }));

      res.json({
        preview: previewWithStatus,
        total: previewQuests.length,
        new: previewWithStatus.filter(q => !q.exists).length,
        existing: previewWithStatus.filter(q => q.exists).length,
        by_type: AutoQuestController.getQuestStatsByType(previewQuests)
      });
    } catch (error) {
      console.error('Error previewing auto quests:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  // Helper: Lấy các nhiệm vụ auto-generated hiện có
  static async getExistingAutoQuests() {
    try {
      const { data, error } = await supabase
        .from('quests')
        .select('name, type, condition_type, condition_value')
        .eq('is_auto_generated', true);

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error getting existing auto quests:', error);
      return [];
    }
  }

  // Helper: Thống kê theo loại
  static getQuestStatsByType(quests) {
    return {
      level: quests.filter(q => q.type === 'level').length,
      topic: quests.filter(q => q.type === 'topic').length,
      vocabulary: quests.filter(q => q.type === 'vocabulary').length,
      streak: quests.filter(q => q.type === 'streak').length,
      total: quests.length
    };
  }
}

module.exports = AutoQuestController;