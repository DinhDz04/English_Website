const { supabase } = require('../utils/supabase');

class Topic {
  // Get all topics
  static async findAll(filters = {}) {
    try {
      let query = supabase
        .from('topics')
        .select(`
          *,
          levels (
            id,
            level_number,
            name,
            color_start,
            color_end,
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
      return data || [];
    } catch (error) {
      console.error('Error in Topic.findAll:', error);
      throw error;
    }
  }

  // Get topic by ID - SỬA: dùng maybeSingle()
  static async findById(id) {
    try {
      const { data, error } = await supabase
        .from('topics')
        .select(`
          *,
          levels (
            id,
            level_number,
            name,
            color_start,
            color_end,
            required_points
          )
        `)
        .eq('id', id)
        .maybeSingle(); // SỬA: .maybeSingle() thay vì .single()

      if (error) throw error;
      return data; // Có thể trả về null nếu không tìm thấy
    } catch (error) {
      console.error('Error in Topic.findById:', error);
      throw error;
    }
  }

  // Create topic
  static async create(topicData) {
    try {
      const { data, error } = await supabase
        .from('topics')
        .insert([topicData])
        .select(`
          *,
          levels (
            id,
            level_number,
            name,
            color_start,
            color_end,
            required_points
          )
        `)
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error in Topic.create:', error);
      throw error;
    }
  }

  // Update topic
 // Update topic
static async update(id, topicData) {
  try {
    // Thêm kiểm tra topic có tồn tại không
    const existingTopic = await this.findById(id);
    if (!existingTopic) {
      throw new Error('Topic not found');
    }

    const { data, error } = await supabase
      .from('topics')
      .update(topicData)
      .eq('id', id)
      .select(`
        *,
        levels (
          id,
          level_number,
          name,
          color_start,
          color_end,
          required_points
        )
      `)
      .maybeSingle(); // Sửa: dùng maybeSingle() thay vì single()

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error in Topic.update:', error);
    throw error;
  }
}

  // Delete topic
  static async delete(id) {
    try {
      const { error } = await supabase
        .from('topics')
        .delete()
        .eq('id', id);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error in Topic.delete:', error);
      throw error;
    }
  }

  // Count words in topic
  static async countWords(topicId) {
    try {
      const { count, error } = await supabase
        .from('words')
        .select('*', { count: 'exact', head: true })
        .eq('topic_id', topicId);

      if (error) throw error;
      return count || 0;
    } catch (error) {
      console.error('Error in Topic.countWords:', error);
      throw error;
    }
  }

  // Update total_words
  static async updateWordCount(topicId) {
    try {
      const count = await this.countWords(topicId);
      
      const { error } = await supabase
        .from('topics')
        .update({ total_words: count })
        .eq('id', topicId);

      if (error) throw error;
      return count;
    } catch (error) {
      console.error('Error in Topic.updateWordCount:', error);
      throw error;
    }
  }
}

module.exports = Topic;