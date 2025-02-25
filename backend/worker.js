const { parentPort, workerData } = require("worker_threads");
const mongoose = require("mongoose");
const Data = require("./models/dataSchema");

// Connect to MongoDB
mongoose.connect(
  "mongodb+srv://nikhil62642:Nikhil1234@cluster0.smjb9.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0",
  {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    serverSelectionTimeoutMS: 5000, // Increase server selection timeout
    socketTimeoutMS: 45000, // Increase socket timeout
  }
);

// Function to process a batch of data with retries
const processBatch = async (batch, retries = 3) => {
  const bulkOps = batch
    .map((row) => {
      const [panNumber, ...emails] = row[Object.keys(row)[0]].split("   ");
      if (!panNumber || emails.length === 0) return null;

      return {
        updateOne: {
          filter: { panNumber },
          update: { $addToSet: { email: { $each: emails } } },
          upsert: true,
        },
      };
    })
    .filter(Boolean); // Remove null entries

  try {
    await Data.bulkWrite(bulkOps, {
      ordered: false,
      writeConcern: { w: 1 }, // Acknowledge only the primary node
    });
    parentPort.postMessage(`Processed batch of ${batch.length} rows`);
  } catch (error) {
    if (retries > 0) {
      console.warn(`Retrying batch (${retries} retries left)...`);
      await processBatch(batch, retries - 1); // Retry the operation
    } else {
      throw error; // Throw error if retries are exhausted
    }
  }
};

// Process the batch
processBatch(workerData);
