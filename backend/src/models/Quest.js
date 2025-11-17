// backend/src/models/Quest.js
const { supabase } = require('../utils/supabase');

class Quest {
  // Get all quests for user
  static async getUserQuests(userId, options = {}) {
    const { type, status, category } = options;
    
    let query = supabase
      .from('user_quests')
      .select(`
        *,
        quests (*)
      `)
      .eq('user_id', userId);

    if (status) query = query.eq('status', status);
    if (type) query = query.eq('quests.type', type);
    if (category) query = query.eq('quests.category', category);

    const { data, error } = await query.order('created_at', { ascending: false });

    if (error) throw error;
    return data;
  }

  // Create quest
  static async create(questData) {
    const { data, error } = await supabase
      .from('quests')
      .insert([questData])
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  // Update user quest progress
  static async updateProgress(userId, questId, progress) {
    const { data, error } = await supabase
      .from('user_quests')
      .update({ 
        progress,
        updated_at: new Date().toISOString()
      })
      .eq('user_id', userId)
      .eq('quest_id', questId)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  // Complete quest
  static async completeQuest(userId, questId) {
    const { data, error } = await supabase
      .from('user_quests')
      .update({ 
        status: 'completed',
        completed_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('user_id', userId)
      .eq('quest_id', questId)
      .select(`
        *,
        quests (*)
      `)
      .single();

    if (error) throw error;
    return data;
  }

  // Claim quest reward
  static async claimReward(userId, questId) {
    const { data: quest, error } = await supabase
      .from('user_quests')
      .update({ 
        status: 'claimed',
        claimed_at: new Date().toISOString()
      })
      .eq('user_id', userId)
      .eq('quest_id', questId)
      .select(`
        *,
        quests (*)
      `)
      .single();

    if (error) throw error;

    // Add rewards to user
    if (quest.quests.reward_points > 0) {
      await supabase.rpc('increment_user_points', {
        user_id: userId,
        points: quest.quests.reward_points
      });
    }

    if (quest.quests.reward_coins > 0) {
      await supabase.rpc('increment_user_coins', {
        user_id: userId,
        coins: quest.quests.reward_coins
      });
    }

    return quest;
  }

  // Auto-generate quests when new level/topic is created
  static async autoGenerateQuests(triggerType, resourceId, resourceData) {
    const { data: triggers } = await supabase
      .from('quest_triggers')
      .select('*')
      .eq('trigger_type', triggerType)
      .eq('is_active', true);

    for (const trigger of triggers) {
      const questData = this.buildQuestFromTemplate(trigger.quest_template, resourceData);
      await this.create(questData);
    }
  }

  static buildQuestFromTemplate(template, resourceData) {
    // Replace placeholders in template với resource data
    let quest = JSON.parse(JSON.stringify(template));
    
    quest.name = quest.name.replace('{name}', resourceData.name);
    quest.description = quest.description.replace('{name}', resourceData.name);
    quest.is_auto_generated = true;
    
    return quest;
  }

  // Get daily quests
  static async getDailyQuests(userId) {
    const today = new Date().toISOString().split('T')[0];
    
    const { data, error } = await supabase
      .from('user_quests')
      .select(`
        *,
        quests (*)
      `)
      .eq('user_id', userId)
      .eq('quests.type', 'daily')
      .eq('quests.is_recurring', true)
      .gte('created_at', today)
      .order('quests.sort_order', { ascending: true });

    if (error) throw error;
    return data;
  }

  // Initialize user quests (khi user mới đăng ký)
  static async initializeUserQuests(userId) {
    const { data: activeQuests } = await supabase
      .from('quests')
      .select('*')
      .eq('is_active', true)
      .neq('type', 'daily'); // Daily quests được tạo riêng

    const userQuests = activeQuests.map(quest => ({
      user_id: userId,
      quest_id: quest.id,
      target: quest.condition_value,
      progress: 0,
      status: 'active'
    }));

    const { error } = await supabase
      .from('user_quests')
      .insert(userQuests);

    if (error) throw error;
  }
}

module.exports = Quest;