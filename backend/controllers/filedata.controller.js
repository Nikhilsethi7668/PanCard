const csv = require("csv-parser");
const fs = require("fs");
const sequelize = require("../config/database"); // Import sequelize
const Data = require("../models/dataSchema");
const User = require("../models/userSchema");
const processDataInBatches = require("../processDataInBatches");
const mongoose = require("mongoose");
const FileRequest = require("../models/fileRequests");
const path = require("path");
const PanEmailData = require("../models/panEmailDataSchema");
const { Op, fn, col, where, literal } = require("sequelize");

let fileQueue;

// Set the Bull queue
const setQueue = (queue) => {
  fileQueue = queue;
  initializeQueueProcessor(); // Initialize the queue processor after setting the queue
};

const initializeQueueProcessor = () => {
  fileQueue.process(async (job, done) => {
    const { filePath, userId } = job.data;
    const results = [];

    console.log("Processing file:", filePath);

    // Stream the file and parse it using csv-parser
    fs.createReadStream(filePath)
      .pipe(csv())
      .on("headers", (headers) => {
        console.log("Headers:", headers);

        // Normalize headers to lowercase and trim whitespace
        const normalizedHeaders = headers.map((header) =>
          header.trim().toLowerCase()
        );

        console.log("Normalized Headers:", normalizedHeaders);

        // Find the indices of the relevant columns
        const panHeaderIndex = normalizedHeaders.findIndex((header) =>
          header.includes("pan")
        );
        const emailHeaderIndex = normalizedHeaders.findIndex((header) =>
          header.includes("email")
        );

        console.log("Pan Header Index:", panHeaderIndex);
        console.log("Email Header Index:", emailHeaderIndex);

        if (panHeaderIndex === -1 || emailHeaderIndex === -1) {
          throw new Error("CSV file must contain 'pan' and 'email' columns.");
        }

        // Store the indices for later use
        job.data.panHeaderIndex = panHeaderIndex;
        job.data.emailHeaderIndex = emailHeaderIndex;
      })
      .on("data", (data) => {
        console.log("Raw Row:", data);

        // Extract the relevant columns using the header names
        const panNumber = data.pan;
        const email = data.email;

        console.log("Extracted Pan Number:", panNumber);
        console.log("Extracted Email:", email);

        // Skip empty rows
        if (panNumber && email) {
          results.push({ panNumber, email, userId });
        } else {
          console.log("Skipping row due to empty panNumber or email");
        }
      })
      .on("end", () => {
        console.log("Parsed Results:", results);
        console.log(`Parsed ${results.length} rows`);

        // Process the data in batches
        processDataInBatches(results, userId);

        // Delete the file after processing
        fs.unlinkSync(filePath);

        done(); // Signal that the job is done
      })
      .on("error", (error) => {
        console.error("Error parsing CSV file:", error);
        done(error); // Signal that the job failed
      });
  });
};

// Upload and process file
const uploadFile = async (req, res) => {
  try {
    const userId = req.params.id;

    // Ensure user exists
    const user = await User.findByPk(userId);
    if (!user) {
      console.log("No User Exists");
      return res.status(400).json({ message: "User doesn't exist" });
    }

    // Check if file is uploaded
    if (!req.file) {
      return res.status(400).send("No file uploaded.");
    }

    // Add the file processing job to the queue
    const job = await fileQueue.add({ filePath: req.file.path, userId });

    // Wait for the job to finish
    await job.finished();

    // Send response after the job is completed
    res.status(200).send("File processed successfully.");
  } catch (error) {
    console.error("Error during file upload:", error);
    res.status(500).json({ message: "Internal server error." });
  }
};
// Function to fetch all data from the database
const getData = async (req, res) => {
  try {
    const panNumber = req.params.panNumber;
    const { page = 1, limit = 100, type } = req.query;
    const offset = (page - 1) * limit;
    const userId = req.query.userId;
    const user = await User.findByPk(userId);
    if (!user) {
      console.log("No User Exists");
      return res.status(400).json({ message: "User doesn't exist" });
    }
    if (!type) {
      return res.status(400).json({ message: "Type is required" });
    }
    // Find the PAN entry for the specific user
    let panEntry = {};
    if (user.isAdmin) {
     if(type=="data"){ panEntry = await Data.findOne({
        where: { panNumber },
      });}
     if(type=="user"){ panEntry = await User.findOne({
        where: { panNumber },
      });}
     if(type=="panemail"){ panEntry = await PanEmailData.findOne({
        where: { panNumber },
      });}
    } else {
      panEntry = await Data.findOne({
        where: { panNumber, userId },
      });
    }

    if (!panEntry) {
      return res
        .status(404)
        .json({ message: "PAN number not found for this user" });
    }

    // Paginate the emails
    console.log(panEntry);

    const emails = panEntry?.email.slice(offset, offset + parseInt(limit));

    res.status(200).json({
      panNumber: panEntry.panNumber,
      emails,
      totalEmails: panEntry.email.length,
      currentPage: parseInt(page),
      totalPages: Math.ceil(panEntry.email.length / limit),
    });
  } catch (error) {
    console.error("Error fetching data:", error);
    res
      .status(500)
      .json({ message: "Error fetching data", error: error.message });
  }
};


