const express = require("express");
const { authenticate, requireAdmin } = require("../middleware/authMiddleware");
const upload = require("../middleware/upload");
const questController = require("../controllers/QuestController");
const AutoQuestController = require("../controllers/AutoQuestController");


// Import controllers
const topicController = require("../controllers/topicController");
const levelController = require("../controllers/levelController");
const wordController = require("../controllers/wordController");
const achievementController = require("../controllers/achievementController");
const statsController = require("../controllers/statsController");
const exerciseController = require("../controllers/exerciseController");
const itemController = require("../controllers/itemController");

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
router.post("/topics", upload.single('image'), topicController.createTopic);
router.put('/topics/:id', upload.single('image'), topicController.updateTopic);
router.get("/topics", topicController.getAllTopics);
router.get("/topics/:id", topicController.getTopicById);
router.delete("/topics/:id", topicController.deleteTopic);
router.get("/topics/:id/stats", topicController.getTopicStats);

// ========== WORD/VOCABULARY ROUTES ==========
router.get("/topics/:topicId/words", wordController.getWordsByTopic);
router.get("/words/:id", wordController.getWordById);
router.post("/words", wordController.createWord);
router.get("/words", wordController.getAllWords); // SỬA: "/words" thay vì "/word"
router.put("/words/:id", wordController.updateWord);
router.delete("/words/:id", wordController.deleteWord);
router.post("/words/bulk-delete", wordController.bulkDeleteWords);
router.post("/words/import", wordController.importWords);
router.get("/topics/:topicId/words/export", wordController.exportWords);

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
router.get('/topics/:topicId/words-for-ai', exerciseController.getWordsForAIGeneration);
router.post('/topics/:topicId/generate-ai-exercises', exerciseController.generateAIExercises);

// Thêm vào adminRoutes.js
router.post("/exercises/fill-blank", exerciseController.createFillBlankExercise);
router.get("/topics/:topicId/export-template", exerciseController.exportExercisesTemplate);
router.get("/topics/:topicId/export-exercises", exerciseController.exportExercisesData);
router.post("/topics/:topicId/import-exercises", exerciseController.bulkCreateFillBlankExercises);

router.get("/quests", questController.getAllQuests);
router.get("/quests/templates", questController.getQuestTemplates);
router.get("/quests/stats", questController.getQuestStats);
router.get("/quests/:id", questController.getQuestById);
router.post("/quests", questController.createQuest);
router.put("/quests/:id", questController.updateQuest);
router.delete("/quests/:id", questController.deleteQuest);
router.patch("/quests/:id/toggle", questController.toggleQuestStatus);
router.post("/quests/bulk-create", questController.bulkCreateQuests);
router.post("/quests/initialize-system", AutoQuestController.initializeSystemQuests)
router.post("/quests/auto-update", AutoQuestController.updateAutoQuests);
router.get("/quests/auto-preview", AutoQuestController.previewAutoQuests);

router.get("/items", itemController.getAllItems);
router.get("/items/stats", itemController.getItemStats);
router.get("/items/config", itemController.getItemConfig);
router.get("/items/categories/:categoryId/types", itemController.getTypesByCategory);
router.get("/items/:id", itemController.getItemById);
router.post("/items", itemController.createItem);
router.put("/items/:id", itemController.updateItem);
router.delete("/items/:id", itemController.deleteItem);
router.post("/items/bulk-delete", itemController.bulkDeleteItems);

module.exports = router;