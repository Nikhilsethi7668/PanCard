const express = require("express");
const router = express.Router();
const invoiceController = require("../controllers/invoiceController");
const uploadMiddleware = require("../middlewares/uploadMiddleware");
const authMiddleware = require("../utils/uploadInvoice_Middleware");

router.post(
  "/send-invoice",
  authMiddleware,
  uploadMiddleware,
  invoiceController.sendInvoice
);

router.get("/all", authMiddleware, invoiceController.getAllInvoices);
router.get("/user/:userId", authMiddleware, invoiceController.getUserInvoices);
router.put(
  "/mark-read/:invoiceId",
  authMiddleware,
  invoiceController.markAsRead
);

module.exports = router;
