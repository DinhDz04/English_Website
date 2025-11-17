// backend/src/controllers/exerciseController.js
const Exercise = require('../models/Exercise');
const AIService = require('../services/AIService');
const { supabase } = require("../utils/supabase");

class ExerciseController {
  // Get exercises by topic
  static async getExercisesByTopic(req, res) {
    try {
      const { topicId } = req.params;
      const { page, limit, search, type, difficulty } = req.query;

      const result = await Exercise.findByTopic(topicId, {
        page: parseInt(page) || 1,
        limit: parseInt(limit) || 50,
        search: search || '',
        type: type || '',
        difficulty: difficulty || ''
      });

      res.json(result);
    } catch (error) {
      console.error('Error getting exercises:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  // Get exercise by ID
  static async getExerciseById(req, res) {
    try {
      const { id } = req.params;
      const exercise = await Exercise.findById(id);
      
      if (!exercise) {
        return res.status(404).json({ error: 'Exercise not found' });
      }

      res.json({ exercise });
    } catch (error) {
      console.error('Error getting exercise:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  // Create exercise
  static async createExercise(req, res) {
    try {
      const exerciseData = req.body;
      const exercise = await Exercise.create(exerciseData);
      
      res.status(201).json({ exercise });
    } catch (error) {
      console.error('Error creating exercise:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  // Update exercise
  static async updateExercise(req, res) {
    try {
      const { id } = req.params;
      const exerciseData = req.body;
      
      const exercise = await Exercise.update(id, exerciseData);
      res.json({ exercise });
    } catch (error) {
      console.error('Error updating exercise:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  // Delete exercise
  static async deleteExercise(req, res) {
    try {
      const { id } = req.params;
      await Exercise.delete(id);
      
      res.json({ message: 'Exercise deleted successfully' });
    } catch (error) {
      console.error('Error deleting exercise:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
// backend/src/controllers/exerciseController.js - Thêm vào class
static async getWordsAndExercises(req, res) {
  try {
    const { topicId } = req.params;
    const { page, limit } = req.query;

    const result = await Exercise.findByTopicWithWords(topicId, {
      page: parseInt(page) || 1,
      limit: parseInt(limit) || 50,
    });

    res.json(result);
  } catch (error) {
    console.error('Error getting words and exercises:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

static async generateExercises(req, res) {
  try {
    const { topicId } = req.params;
    const { type } = req.body;

    if (!['matching', 'word_ordering', 'fill_blank'].includes(type)) {
      return res.status(400).json({ error: 'Invalid exercise type' });
    }

    const exercises = await Exercise.generateFromWords(topicId, type);
    
    res.json({ 
      message: `Generated ${exercises.length} ${type} exercises successfully`,
      exercises 
    });
  } catch (error) {
    console.error('Error generating exercises:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

static async createFillBlankExercise(req, res) {
  try {
    const { topic_id, question, correct_answer } = req.body;
    
    // Kiểm tra trùng lặp
    const isDuplicate = await ExerciseController.checkDuplicateExercise(
      topic_id, 
      question, 
      correct_answer
    );
    
    if (isDuplicate) {
      return res.status(400).json({ 
        error: 'Bài tập với câu hỏi và đáp án này đã tồn tại' 
      });
    }

    const exerciseData = req.body;
    const exercise = await Exercise.createFillBlankExercise(exerciseData);
    
    res.status(201).json({ exercise });
  } catch (error) {
    console.error('Error creating fill blank exercise:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}




// Cập nhật hàm bulkCreateFillBlankExercises
static async bulkCreateFillBlankExercises(req, res) {
  try {
    const { topicId } = req.params;
    const { exercises } = req.body;
    
    if (!Array.isArray(exercises) || exercises.length === 0) {
      return res.status(400).json({ error: 'Invalid exercises data' });
    }

    // Lọc bài tập trùng lặp
    const uniqueExercises = [];
    const seenExercises = new Set();
    
    for (const exercise of exercises) {
      const exerciseKey = `${exercise.question?.toLowerCase()}|${exercise.correct_answer?.toLowerCase()}`;
      
      if (!seenExercises.has(exerciseKey) && exercise.question && exercise.correct_answer) {
        // Kiểm tra với database
        const isDuplicate = await ExerciseController.checkDuplicateExercise(
          topicId,
          exercise.question,
          exercise.correct_answer
        );
        
        if (!isDuplicate) {
          seenExercises.add(exerciseKey);
          uniqueExercises.push({
            ...exercise,
            topic_id: topicId
          });
        }
      }
    }

    if (uniqueExercises.length === 0) {
      return res.status(400).json({ 
        error: 'Tất cả bài tập đã tồn tại hoặc không hợp lệ' 
      });
    }

    const createdExercises = await Exercise.bulkCreateFillBlankExercises(uniqueExercises);
    
    res.status(201).json({ 
      message: `Created ${createdExercises.length} fill blank exercises successfully`,
      exercises: createdExercises,
      duplicates: exercises.length - uniqueExercises.length
    });
  } catch (error) {
    console.error('Error bulk creating exercises:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}
static async checkDuplicateExercise(topicId, question, correctAnswer) {
  const { data, error } = await supabase
    .from('exercises')
    .select('id')
    .eq('topic_id', topicId)
    .eq('type', 'fill_blank')
    .ilike('question', question)
    .ilike('correct_answer', correctAnswer)
    .limit(1);

  if (error) throw error;
  return data.length > 0;
}
static async exportExercisesTemplate(req, res) {
  try {
    const { topicId } = req.params;
    const words = await Exercise.getWordsForTemplate(topicId);
    
    // Tạo template data
    const templateData = words.map((word, index) => ({
      stt: index + 1,
      word: word.word,
      meaning: word.meaning,
      question: '',
      correct_answer: '',
      explanation: '',
      difficulty: word.difficulty
    }));

    res.json({ template: templateData });
  } catch (error) {
    console.error('Error exporting template:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

static async exportExercisesData(req, res) {
  try {
    const { topicId } = req.params;
    const exercises = await Exercise.getExercisesForExport(topicId);
    
    const exportData = exercises.map((exercise, index) => ({
      stt: index + 1,
      word: exercise.words?.word || '',
      meaning: exercise.words?.meaning || '',
      question: exercise.question,
      correct_answer: exercise.correct_answer,
      explanation: exercise.explanation || '',
      difficulty: exercise.difficulty
    }));

    res.json({ data: exportData });
  } catch (error) {
    console.error('Error exporting exercises data:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}
  // Bulk delete exercises
  static async bulkDeleteExercises(req, res) {
    try {
      const { ids } = req.body;
      
      if (!ids || !Array.isArray(ids) || ids.length === 0) {
        return res.status(400).json({ error: 'Invalid exercise IDs' });
      }

      await Exercise.bulkDelete(ids);
      res.json({ message: 'Exercises deleted successfully' });
    } catch (error) {
      console.error('Error bulk deleting exercises:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
  // Thêm vào ExerciseController.js
static async generateAIExercises(req, res) {
  try {
    const { topicId } = req.params;
    const { word_ids } = req.body;

    // Lấy thông tin các từ được chọn
    const { data: words, error } = await supabase
      .from('words')
      .select('*')
      .eq('topic_id', topicId)
      .in('id', word_ids);

    if (error) throw error;

    const exercises = [];
    const generatedExercises = [];

    for (const word of words) {
      try {
        // Kiểm tra xem từ này đã có bài tập chưa
        const { data: existingExercises } = await supabase
          .from('exercises')
          .select('id')
          .eq('word_id', word.id)
          .eq('type', 'fill_blank')
          .limit(1);

        // Nếu chưa có bài tập, tạo mới
        if (!existingExercises || existingExercises.length === 0) {
          const aiExercise = await AIService.generateFillBlankExercise(
            word.word, 
            word.meaning, 
            word.example
          );

          const exerciseData = {
            topic_id: topicId,
            word_id: word.id,
            type: 'fill_blank',
            question: aiExercise.question,
            correct_answer: aiExercise.correct_answer,
            explanation: aiExercise.explanation,
            difficulty: word.difficulty,
            points: 10,
            sort_order: exercises.length,
            created_at: new Date().toISOString()
          };

          exercises.push(exerciseData);
          generatedExercises.push({
            word: word.word,
            exercise: aiExercise
          });
        }
      } catch (error) {
        console.error(`Error generating exercise for word ${word.word}:`, error);
        // Tiếp tục với từ tiếp theo
        continue;
      }
    }

    if (exercises.length > 0) {
      // Lưu vào database
      const { data: createdExercises, error: insertError } = await supabase
        .from('exercises')
        .insert(exercises)
        .select();

      if (insertError) throw insertError;

      res.json({
        message: `Tạo thành công ${createdExercises.length} bài tập tự động`,
        generated_count: createdExercises.length,
        exercises: generatedExercises,
        created_exercises: createdExercises
      });
    } else {
      res.json({
        message: 'Không có từ nào mới để tạo bài tập',
        generated_count: 0,
        exercises: []
      });
    }
  } catch (error) {
    console.error('Error generating AI exercises:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

// Sửa hàm getWordsForAIGeneration
static async getWordsForAIGeneration(req, res) {
  try {
    const { topicId } = req.params;

    // Lấy tất cả từ
    const { data: words, error: wordsError } = await supabase
      .from('words')
      .select('*')
      .eq('topic_id', topicId)
      .order('created_at', { ascending: true });

    if (wordsError) throw wordsError;

    // Kiểm tra từ nào đã có bài tập fill_blank
    const wordsWithExerciseStatus = await Promise.all(
      words.map(async (word) => {
        const { data: exercises } = await supabase
          .from('exercises')
          .select('id')
          .eq('word_id', word.id)
          .eq('type', 'fill_blank')
          .limit(1);

        return {
          ...word,
          has_exercise: exercises && exercises.length > 0
        };
      })
    );

    const stats = {
      total: wordsWithExerciseStatus.length,
      with_exercise: wordsWithExerciseStatus.filter(w => w.has_exercise).length,
      without_exercise: wordsWithExerciseStatus.filter(w => !w.has_exercise).length
    };

    res.json({
      words: wordsWithExerciseStatus,
      stats
    });
  } catch (error) {
    console.error('Error getting words for AI generation:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}
  
}


module.exports = ExerciseController;