const express = require("express");
const router = express.Router();
const {
  signup,
  login,
  logout,
  checkAuth,
  verifyOtp,
  updateProfile,
  updatePassword,
} = require("../controllers/auth.controller.js");
const authMiddleware = require("../middlewares/authMiddleware.js");

router.post("/signup", signup);
router.post("/verify-otp", verifyOtp);
router.post("/login", login);
router.post("/logout", logout);
router.get("/check-auth", checkAuth);
router.put('/update-profile', authMiddleware, updateProfile);
router.put('/update-password', authMiddleware, updatePassword);

module.exports = router;