const allpan = async (req, res) => {
  try {
    const userId = req.params.id;
    const { page = 1, searchText = "", limit = 10, type = "data" } = req.query;

    // Input validation
    const parsedPage = Math.max(parseInt(page), 1);
    const parsedLimit = Math.min(Math.max(parseInt(limit), 1), 100);
    const offset = (parsedPage - 1) * parsedLimit;

    // Get user with minimal attributes
    const user = await User.findByPk(userId, { 
      attributes: ["isAdmin"],
      raw: true 
    });
    
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Determine model and conditions based on type
    let model, whereCondition, attributes;
    switch(type) {
      case 'user':
        if (!user.isAdmin) {
          return res.status(403).json({ message: "Access denied" });
        }
        model = User;
        whereCondition = {};
        attributes = ['id', 'username', 'email']; // Example attributes
        break;
      
      case 'panemail':
        if (!user.isAdmin) {
          return res.status(403).json({ message: "Access denied" });
        }
        model = PanEmailData;
        whereCondition = {};
        // For JSON array, we'll need to handle differently
        attributes = ['id', 'panNumber', 'email'];
        break;
      
      case 'data':
      default:
        model = Data;
        whereCondition = user.isAdmin ? {} : { userId };
        attributes = ['id', 'panNumber', 'email']; // Adjust as needed
        break;
    }

    // Add search condition if provided and applicable
    if (searchText && (type === 'panemail' || type === 'data')) {
      whereCondition.panNumber = {
        [Op.iLike]: `%${searchText}%`
      };
    }

    // Get total count
    const totalCount = await model.count({
      where: whereCondition
    });

    // Get paginated results
    let results;
    if (type === 'panemail') {
      // Special handling for PanEmailData with JSON emails
      results = await model.findAll({
        where: whereCondition,
        attributes: [
          'id',
          'panNumber',
        ],
        order: [['panNumber', 'ASC']],
        limit: parsedLimit,
        offset: offset,
        raw: true
      });
    } else {
      // Standard handling for other types
      results = await model.findAll({
        where: whereCondition,
        attributes: attributes,
        order: [['id', 'ASC']],
        limit: parsedLimit,
        offset: offset,
        raw: true
      });
    }

    res.status(200).json({
      totalCount,
      currentPage: parsedPage,
      totalPages: Math.ceil(totalCount / parsedLimit),
      items: results,
      type: type
    });

  } catch (error) {
    console.error("Error fetching data:", error);
    res.status(500).json({ 
      message: "Error fetching data", 
      error: error.message
    });
  }
};

// Function to fetch all users
const getAllUsers = async (req, res) => {
  try {
    const userId = req.params.id;

    // Check if the requesting user is an admin
    const requestingUser = await User.findByPk(userId);
    if (!requestingUser || !requestingUser.isAdmin) {
      return res.status(403).json({ message: "Unauthorized" });
    }

    const users = await User.findAll();
    res.status(200).json(users);
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error fetching users", error: error.message });
  }
};

