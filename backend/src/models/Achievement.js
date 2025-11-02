const { supabase } = require('../utils/supabase');

// ========== Achievement Model ==========
class Achievement {
  static async findAll() {
    const { data, error } = await supabase
      .from('achievements')
      .select('*')
      .order('condition_value', { ascending: true });

    if (error) throw error;
    return data;
  }

  static async findById(id) {
    const { data, error } = await supabase
      .from('achievements')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;
    return data;
  }

  static async create(achievementData) {
    const { data, error } = await supabase
      .from('achievements')
      .insert([achievementData])
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  static async update(id, achievementData) {
    const { data, error } = await supabase
      .from('achievements')
      .update(achievementData)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  static async delete(id) {
    const { error } = await supabase
      .from('achievements')
      .delete()
      .eq('id', id);

    if (error) throw error;
    return true;
  }

  static async findByType(conditionType) {
    const { data, error } = await supabase
      .from('achievements')
      .select('*')
      .eq('condition_type', conditionType)
      .order('condition_value', { ascending: true });

    if (error) throw error;
    return data;
  }
}

// ========== Daily Challenge Model ==========
class DailyChallenge {
  static async findAll(limit = 30) {
    const { data, error } = await supabase
      .from('daily_challenges')
      .select('*')
      .order('challenge_date', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return data;
  }

  static async findById(id) {
    const { data, error } = await supabase
      .from('daily_challenges')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;
    return data;
  }

  static async findByDate(date) {
    const { data, error } = await supabase
      .from('daily_challenges')
      .select('*')
      .eq('challenge_date', date)
      .single();

    if (error) return null;
    return data;
  }

  static async create(challengeData) {
    const { data, error } = await supabase
      .from('daily_challenges')
      .insert([challengeData])
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  static async update(id, challengeData) {
    const { data, error } = await supabase
      .from('daily_challenges')
      .update(challengeData)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  static async delete(id) {
    const { error } = await supabase
      .from('daily_challenges')
      .delete()
      .eq('id', id);

    if (error) throw error;
    return true;
  }

  static async getToday() {
    const today = new Date().toISOString().split('T')[0];
    return await this.findByDate(today);
  }
}

module.exports = { Achievement, DailyChallenge };