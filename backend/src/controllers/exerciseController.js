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