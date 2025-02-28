const express = require("express");
const multer = require("multer");
const dataController = require("../controllers/filedata.controller.js");

const router = express.Router();

const upload = multer({ dest: "uploads/" });

router.post("/upload/:id", upload.single("file"), (req, res) => {
  dataController.uploadFile(req, res);
});

// Route to fetch all PAN entries
router.get("/pan-entries/:id", dataController.allpan);

// Route to fetch data for a specific PAN number
router.get("/data/:panNumber", dataController.getData);

module.exports = (fileQueue) => {
  // Pass the queue to the controller
  dataController.setQueue(fileQueue);
  return router;
};
