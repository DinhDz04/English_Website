// backend/src/controllers/exerciseController.js
const Exercise = require('../models/Exercise');

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
    const { word_id, question, correct_answer, explanation, difficulty, points } = req.body;
    
    const exerciseData = {
      word_id,
      type: 'fill_blank',
      question,
      correct_answer,
      explanation,
      difficulty: difficulty || 'easy',
      points: points || 10,
      sort_order: 0
    };

    const exercise = await Exercise.create(exerciseData);
    res.status(201).json({ exercise });
  } catch (error) {
    console.error('Error creating fill blank exercise:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}
// backend/src/controllers/exerciseController.js - Thêm các method mới
static async createFillBlankExercise(req, res) {
  try {
    const exerciseData = req.body;
    const exercise = await Exercise.createFillBlankExercise(exerciseData);
    
    res.status(201).json({ exercise });
  } catch (error) {
    console.error('Error creating fill blank exercise:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

static async bulkCreateFillBlankExercises(req, res) {
  try {
    const { exercises } = req.body;
    
    if (!Array.isArray(exercises) || exercises.length === 0) {
      return res.status(400).json({ error: 'Invalid exercises data' });
    }

    const createdExercises = await Exercise.bulkCreateFillBlankExercises(exercises);
    
    res.status(201).json({ 
      message: `Created ${createdExercises.length} fill blank exercises successfully`,
      exercises: createdExercises 
    });
  } catch (error) {
    console.error('Error bulk creating exercises:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
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
}

module.exports = ExerciseController;