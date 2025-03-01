const csv = require("csv-parser");
const fs = require("fs");
const Data = require("../models/dataSchema");
const User = require("../models/userSchema");
const processDataInBatches = require("../processDataInBatches");
const mongoose = require("mongoose");
const FileRequest = require("../models/fileRequests");
const path = require("path");

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

    console.log("Processing file:", filePath); // Log the file path

    // Stream the file and parse it using csv-parser
    fs.createReadStream(filePath)
      .pipe(csv())
      .on("headers", (headers) => {
        console.log("Headers:", headers); // Log headers for debugging

        // Normalize headers to lowercase and trim whitespace
        const normalizedHeaders = headers.map((header) =>
          header.trim().toLowerCase()
        );

        console.log("Normalized Headers:", normalizedHeaders); // Log normalized headers

        // Find the indices of the relevant columns
        const panHeaderIndex = normalizedHeaders.findIndex((header) =>
          header.includes("pan")
        );
        const emailHeaderIndex = normalizedHeaders.findIndex((header) =>
          header.includes("email")
        );

        console.log("Pan Header Index:", panHeaderIndex); // Log pan header index
        console.log("Email Header Index:", emailHeaderIndex); // Log email header index

        if (panHeaderIndex === -1 || emailHeaderIndex === -1) {
          throw new Error("CSV file must contain 'pan' and 'email' columns.");
        }

        // Store the indices for later use
        job.data.panHeaderIndex = panHeaderIndex;
        job.data.emailHeaderIndex = emailHeaderIndex;
      })
      .on("data", (data) => {
        console.log("Raw Row:", data); // Log the raw row

        // Extract the relevant columns using the header names
        const panNumber = data.pan;
        const email = data.email;

        console.log("Extracted Pan Number:", panNumber); // Log the extracted panNumber
        console.log("Extracted Email:", email); // Log the extracted email

        // Skip empty rows
        if (panNumber && email) {
          results.push({ panNumber, email });
        } else {
          console.log("Skipping row due to empty panNumber or email");
        }
      })
      .on("end", () => {
        console.log("Parsed Results:", results); // Log the final results array
        console.log(`Parsed ${results.length} rows`);
        processDataInBatches(results, userId); // Pass userId
        fs.unlinkSync(filePath); // Delete the file after processing
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
    const user = await User.findOne({ _id: userId });
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
    const { page = 1, limit = 100 } = req.query;
    const skip = (page - 1) * limit;
    const userId = req.query.userId; // Get userId from request

    // Validate userId
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ message: "Invalid user ID" });
    }

    // Find the PAN entry for the specific user
    const panEntry = await Data.findOne({
      panNumber,
      user: new mongoose.Types.ObjectId(userId), // Convert userId to ObjectId
    });

    if (!panEntry) {
      return res
        .status(404)
        .json({ message: "PAN number not found for this user" });
    }

    // Paginate the emails
    const emails = panEntry.email.slice(skip, skip + parseInt(limit));

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

// Function to fetch all PAN entries
const allpan = async (req, res) => {
  try {
    const userId = req.params.id; // Get userId from request

    // Validate userId
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ message: "Invalid user ID" });
    }

    // Fetch the user's isAdmin status
    const user = await User.findById(userId).select("isAdmin");
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Define the match condition based on isAdmin status
    const matchCondition = user.isAdmin
      ? {}
      : { user: new mongoose.Types.ObjectId(userId) };

    // Fetch PAN entries based on the condition
    const panEntries = await Data.aggregate([
      { $match: matchCondition }, // Apply the condition
      {
        $project: {
          panNumber: 1,
          emailCount: { $size: "$email" }, // Add email count for each PAN
        },
      },
    ]);

    res.status(200).json(panEntries);
  } catch (error) {
    console.error("Error fetching PAN entries:", error);
    res
      .status(500)
      .json({ message: "Error fetching PAN entries", error: error.message });
  }
};

// Function to fetch all users
const getAllUsers = async (req, res) => {
  try {
    const userId = req.params.id;

    // Check if the requesting user is an admin
    const requestingUser = await User.findById(userId);
    if (!requestingUser || !requestingUser.isAdmin) {
      return res.status(403).json({ message: "Unauthorized" });
    }

    const users = await User.find({});
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
    const requestingUser = await User.findById(requestingUserId);
    if (!requestingUser || !requestingUser.isAdmin) {
      return res.status(403).json({ message: "Unauthorized" });
    }

    // Update the selected user's isAdmin status
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { isAdmin: true },
      { new: true }
    );

    if (!updatedUser) {
      return res.status(404).json({ message: "User not found" });
    }

    res.status(200).json(updatedUser);
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error granting admin access", error: error.message });
  }
};

