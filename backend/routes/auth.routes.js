const express = require("express");

const {
  checkAuth,
  login,
  logout,
  signup,
} = require("../controllers/auth.controller.js");

const router = express.Router();

router.post("/signup", signup);

router.post("/login", login);

router.post("/logout", logout);

router.get("/check-auth", checkAuth);

module.exports = router;
