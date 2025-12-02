const express = require("express");
const { authenticate, requireAdmin } = require("../middleware/authMiddleware");
const upload = require("../middleware/upload");
const QuestController = require("../controllers/QuestController");
const AutoQuestController = require("../controllers/AutoQuestController");


// Import controllers
const topicController = require("../controllers/topicController");
const levelController = require("../controllers/levelController");
const wordController = require("../controllers/wordController");
const statsController = require("../controllers/statsController");
const AdminUserController = require("../controllers/adminUserController");


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



router.get("/quests", QuestController.getAllQuests);
router.get("/quests/stats", QuestController.getQuestStats);
router.get("/quests/:id", QuestController.getQuestById);

// Create routes
router.post("/quests", QuestController.createQuest);
router.post("/quests/bulk-create", QuestController.bulkCreateQuests);

// Update routes
router.put("/quests/:id", QuestController.updateQuest);
router.patch("/quests/:id/toggle", QuestController.toggleQuestStatus);

// Delete routes
router.delete("/quests/:id", QuestController.deleteQuest);

// Sync routes
router.post("/quests/:questId/sync", QuestController.syncQuestToUsers);
router.post("/quests/sync-all", QuestController.syncAllQuestsToUsers);

// ========== AUTO QUEST ROUTES (ADMIN) ==========

// Initialize and update
router.post("/quests/initialize-system", AutoQuestController.initializeSystemQuests);
router.post("/quests/auto-update", AutoQuestController.updateAutoQuests);

// Preview
router.get("/quests/auto-preview", AutoQuestController.previewAutoQuests);

// Sync
router.post("/quests/:questId/sync-auto", AutoQuestController.syncQuestToUsers);
router.post("/quests/sync-all-auto", AutoQuestController.syncAllQuestsToUsers);



router.get("/users", AdminUserController.getAllUsers);
router.get("/users/:id", AdminUserController.getUserById);
router.put("/users/:id", AdminUserController.updateUser);
router.patch("/users/:id/toggle-status", AdminUserController.toggleUserStatus);
router.post("/users/:id/reset-password", AdminUserController.resetUserPassword);
router.get("/users/:id/stats", AdminUserController.getUserStats);



module.exports = router;