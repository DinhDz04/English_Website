const { supabase } = require('../utils/supabase');

class Level {
  // Get all levels
  static async findAll() {
    const { data, error } = await supabase
      .from('levels')
      .select('*')
      .order('level_number', { ascending: true });

    if (error) throw error;
    return data;
  }

  // Get level by ID
  static async findById(id) {
    const { data, error } = await supabase
      .from('levels')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;
    return data;
  }

  // Get level with topics
  static async findByIdWithTopics(id) {
    const level = await this.findById(id);

    const { data: topics, error: topicsError } = await supabase
      .from('topics')
      .select('*')
      .eq('level_id', id)
      .order('sort_order', { ascending: true });

    if (topicsError) throw topicsError;

    return { ...level, topics };
  }

  // Create level
  static async create(levelData) {
    const { data, error } = await supabase
      .from('levels')
      .insert([levelData])
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  // Update level
  static async update(id, levelData) {
    const { data, error } = await supabase
      .from('levels')
      .update(levelData)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  // Delete level
  static async delete(id) {
    const { error } = await supabase
      .from('levels')
      .delete()
      .eq('id', id);

    if (error) throw error;
    return true;
  }

  // Count topics in level
  static async countTopics(levelId) {
    const { count, error } = await supabase
      .from('topics')
      .select('*', { count: 'exact', head: true })
      .eq('level_id', levelId);

    if (error) throw error;
    return count || 0;
  }

  // Get prerequisites for level
  static async getPrerequisites(levelId) {
    const { data, error } = await supabase
      .from('level_prerequisites')
      .select(`
        *,
        required_level:levels!level_prerequisites_required_level_id_fkey(
          id,
          level_number,
          name
        )
      `)
      .eq('level_id', levelId);

    if (error) throw error;
    return data || [];
  }

  // Create prerequisite
  static async createPrerequisite(prerequisiteData) {
    const { data, error } = await supabase
      .from('level_prerequisites')
      .insert([prerequisiteData])
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  // Delete prerequisite
  static async deletePrerequisite(prerequisiteId) {
    const { error } = await supabase
      .from('level_prerequisites')
      .delete()
      .eq('id', prerequisiteId);

    if (error) throw error;
    return true;
  }
}

module.exports = Level;