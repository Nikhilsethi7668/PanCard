const csv = require("csv-parser");
const fs = require("fs");
const Data = require("../models/dataSchema");
const User = require("../models/userSchema");
const processDataInBatches = require("../processDataInBatches");
const mongoose = require("mongoose");

let fileQueue;

// Set the Bull queue
const setQueue = (queue) => {
  fileQueue = queue;
  initializeQueueProcessor(); // Initialize the queue processor after setting the queue
};

// Function to initialize the queue processor
const initializeQueueProcessor = () => {
  fileQueue.process(async (job) => {
    const { filePath, userId } = job.data;
    const results = [];

    // Stream the file and parse it using csv-parser
    fs.createReadStream(filePath)
      .pipe(csv())
      .on("data", (data) => results.push(data[Object.keys(data)[0]])) // Extract the relevant data
      .on("end", () => {
        console.log(`Parsed ${results.length} rows`);
        processDataInBatches(results, userId); // Pass userId
        fs.unlinkSync(filePath); // Delete the file after processing
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
    await fileQueue.add({ filePath: req.file.path, userId });

    res.status(200).send("File upload received. Processing in the background.");
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
// Function to fetch all PAN entries for a user
const allpan = async (req, res) => {
  try {
    const userId = req.params.id; // Get userId from request

    // Validate userId
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ message: "Invalid user ID" });
    }

    // Fetch all PAN entries for the specific user with their email counts
    const panEntries = await Data.aggregate([
      { $match: { user: new mongoose.Types.ObjectId(userId) } }, // Convert userId to ObjectId
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

module.exports = { uploadFile, allpan, getData, setQueue };
