const { parentPort, workerData } = require("worker_threads");
const mongoose = require("mongoose");
const { ObjectId } = require("mongoose").Types; // Import ObjectId from mongoose
const Data = require("./models/dataSchema");

// Connect to MongoDB
mongoose.connect(
  "mongodb+srv://nikhil62642:Nikhil1234@cluster0.smjb9.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0",
  {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    serverSelectionTimeoutMS: 30000, // Increase server selection timeout
    socketTimeoutMS: 60000, // Increase socket timeout
    maxPoolSize: 50, // Increase connection pool size
  }
);

// Function to process a batch of data with retries and exponential backoff
const processBatch = async (batch, userId, retries = 3, delay = 1000) => {
  const bulkOps = batch
    .map((row) => {
      // Access panNumber and email directly from the row object
      const { panNumber, email } = row;

      // Skip if panNumber or email is missing
      if (!panNumber || !email) return null;

      return {
        updateOne: {
          filter: { panNumber, user: new ObjectId(userId) }, // Convert userId to ObjectId
          update: { $addToSet: { email } }, // Add the email to the set
          upsert: true,
        },
      };
    })
    .filter(Boolean); // Remove null entries

  try {
    console.log(`Processing batch of ${batch.length} rows`);
    console.log("Bulk Operations:", JSON.stringify(bulkOps, null, 2)); // Log the bulk operations

    const startTime = Date.now();
    const result = await Data.bulkWrite(bulkOps, {
      ordered: false,
      writeConcern: { w: 0 }, // No acknowledgment for faster writes
    });

    console.log("Bulk Write Result:", result); // Log the result of the bulk write
    console.log(`Batch processed in ${Date.now() - startTime}ms`);
    parentPort.postMessage(`Processed batch of ${batch.length} rows`);

    // Log progress after processing each batch
    console.log(`${batch.length} lines done`);
  } catch (error) {
    console.error("Error in bulkWrite:", error); // Log the full error
    if (retries > 0) {
      console.warn(
        `Retrying batch (${retries} retries left) after ${delay}ms...`
      );
      await new Promise((resolve) => setTimeout(resolve, delay));
      await processBatch(batch, userId, retries - 1, delay * 2); // Exponential backoff
    } else {
      throw error;
    }
  }
};

// Process the batch
const { batch, userId } = workerData;
processBatch(batch, userId); // Pass userId as a string