// Function to grant admin access to a user
const grantAdminAccess = async (req, res) => {
  try {
    const userId = req.params.id; // Selected user's ID
    const { requestingUserId } = req.body; // Requesting user's ID

    // Check if the requesting user is an admin
    const requestingUser = await User.findByPk(requestingUserId);
    if (!requestingUser || !requestingUser.isAdmin) {
      return res.status(403).json({ message: "Unauthorized" });
    }

    // Update the selected user's isAdmin status
    const updatedUser = await User.update(
      { isAdmin: true },
      { where: { id: userId }, returning: true }
    );

    if (!updatedUser[1]) {
      return res.status(404).json({ message: "User not found" });
    }

    res.status(200).json(updatedUser[1][0]);
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error granting admin access", error: error.message });
  }
};
const downloadEmails = async (req, res) => {
  try {
    const { panNumber } = req.params;
    const { userId,type } = req.query;

    // Fetch the PAN entry for the specific user
    const user = await User.findByPk(userId);
    const whereCondition = user.isAdmin ? {} : { userId };
    let panEntry = {}
    if(type=="approved-entries"){ 
      panEntry= await Data.findOne({
      where: { panNumber,...whereCondition },
    });}
    if(type=="other"){
      panEntry= await PanEmailData.findOne({
        where: { panNumber},
      });
    }

    if (!panEntry) {
      return res
        .status(404)
        .json({ message: "PAN number not found for this user" });
    }

    // Return all emails
    res.status(200).json({ emails: panEntry.email });
  } catch (error) {
    console.error("Error fetching emails for download:", error);
    res
      .status(500)
      .json({ message: "Error fetching emails", error: error.message });
  }
};

// Function to delete a user
const deleteUser = async (req, res) => {
  try {
    const userId = req.params.id; // Selected user's ID
    const { requestingUserId } = req.body; // Requesting user's ID

    // Check if the requesting user is an admin
    const requestingUser = await User.findByPk(requestingUserId);
    if (!requestingUser || !requestingUser.isAdmin) {
      return res.status(403).json({ message: "Unauthorized" });
    }

    // Delete the selected user
    const deletedUser = await User.destroy({ where: { id: userId } });

    if (!deletedUser) {
      return res.status(404).json({ message: "User not found" });
    }

    res.status(200).json({ message: "User deleted successfully" });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error deleting user", error: error.message });
  }
};
// Submit file upload request
const submitFileRequest = async (req, res) => {
  try {
    const userId = req.params.id;
    const file = req.file;

    // Validate file
    if (!file) {
      return res.status(400).json({ message: "No file uploaded." });
    }

    // Validate userId
    if (!userId || isNaN(userId)) {
      return res.status(400).json({ message: "Invalid user ID." });
    }

    // Create new file request
    const newRequest = await FileRequest.create({
      userId: parseInt(userId, 10),
      fileName: file.originalname,
      filePath: file.path,
      // approvalStage and numberOfPans will default automatically
    });

    res.status(200).json({
      message: "File upload request submitted for approval.",
      requestId: newRequest.id,
    });
  } catch (error) {
    console.error("Error submitting file request:", error);
    res.status(500).json({ message: "Internal server error." });
  }
};

// Fetch pending requests for admin
const getRequests = async (req, res) => {
  try {
    const { approvalStage } = req.query;

    const whereClause = {};

    // If approvalStage is provided, filter by it
    if (approvalStage) {
      whereClause.approvalStage = approvalStage;
    }

    const requests = await FileRequest.findAll({
      where: whereClause,
      include: [
        {
          model: User,
          as: "user",
          attributes: ["email"],
        },
      ],
    });

    res.status(200).json(requests);
  } catch (error) {
    console.error("Error fetching file requests:", error);
    res.status(500).json({ message: "Internal server error." });
  }
};

