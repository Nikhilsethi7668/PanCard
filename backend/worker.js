const { parentPort, workerData } = require("worker_threads");
const { sequelize } = require("./config/database"); // Import Sequelize instance
const Data = require("./models/dataSchema"); // Import Data model

// Function to process a batch of data with retries and exponential backoff
const processBatch = async (batch, userId, retries = 3, delay = 1000) => {
  try {
    console.log(`Processing batch of ${batch.length} rows`);

    const startTime = Date.now();

    // Insert or update data in MySQL
    for (const row of batch) {
      const { panNumber,fileRequestId, email } = row;

      if (!panNumber || !email) continue;

      // Find or create the PAN entry
      const [dataEntry, created] = await Data.findOrCreate({
        where: { panNumber, userId },
        defaults: { email: [email], fileRequestId, }, // Default value for new entries
      });

      if (!created) {
        // Update existing entry
        const emails = dataEntry.email || [];
        if (!emails.includes(email)) {
          emails.push(email);
          await dataEntry.update({ email: emails });
        }
      }
    }

    console.log(`Batch processed in ${Date.now() - startTime}ms`);
    parentPort.postMessage(`Processed batch of ${batch.length} rows`);

    // Log progress after processing each batch
    console.log(`${batch.length} lines done`);
  } catch (error) {
    console.error("Error processing batch:", error); // Log the full error
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
