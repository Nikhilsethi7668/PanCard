const express = require("express");
const multer = require("multer");
const dataController = require("../controllers/filedata.controller.js");

const router = express.Router();

const upload = multer({ dest: "uploads/" });

// Existing routes
router.post("/upload/:id", upload.single("file"), dataController.uploadFile);
router.get("/pan-entries/:id", dataController.allpan);
router.get("/data/:panNumber", dataController.getData);
router.get("/data/get-all-users/:id", dataController.getAllUsers);
router.post("/data/grant-admin-access/:id", dataController.grantAdminAccess);
router.delete("/data/delete-user/:id", dataController.deleteUser);
router.get("/data/:panNumber/download", dataController.downloadEmails);

// New routes for file upload requests and admin approval
router.post(
  "/upload/request/:id",
  upload.single("file"),
  dataController.submitFileRequest
);
router.get("/upload/requests/pending", dataController.getPendingRequests);
router.get(
  "/upload/requests/pending/:userId",
  dataController.getPendingRequestsByUser
); // New route
router.put("/upload/requests/:requestId", dataController.updateRequestStatus);

module.exports = (fileQueue) => {
  // Pass the queue to the controller
  dataController.setQueue(fileQueue);
  return router;
};
