// backend/src/routes/userRoutes.js
const express = require("express");
const { authenticate } = require("../middleware/authMiddleware");
const { validateItemOwnership, checkPremiumStatus } = require('../middleware/validateItem');
const { usageLimiter } = require('../middleware/rateLimiter');

// Import controllers
const UserController = require("../controllers/userController");
const LearningController = require("../controllers/LearningController");
const UserQuestController = require("../controllers/userQuestController");
const ProgressController = require("../controllers/progressController");
const PlatformController = require("../controllers/platformController");
const ReviewController = require("../controllers/ReviewController");
const leaderboardRoutes = require("./leaderboardRoutes");

const router = express.Router();
router.use(authenticate);

// ========== LEARNING ROUTES ==========
// QUY TẮC: Specific -> General, Static -> Dynamic

// 1. Routes KHÔNG có parameter (static routes) - ĐẶT TRƯỚC
router.get("/levels", LearningController.getLevelsWithProgress);
router.get("/topics/:topicId/details", LearningController.getTopicDetails);
router.post("/sessions/start", LearningController.startLearningSession);
router.get("/sessions/ai-exercise", LearningController.getAIExercise);
router.get("/progress/overview", LearningController.getLearningProgress);

// 2. Routes CÓ parameter (dynamic routes) - ĐẶT SAU
// QUAN TRỌNG: Sắp xếp từ specific đến general
router.post("/sessions/:sessionId/answer", LearningController.submitAnswer);
router.post("/sessions/:sessionId/complete-preview", LearningController.completePreview);

router.post("/sessions/:sessionId/complete", LearningController.completeLearningSession);
router.get("/sessions/:sessionId/progress", LearningController.getSessionProgress);

// 3. Routes khác
router.post("/words/:wordId/mark-learned", LearningController.markWordAsLearned);
router.get("/topics/:topicId/progress", LearningController.getTopicProgress);

// ========== QUEST ROUTES ==========
router.get("/quests/active", UserQuestController.getActiveQuests);
router.get("/quests/completed", UserQuestController.getCompletedQuests);
router.get("/quests/daily", UserQuestController.getTodayDailyQuest);
router.get("/quests/statistics", UserQuestController.getQuestStatistics);
router.post("/quests/:questId/claim", UserQuestController.claimQuestReward);
router.post("/quests/refresh-progress", UserQuestController.refreshProgress);

// ========== USER PROFILE ROUTES ==========
router.get("/profile", UserController.getProfile);
router.put("/profile", UserController.updateProfile);
router.post("/change-password", UserController.changePassword);
router.get("/statistics", UserController.getStatistics);
router.get("/learning-history", UserController.getLearningHistory);
router.post("/daily-login", UserController.updateDailyLogin);

// ========== PLATFORM STATISTICS ==========
router.get("/platform/statistics", PlatformController.getPlatformStatistics);

router.get("/review/learned-words", ReviewController.getLearnedWords);

router.use("/leaderboard", leaderboardRoutes);



module.exports = router;