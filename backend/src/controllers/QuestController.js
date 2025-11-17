// backend/src/controllers/questController.js


const { supabase } = require('../utils/supabase');
const questTemplates = require('../data/questTemplates');
const Quest = require('../models/Quest');
class QuestController {
  // Get all quests
  static async getAllQuests(req, res) {
    try {
      const { type, category, is_active } = req.query;
      
      let query = supabase
        .from('quests')
        .select('*')
        .order('created_at', { ascending: false });

      if (type) query = query.eq('type', type);
      if (category) query = query.eq('category', category);
      if (is_active !== undefined) query = query.eq('is_active', is_active === 'true');

      const { data, error } = await query;

      if (error) throw error;

      res.json({ quests: data });
    } catch (error) {
      console.error('Error getting quests:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  // Get quest by ID
  static async getQuestById(req, res) {
    try {
      const { id } = req.params;
      
      const { data, error } = await supabase
        .from('quests')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      if (!data) return res.status(404).json({ error: 'Quest not found' });

      res.json({ quest: data });
    } catch (error) {
      console.error('Error getting quest:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  // Create quest
  static async createQuest(req, res) {
    try {
      const questData = req.body;
      
      const quest = await Quest.create(questData);
      
      res.status(201).json({ quest });
    } catch (error) {
      console.error('Error creating quest:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  // Update quest
  static async updateQuest(req, res) {
    try {
      const { id } = req.params;
      const questData = req.body;
      
      const { data, error } = await supabase
        .from('quests')
        .update(questData)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      res.json({ quest: data });
    } catch (error) {
      console.error('Error updating quest:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  // Delete quest
  static async deleteQuest(req, res) {
    try {
      const { id } = req.params;
      
      const { error } = await supabase
        .from('quests')
        .delete()
        .eq('id', id);

      if (error) throw error;

      res.json({ message: 'Quest deleted successfully' });
    } catch (error) {
      console.error('Error deleting quest:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  // Bulk create quests from templates
  static async bulkCreateQuests(req, res) {
    try {
      const { templateType } = req.body;
      
      if (!questTemplates[templateType]) {
        return res.status(400).json({ error: 'Invalid template type' });
      }

      const templates = questTemplates[templateType];
      const createdQuests = [];

      for (const template of templates) {
        try {
          const quest = await Quest.create(template);
          createdQuests.push(quest);
        } catch (error) {
          console.error(`Error creating quest from template:`, error);
          // Continue with other templates
        }
      }

      res.status(201).json({
        message: `Created ${createdQuests.length} quests from ${templateType} template`,
        quests: createdQuests
      });
    } catch (error) {
      console.error('Error bulk creating quests:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  // Get quest templates
  static async getQuestTemplates(req, res) {
    try {
      res.json({ templates: questTemplates });
    } catch (error) {
      console.error('Error getting quest templates:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  // Get quest statistics
  static async getQuestStats(req, res) {
    try {
      // Total quests by type
      const { data: typeStats, error: typeError } = await supabase
        .from('quests')
        .select('type')
        .then(result => {
          const stats = {};
          result.data.forEach(quest => {
            stats[quest.type] = (stats[quest.type] || 0) + 1;
          });
          return { data: stats };
        });

      if (typeError) throw typeError;

      // Active vs inactive quests
      const { data: statusStats, error: statusError } = await supabase
        .from('quests')
        .select('is_active')
        .then(result => {
          const stats = { active: 0, inactive: 0 };
          result.data.forEach(quest => {
            if (quest.is_active) stats.active++;
            else stats.inactive++;
          });
          return { data: stats };
        });

      if (statusError) throw statusError;

      // User completion stats
      const { data: completionStats, error: completionError } = await supabase
        .from('user_quests')
        .select('status')
        .then(result => {
          const stats = { active: 0, completed: 0, claimed: 0 };
          result.data.forEach(userQuest => {
            stats[userQuest.status]++;
          });
          return { data: stats };
        });

      if (completionError) throw completionError;

      res.json({
        stats: {
          by_type: typeStats,
          by_status: statusStats,
          user_completion: completionStats
        }
      });
    } catch (error) {
      console.error('Error getting quest stats:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  // Toggle quest active status
  static async toggleQuestStatus(req, res) {
    try {
      const { id } = req.params;
      
      // Get current status
      const { data: quest, error: fetchError } = await supabase
        .from('quests')
        .select('is_active')
        .eq('id', id)
        .single();

      if (fetchError) throw fetchError;

      // Toggle status
      const { data, error } = await supabase
        .from('quests')
        .update({ is_active: !quest.is_active })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      res.json({ 
        quest: data,
        message: `Quest ${data.is_active ? 'activated' : 'deactivated'} successfully`
      });
    } catch (error) {
      console.error('Error toggling quest status:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  // Initialize system with default quests
 static async initializeSystemQuests(req, res) {
  try {
    // Chuyển hướng sang AutoQuestController
    const AutoQuestController = require('./AutoQuestController');
    return AutoQuestController.initializeSystemQuests(req, res);
  } catch (error) {
    console.error('Error initializing system quests:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}
}

module.exports = QuestController;