const { supabase } = require('../utils/supabase');

class Topic {
  // Get all topics
  static async findAll(filters = {}) {
    let query = supabase
      .from('topics')
      .select(`
        *,
        levels (
          id,
          level_number,
          name,
          color_gradient,
          required_points
        )
      `)
      .order('sort_order', { ascending: true });

    if (filters.level_id) {
      query = query.eq('level_id', filters.level_id);
    }

    if (filters.difficulty) {
      query = query.eq('difficulty', filters.difficulty);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data;
  }

  // Get topic by ID
  static async findById(id) {
    const { data, error } = await supabase
      .from('topics')
      .select(`
        *,
        levels (
          id,
          level_number,
          name,
          color_gradient,
          required_points
        )
      `)
      .eq('id', id)
      .single();

    if (error) throw error;
    return data;
  }

  // Create topic
  static async create(topicData) {
    const { data, error } = await supabase
      .from('topics')
      .insert([topicData])
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  // Update topic
  static async update(id, topicData) {
    const { data, error } = await supabase
      .from('topics')
      .update(topicData)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  // Delete topic
  static async delete(id) {
    const { error } = await supabase
      .from('topics')
      .delete()
      .eq('id', id);

    if (error) throw error;
    return true;
  }

  // Count words in topic
  static async countWords(topicId) {
    const { count, error } = await supabase
      .from('words')
      .select('*', { count: 'exact', head: true })
      .eq('topic_id', topicId);

    if (error) throw error;
    return count || 0;
  }

  // Update total_words
  static async updateWordCount(topicId) {
    const count = await this.countWords(topicId);
    
    const { error } = await supabase
      .from('topics')
      .update({ total_words: count })
      .eq('id', topicId);

    if (error) throw error;
    return count;
  }
}

module.exports = Topic;