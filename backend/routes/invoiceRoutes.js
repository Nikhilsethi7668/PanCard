// routes/invoiceRoutes.js
const express = require("express");
const router = express.Router();
const invoiceController = require("../controllers/invoiceController");
const upload = require("../middlewares/uploadMiddleware");
const authMiddleware = require("../middlewares/authMiddleware");

// Admin-only routes
router.post(
  "/send-invoice",
  authMiddleware,
  upload.single("csv"),
  invoiceController.sendInvoice
);

router.get("/all", authMiddleware, invoiceController.getAllInvoices);

// User-specific routes
router.get("/user/:userId", authMiddleware, invoiceController.getUserInvoices);

module.exports = router;
