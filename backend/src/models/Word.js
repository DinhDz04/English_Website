const { supabase } = require('../utils/supabase');

class Word {
  // Get words by topic with pagination
  static async findByTopic(topicId, options = {}) {
    const { page = 1, limit = 50, search = '', difficulty } = options;

    let query = supabase
      .from('words')
      .select('*', { count: 'exact' })
      .eq('topic_id', topicId);

    if (search) {
      query = query.or(`word.ilike.%${search}%,meaning.ilike.%${search}%`);
    }

    if (difficulty) {
      query = query.eq('difficulty', difficulty);
    }

    const { data, error, count } = await query
      .range((page - 1) * limit, page * limit - 1)
      .order('created_at', { ascending: false });

    if (error) throw error;

    return {
      words: data,
      pagination: {
        total: count,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(count / limit),
      },
    };
  }

  // Get word by ID
  static async findById(id) {
    const { data, error } = await supabase
      .from('words')
      .select(`
        *,
        topics (
          id,
          name,
          difficulty
        )
      `)
      .eq('id', id)
      .single();

    if (error) throw error;
    return data;
  }

  // Create word
  static async create(wordData) {
    const { data, error } = await supabase
      .from('words')
      .insert([wordData])
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  // Update word
  static async update(id, wordData) {
    const { data, error } = await supabase
      .from('words')
      .update(wordData)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  // Delete word
  static async delete(id) {
    const { error } = await supabase
      .from('words')
      .delete()
      .eq('id', id);

    if (error) throw error;
    return true;
  }

  // Bulk delete words
  static async bulkDelete(ids) {
    const { error } = await supabase
      .from('words')
      .delete()
      .in('id', ids);

    if (error) throw error;
    return true;
  }

  // Get topic_id before delete
  static async getTopicId(id) {
    const { data, error } = await supabase
      .from('words')
      .select('topic_id')
      .eq('id', id)
      .single();

    if (error) throw error;
    return data?.topic_id;
  }

  // Get topic_ids for multiple words
  static async getTopicIds(ids) {
    const { data, error } = await supabase
      .from('words')
      .select('topic_id')
      .in('id', ids);

    if (error) throw error;
    return [...new Set(data.map(w => w.topic_id))];
  }

  // Bulk insert words
  static async bulkCreate(wordsArray) {
    const { data, error } = await supabase
      .from('words')
      .insert(wordsArray)
      .select();

    if (error) throw error;
    return data;
  }

  // Export words by topic
  static async exportByTopic(topicId) {
    const { data, error } = await supabase
      .from('words')
      .select('word, pronunciation, meaning, example, difficulty')
      .eq('topic_id', topicId);

    if (error) throw error;
    return data;
  }
}

module.exports = Word;