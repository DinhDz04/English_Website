const express = require("express");
const { register, login, googleLogin, getMe } = require("../controllers/authController");
const { authenticate } = require("../middleware/authMiddleware");

const router = express.Router();

// Public routes
router.post("/register", register);
router.post("/login", login);
router.post("/google", googleLogin);

// Protected routes
router.get("/me", authenticate, getMe);

module.exports = router;