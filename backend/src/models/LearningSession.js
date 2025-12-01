const { supabase } = require('../utils/supabase');

class LearningSession {
  // Tạo session mới
  static async create(sessionData) {
    const { data, error } = await supabase
      .from('learning_sessions')
      .insert([sessionData])
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  // Lấy session theo ID
  static async findById(id) {
    const { data, error } = await supabase
      .from('learning_sessions')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;
    return data;
  }

  // Cập nhật session
  static async update(id, updateData) {
    const { data, error } = await supabase
      .from('learning_sessions')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  // Lấy sessions của user
  static async findByUser(userId, options = {}) {
    const { page = 1, limit = 20, status } = options;
    
    let query = supabase
      .from('learning_sessions')
      .select('*', { count: 'exact' })
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (status) {
      query = query.eq('status', status);
    }

    const { data, error, count } = await query
      .range((page - 1) * limit, page * limit - 1);

    if (error) throw error;

    return {
      sessions: data,
      pagination: {
        total: count,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(count / limit),
      },
    };
  }
}

module.exports = LearningSession;