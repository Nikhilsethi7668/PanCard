const Data = require("../models/dataSchema");
const csv = require("fast-csv");
const fs = require("fs");
const { Worker } = require("worker_threads");

let fileQueue;

// Set the Bull queue
exports.setQueue = (queue) => {
  fileQueue = queue;
  initializeQueueProcessor(); // Initialize the queue processor after setting the queue
};

// Function to initialize the queue processor
const initializeQueueProcessor = () => {
  fileQueue.process(async (job) => {
    const { filePath } = job.data;
    const results = [];

    // Stream the file and parse it using fast-csv
    fs.createReadStream(filePath)
      .pipe(csv.parse({ headers: true }))
      .on("data", (data) => results.push(data))
      .on("end", () => {
        console.log(`Parsed ${results.length} rows`);
        processDataInBatches(results); // Process data in batches
        fs.unlinkSync(filePath); // Delete the file after processing
      });
  });
};

// Upload and process file
exports.uploadFile = async (req, res) => {
  if (!req.file) {
    return res.status(400).send("No file uploaded.");
  }

  // Add the file processing job to the queue
  fileQueue.add({ filePath: req.file.path });

  res.status(200).send("File upload received. Processing in the background.");
};

// Function to process data in batches
const processDataInBatches = async (data, batchSize = 10000) => {
  for (let i = 0; i < data.length; i += batchSize) {
    const batch = data.slice(i, i + batchSize);

    // Use worker threads for parallel processing
    const worker = new Worker("./worker.js", { workerData: batch });
    worker.on("message", (msg) => console.log(msg));
    worker.on("error", (err) => console.error(err));
    worker.on("exit", (code) => {
      if (code !== 0) console.error(`Worker stopped with exit code ${code}`);
    });
  }
};

// Function to fetch all data from the database
exports.getData = async (req, res) => {
  try {
    const { panNumber } = req.params;
    const { page = 1, limit = 100 } = req.query;
    const skip = (page - 1) * limit;

    // Find the PAN entry
    const panEntry = await Data.findOne({ panNumber });

    if (!panEntry) {
      return res.status(404).json({ message: "PAN number not found" });
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
    res
      .status(500)
      .json({ message: "Error fetching data", error: error.message });
  }
};
exports.allpan = async (req, res) => {
  try {
    // Fetch all PAN entries with their email counts
    const panEntries = await Data.aggregate([
      {
        $project: {
          panNumber: 1,
          emailCount: { $size: "$email" }, // Add email count for each PAN
        },
      },
    ]);

    res.status(200).json(panEntries);
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error fetching PAN entries", error: error.message });
  }
};
