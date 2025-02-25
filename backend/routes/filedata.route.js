const express = require("express");
const multer = require("multer");
const dataController = require("../controllers/filedata.controller.js");

const router = express.Router();

// Configure multer for file uploads
const upload = multer({ dest: "uploads/" });

// Route for file upload
router.post("/upload", upload.single("file"), (req, res) => {
  dataController.uploadFile(req, res);
});
router.get("/pan-entries", dataController.allpan);

// Route to fetch all data
router.get("/data/:panNumber", dataController.getData);

module.exports = (fileQueue) => {
  // Pass the queue to the controller
  dataController.setQueue(fileQueue);
  return router;
};