// Function to download emails
const downloadEmails = async (req, res) => {
  try {
    const { panNumber } = req.params;
    const { userId } = req.query;

    // Validate userId
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ message: "Invalid user ID" });
    }

    // Fetch the PAN entry for the specific user
    const panEntry = await Data.findOne({
      panNumber,
      user: new mongoose.Types.ObjectId(userId), // Convert userId to ObjectId
    });

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
    const requestingUser = await User.findById(requestingUserId);
    if (!requestingUser || !requestingUser.isAdmin) {
      return res.status(403).json({ message: "Unauthorized" });
    }

    // Delete the selected user
    const deletedUser = await User.findByIdAndDelete(userId);

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

    if (!file) {
      return res.status(400).json({ message: "No file uploaded." });
    }

    const newRequest = new FileRequest({
      userId,
      fileName: file.originalname,
      filePath: file.path, // Ensure this is the correct path
    });

    await newRequest.save();

    res.status(200).json({
      message: "File upload request submitted for approval.",
      requestId: newRequest._id,
    });
  } catch (error) {
    console.error("Error submitting file request:", error);
    res.status(500).json({ message: "Internal server error." });
  }
};

// Fetch pending requests for admin
const getPendingRequests = async (req, res) => {
  try {
    const requests = await FileRequest.find({ status: "pending" }).populate(
      "userId",
      "email"
    );
    res.status(200).json(requests);
  } catch (error) {
    console.error("Error fetching pending requests:", error);
    res.status(500).json({ message: "Internal server error." });
  }
};

const updateRequestStatus = async (req, res) => {
  try {
    const { requestId } = req.params;
    const { status } = req.body;

    if (!["approved", "rejected"].includes(status)) {
      return res.status(400).json({ message: "Invalid status." });
    }

    const request = await FileRequest.findById(requestId);
    if (!request) {
      return res.status(404).json({ message: "Request not found." });
    }

    request.status = status;
    await request.save();

    if (status === "approved") {
      // Ensure the "uploads/processed" directory exists
      const processedDir = path.join(__dirname, "../uploads/processed");
      if (!fs.existsSync(processedDir)) {
        fs.mkdirSync(processedDir, { recursive: true });
      }

      // Verify the file exists before moving it
      if (fs.existsSync(request.filePath)) {
        const finalPath = path.join(processedDir, request.fileName);
        fs.renameSync(request.filePath, finalPath);
        request.filePath = finalPath;
        await request.save();

        // Process the file after moving it
        const results = [];
        await new Promise((resolve, reject) => {
          fs.createReadStream(finalPath)
            .pipe(csv())
            .on("headers", (headers) => {
              console.log("Headers:", headers);

              // Normalize headers to lowercase and trim whitespace
              const normalizedHeaders = headers.map((header) =>
                header.trim().toLowerCase()
              );

              // Find the indices of the relevant columns
              const panHeaderIndex = normalizedHeaders.findIndex((header) =>
                header.includes("pan")
              );
              const emailHeaderIndex = normalizedHeaders.findIndex((header) =>
                header.includes("email")
              );

              if (panHeaderIndex === -1 || emailHeaderIndex === -1) {
                reject(
                  new Error("CSV file must contain 'pan' and 'email' columns.")
                );
              }
            })
            .on("data", (data) => {
              // Extract the relevant columns using the header names
              const panNumber = data.pan;
              const email = data.email;

              // Skip empty rows
              if (panNumber && email) {
                results.push({ panNumber, email });
              } else {
                console.log("Skipping row due to empty panNumber or email");
              }
            })
            .on("end", () => {
              console.log("Parsed Results:", results);
              console.log(`Parsed ${results.length} rows`);

              // Process the data in batches
              processDataInBatches(results, request.userId);

              // Delete the file after processing
              fs.unlinkSync(finalPath);

              resolve();
            })
            .on("error", (error) => {
              console.error("Error parsing CSV file:", error);
              reject(error);
            });
        });
      } else {
        console.error("File not found:", request.filePath);
        return res.status(404).json({ message: "File not found." });
      }
    } else if (status === "rejected") {
      // Verify the file exists before deleting it
      if (fs.existsSync(request.filePath)) {
        fs.unlinkSync(request.filePath);
      } else {
        console.error("File not found:", request.filePath);
        return res.status(404).json({ message: "File not found." });
      }
    }

    res.status(200).json({ message: `Request ${status} successfully.` });
  } catch (error) {
    console.error("Error updating request status:", error);
    res.status(500).json({ message: "Internal server error." });
  }
};
// Fetch pending requests for a specific user
const getPendingRequestsByUser = async (req, res) => {
  try {
    const { userId } = req.params;

    // Validate userId
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ message: "Invalid user ID" });
    }

    // Fetch pending requests for the specific user
    const requests = await FileRequest.find({
      userId,
      status: "pending",
    }).populate("userId", "email");

    res.status(200).json(requests);
  } catch (error) {
    console.error("Error fetching pending requests for user:", error);
    res.status(500).json({ message: "Internal server error." });
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
  getPendingRequests,
  updateRequestStatus,
  getPendingRequestsByUser,
};
