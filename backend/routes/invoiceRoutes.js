const express = require("express");
const router = express.Router();
const invoiceController = require("../controllers/invoiceController");
const uploadMiddleware = require("../middlewares/uploadMiddleware");
const authMiddleware = require("../middlewares/authMiddleware");

// Admin routes
router.post(
  "/send-invoice",
  authMiddleware,
  uploadMiddleware,
  invoiceController.sendInvoice
);

router.get("/get", authMiddleware, invoiceController.getAllInvoices);

// User routes
router.get("/user/:userId", authMiddleware, invoiceController.getUserInvoices);

router.put(
  "/mark-read/:invoiceId",
  authMiddleware,
  invoiceController.markAsRead
);
router.put(
  "/status-update/:invoiceId",
  authMiddleware,
  invoiceController.updateInvoiceStatus
);

module.exports = router;
