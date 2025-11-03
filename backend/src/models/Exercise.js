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

  // backend/src/models/Exercise.js - Thêm vào class Exercise
static async findByTopicWithWords(topicId, options = {}) {
  const { page = 1, limit = 50 } = options;

  // First get words from the topic
  const { data: words, error: wordsError } = await supabase
    .from('words')
    .select('*')
    .eq('topic_id', topicId)
    .order('created_at', { ascending: false });

  if (wordsError) throw wordsError;

  // Then get existing exercises
  const { data: exercises, error: exercisesError } = await supabase
    .from('exercises')
    .select('*')
    .eq('topic_id', topicId);

  if (exercisesError) throw exercisesError;

  return {
    words,
    exercises,
    pagination: {
      total: words.length,
      page: parseInt(page),
      limit: parseInt(limit),
      totalPages: Math.ceil(words.length / limit),
    },
  };
}

// Generate exercises from words
static async generateFromWords(topicId, exerciseType) {
  const { data: words, error } = await supabase
    .from('words')
    .select('*')
    .eq('topic_id', topicId);

  if (error) throw error;

  const exercises = words.map((word, index) => {
    let exercise = {
      topic_id: topicId,
      word_id: word.id,
      type: exerciseType,
      difficulty: word.difficulty,
      points: 10,
      sort_order: index,
      created_at: new Date().toISOString()
    };

    switch (exerciseType) {
      case 'matching':
        exercise.question = `Nối từ "${word.word}" với nghĩa phù hợp`;
        exercise.correct_answer = word.meaning;
        break;
      case 'word_ordering':
        // For word ordering, we might use the example sentence or create from word
        const wordsArray = word.word.split(' ').concat(word.meaning.split(' '));
        exercise.question = `Sắp xếp các từ sau thành câu/cụm từ có nghĩa`;
        exercise.options = wordsArray.sort(() => Math.random() - 0.5);
        exercise.correct_answer = wordsArray.join(',');
        break;
      case 'fill_blank':
        exercise.question = `Điền từ thích hợp vào chỗ trống: "${word.example || `The word means: ${word.meaning}`}"`;
        exercise.correct_answer = word.word;
        break;
    }

    return exercise;
  });

  // Bulk insert generated exercises
  const { data, error: insertError } = await supabase
    .from('exercises')
    .insert(exercises)
    .select();

  if (insertError) throw insertError;
  return data;
}

// backend/src/models/Exercise.js - Thêm vào class Exercise
static async createFillBlankExercise(exerciseData) {
  const { data, error } = await supabase
    .from('exercises')
    .insert([{
      ...exerciseData,
      type: 'fill_blank'
    }])
    .select()
    .single();

  if (error) throw error;
  return data;
}

static async bulkCreateFillBlankExercises(exercisesData) {
  const exercisesWithType = exercisesData.map(exercise => ({
    ...exercise,
    type: 'fill_blank'
  }));

  const { data, error } = await supabase
    .from('exercises')
    .insert(exercisesWithType)
    .select();

  if (error) throw error;
  return data;
}

static async getExercisesForExport(topicId) {
  const { data, error } = await supabase
    .from('exercises')
    .select(`
      *,
      words (
        word,
        meaning,
        example
      )
    `)
    .eq('topic_id', topicId)
    .eq('type', 'fill_blank')
    .order('sort_order', { ascending: true });

  if (error) throw error;
  return data;
}

static async getWordsForTemplate(topicId) {
  const { data, error } = await supabase
    .from('words')
    .select('id, word, meaning, example, difficulty')
    .eq('topic_id', topicId)
    .order('created_at', { ascending: true });

  if (error) throw error;
  return data;
}
}

module.exports = Exercise;