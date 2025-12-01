// backend/src/routes/leaderboardRoutes.js
const express = require("express");
const { authenticate } = require("../middleware/authMiddleware");
const LeaderboardController = require("../controllers/LeaderboardController");

const router = express.Router();
router.use(authenticate);

// Lấy bảng xếp hạng
router.get("/", LeaderboardController.getLeaderboard);

// Lấy thống kê leaderboard
router.get("/stats", LeaderboardController.getLeaderboardStats);

module.exports = router;