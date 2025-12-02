const express = require("express");
const { register, login, googleLogin, getMe } = require("../controllers/authController");
const { authenticate } = require("../middleware/authMiddleware");
const PasswordResetController = require("../controllers/PasswordResetController");


const router = express.Router();

// Public routes
router.post("/register", register);
router.post("/login", login);
router.post("/google", googleLogin);

// Protected routes
router.get("/me", authenticate, getMe);
router.post("/forgot-password", PasswordResetController.requestPasswordReset);
router.post("/verify-otp", PasswordResetController.verifyOTP);
router.post("/reset-password", PasswordResetController.resetPassword);
router.get("/check-reset-status", PasswordResetController.checkResetStatus);
router.post("/resend-otp", PasswordResetController.resendOTP);

module.exports = router;