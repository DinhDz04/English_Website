// backend/src/models/Exercise.js
const { supabase } = require('../utils/supabase');

class Exercise {
  // Get exercises by topic with pagination
  static async findByTopic(topicId, options = {}) {
    const { page = 1, limit = 50, search = '', type, difficulty } = options;

    let query = supabase
      .from('exercises')
      .select('*', { count: 'exact' })
      .eq('topic_id', topicId);

    if (search) {
      query = query.ilike('question', `%${search}%`);
    }

    if (type) {
      query = query.eq('type', type);
    }

    if (difficulty) {
      query = query.eq('difficulty', difficulty);
    }

    const { data, error, count } = await query
      .range((page - 1) * limit, page * limit - 1)
      .order('sort_order', { ascending: true })
      .order('created_at', { ascending: false });

    if (error) throw error;

    return {
      exercises: data,
      pagination: {
        total: count,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(count / limit),
      },
    };
  }

  // Get exercise by ID
  static async findById(id) {
    const { data, error } = await supabase
      .from('exercises')
      .select(`
        *,
        topics (
          id,
          name,
          level_id
        )
      `)
      .eq('id', id)
      .single();

    if (error) throw error;
    return data;
  }

  // Create exercise
  static async create(exerciseData) {
    const { data, error } = await supabase
      .from('exercises')
      .insert([exerciseData])
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  // Update exercise
  static async update(id, exerciseData) {
    const { data, error } = await supabase
      .from('exercises')
      .update(exerciseData)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  // Delete exercise
  static async delete(id) {
    const { error } = await supabase
      .from('exercises')
      .delete()
      .eq('id', id);

    if (error) throw error;
    return true;
  }

  // Bulk delete exercises
  static async bulkDelete(ids) {
    const { error } = await supabase
      .from('exercises')
      .delete()
      .in('id', ids);

    if (error) throw error;
    return true;
  }

  // Count exercises by topic
  static async countByTopic(topicId) {
    const { count, error } = await supabase
      .from('exercises')
      .select('*', { count: 'exact', head: true })
      .eq('topic_id', topicId);

    if (error) throw error;
    return count || 0;
  }
}

module.exports = Exercise;