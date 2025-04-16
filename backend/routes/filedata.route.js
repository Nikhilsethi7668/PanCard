const express = require("express");
const multer = require("multer");
const dataController = require("../controllers/filedata.controller.js");
const authMiddleware = require("../middlewares/authMiddleware.js");

const router = express.Router();

const upload = multer({ dest: "uploads/" });

router.post(
  "/upload/:id",
  upload.single("file"),
  dataController.submitFileRequest
);
router.get("/pan-entries/:id", dataController.allpan);
router.get("/data/:panNumber", dataController.getData);
router.get("/data/get-all-users/:id", dataController.getAllUsers);
router.post("/data/grant-admin-access/:id", dataController.grantAdminAccess);
router.delete("/data/delete-user/:id", dataController.deleteUser);
router.get("/data/:panNumber/download", dataController.downloadEmails);
router.get("/upload/requests/", dataController.getRequests);
router.get(
  "/upload/requests/:userId",
  dataController.getRequestsByUser
);
router.get(
  "/upload/download/:requestId",
  dataController.downloadFile
);
router.put(
  "/upload/requests/delete/:requestId",
  dataController.deleteFileRequest
);
router.get(
  "/upload/requests/get-csv/:requestId",
  dataController.downloadCsv
);
router.put("/upload/requests/:requestId",authMiddleware, dataController.updateRequestStatus);
// router.post("/upload/invoice");

module.exports = (fileQueue) => {
  dataController.setQueue(fileQueue);
  return router;
};
