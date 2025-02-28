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

router.get("/data/:panNumber", dataController.getData);
router.get("/data/get-all-users/:id", dataController.getAllUsers);

router.post("/data/grant-admin-access/:id", dataController.grantAdminAccess);
router.delete("/data/delete-user/:id", dataController.deleteUser);
router.get("/data/:panNumber/download", dataController.downloadEmails);

module.exports = (fileQueue) => {
  // Pass the queue to the controller
  dataController.setQueue(fileQueue);
  return router;
};