const updateRequestStatus = async (req, res) => {
  try {
    const { requestId } = req.params;
    const { status } = req.body; 
    const {userId}=req.user;

    if (!["approved", "rejected"].includes(status)) {
      return res.status(400).json({ message: "Invalid approval stage." });
    }

    const request = await FileRequest.findByPk(requestId);
    if (!request) {
      return res.status(404).json({ message: "Request not found." });
    }

    request.approvalStage = status;

    if (status === "approved") {
      // Add metadata
      request.approvedBy = userId;
      request.approvedAt = new Date();
      const processedDir = path.join(__dirname, "../uploads/processed");
      if (!fs.existsSync(processedDir)) {
        fs.mkdirSync(processedDir, { recursive: true });
      }

      if (fs.existsSync(request.filePath)) {
        const finalPath = path.join(processedDir, request.fileName);
        fs.renameSync(request.filePath, finalPath);
        request.filePath = finalPath;

        const results = [];
        await new Promise((resolve, reject) => {
          fs.createReadStream(finalPath)
            .pipe(csv())
            .on("headers", (headers) => {
              const normalizedHeaders = headers.map((h) =>
                h.trim().toLowerCase()
              );
              if (
                !normalizedHeaders.some((h) => h.includes("pan")) ||
                !normalizedHeaders.some((h) => h.includes("email"))
              ) {
                reject(
                  new Error("CSV must contain 'pan' and 'email' columns.")
                );
              }
            })
            .on("data", (row) => {
              const panNumber = row.pan;
              const email = row.email;
              if (panNumber && email) {
                results.push({
                  panNumber,
                  email,
                  fileRequestId:request.id,
                  userId: request.userId,
                });
              }
            })
            .on("end", () => {
              request.numberOfPans = results.length;
              processDataInBatches(results, request.userId); // your batch processor logic
              fs.unlinkSync(finalPath); // delete after processing
              resolve();
            })
            .on("error", (error) => {
              reject(error);
            });
        });
      } else {
        return res.status(404).json({ message: "File not found." });
      }
    } else if (status === "rejected") {
      // Just delete file
      if (fs.existsSync(request.filePath)) {
        fs.unlinkSync(request.filePath);
      } else {
        return res.status(404).json({ message: "File not found." });
      }
    }

    await request.save();

    res.status(200).json({ message: `Request ${status} successfully.` });
  } catch (error) {
    console.error("Error updating request status:", error);
    res.status(500).json({ message: "Internal server error." });
  }
};

// Fetch pending requests for a specific user
const getRequestsByUser = async (req, res) => {
  try {
    const userId = req.params.userId;
    const { approvalStage } = req.query;

    // Validate userId
    if (!userId || isNaN(userId)) {
      return res.status(400).json({ message: "Invalid user ID." });
    }

    const whereClause = {
      userId: parseInt(userId, 10),
    };

    // Add stage filter if present
    if (approvalStage) {
      whereClause.approvalStage = approvalStage;
    }

    const requests = await FileRequest.findAll({
      where: whereClause,
      include: [
        {
          model: User,
          as: "user",
          attributes: ["email"],
        },
      ],
    });

    res.status(200).json(requests);
  } catch (error) {
    console.error("Error fetching requests for user:", error);
    res.status(500).json({ message: "Internal server error." });
  }
};

const downloadFile = async (req, res) => {
  try {
    const { requestId } = req.params;

    // Find the request by ID
    const request = await FileRequest.findByPk(requestId);
    if (!request) {
      return res.status(404).json({ message: "File request not found." });
    }

    // Check if the file exists
    const filePath = request.filePath;
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ message: "File not found." });
    }

    // Serve the file
    return res.download(filePath, request.fileName);
  } catch (error) {
    console.error("Error downloading file:", error);
    return res.status(500).json({ message: "Internal server error." });
  }
};

const deleteFileRequest = async (req, res) => {
  try {
    const { requestId } = req.params;

    // Fetch the request
    const request = await FileRequest.findByPk(requestId);
    if (!request) {
      return res.status(404).json({ message: "File request not found." });
    }

    // Set approvalStage to 'deleted'
    request.approvalStage = "deleted";
    await request.save();

    // Delete associated data entries
    await Data.destroy({
      where: { fileRequestId: requestId },
    });

    // Optionally delete the file from disk if it exists
    if (fs.existsSync(request.filePath)) {
      fs.unlinkSync(request.filePath);
    }

    return res.status(200).json({ message: "File request marked as deleted and associated data removed." });
  } catch (error) {
    console.error("Error deleting file request:", error);
    return res.status(500).json({ message: "Internal server error." });
  }
};


module.exports = {
  uploadFile,
  allpan,
  getData,
  setQueue,
  getAllUsers,
  grantAdminAccess,
  deleteUser,
  downloadEmails,
  submitFileRequest,
  getRequests,
  updateRequestStatus,
  getRequestsByUser,
  downloadFile,
  deleteFileRequest
};
