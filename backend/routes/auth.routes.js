const express = require("express");
const router = express.Router();
const {
  signup,
  login,
  logout,
  checkAuth,
} = require("../controllers/auth.controller.js");

router.post("/signup", signup);
router.post("/login", login);
router.post("/logout", logout);
router.get("/check-auth", checkAuth);

module.exports = router;
