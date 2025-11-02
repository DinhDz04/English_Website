const express = require("express");
const { authenticate, requireAdmin } = require("../middleware/authMiddleware");

// Import controllers
const topicController = require("../controllers/topicController");
const levelController = require("../controllers/levelController");
const wordController = require("../controllers/wordController");
const shopController = require("../controllers/shopController");
const achievementController = require("../controllers/achievementController");
const statsController = require("../controllers/statsController");
const exerciseController = require("../controllers/exerciseController");

const router = express.Router();

// Apply authentication and admin check to all routes
router.use(authenticate);
router.use(requireAdmin);

// ========== STATISTICS ROUTES ==========
router.get("/stats/dashboard", statsController.getDashboardStats);
router.get("/stats/user-growth", statsController.getUserGrowth);
router.get("/stats/topics-distribution", statsController.getTopicsDistribution);
router.get("/stats/words-difficulty", statsController.getWordsDifficulty);
router.get("/stats/recent-activities", statsController.getRecentActivities);

// ========== LEVEL ROUTES ==========
router.get("/levels", levelController.getAllLevels);
router.get("/levels/:id", levelController.getLevelById);
router.post("/levels", levelController.createLevel);
router.put("/levels/:id", levelController.updateLevel);
router.delete("/levels/:id", levelController.deleteLevel);

// Level prerequisites
router.post("/levels/prerequisites", levelController.createPrerequisite);
router.delete("/levels/prerequisites/:id", levelController.deletePrerequisite);

// ========== TOPIC ROUTES ==========
router.get("/topics", topicController.getAllTopics);
router.get("/topics/:id", topicController.getTopicById);
router.post("/topics", topicController.createTopic);
router.put("/topics/:id", topicController.updateTopic);
router.delete("/topics/:id", topicController.deleteTopic);
router.get("/topics/:id/stats", topicController.getTopicStats);

// ========== WORD/VOCABULARY ROUTES ==========
router.get("/topics/:topicId/words", wordController.getWordsByTopic);
router.get("/words/:id", wordController.getWordById);
router.post("/words", wordController.createWord);
router.put("/words/:id", wordController.updateWord);
router.delete("/words/:id", wordController.deleteWord);
router.post("/words/bulk-delete", wordController.bulkDeleteWords);
router.post("/words/import", wordController.importWords);
router.get("/topics/:topicId/words/export", wordController.exportWords);

// ========== SHOP ROUTES ==========
router.get("/shop/items", shopController.getAllItems);
router.get("/shop/items/:id", shopController.getItemById);
router.post("/shop/items", shopController.createItem);
router.put("/shop/items/:id", shopController.updateItem);
router.delete("/shop/items/:id", shopController.deleteItem);
router.get("/shop/categories", shopController.getCategories);

// ========== ACHIEVEMENT ROUTES ==========
router.get("/achievements", achievementController.getAllAchievements);
router.get("/achievements/:id", achievementController.getAchievementById);
router.post("/achievements", achievementController.createAchievement);
router.put("/achievements/:id", achievementController.updateAchievement);
router.delete("/achievements/:id", achievementController.deleteAchievement);

// ========== DAILY CHALLENGE ROUTES ==========
router.get("/challenges", achievementController.getAllChallenges);
router.get("/challenges/today", achievementController.getTodayChallenge);
router.get("/challenges/:id", achievementController.getChallengeById);
router.post("/challenges", achievementController.createChallenge);
router.put("/challenges/:id", achievementController.updateChallenge);
router.delete("/challenges/:id", achievementController.deleteChallenge);

router.get("/topics/:topicId/exercises", exerciseController.getExercisesByTopic);
router.get("/exercises/:id", exerciseController.getExerciseById);
router.post("/exercises", exerciseController.createExercise);
router.put("/exercises/:id", exerciseController.updateExercise);
router.delete("/exercises/:id", exerciseController.deleteExercise);
router.post("/exercises/bulk-delete", exerciseController.bulkDeleteExercises);

module.exports = router;