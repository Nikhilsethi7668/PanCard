const { Worker } = require("worker_threads");
const os = require("os");

const processDataInBatches = async (data, userId, batchSize = 50000) => {
  const numWorkers = os.cpus().length; // Use all available CPU cores
  const workers = [];
  let totalLinesProcessed = 0;

  for (let i = 0; i < data.length; i += batchSize * numWorkers) {
    const workerPromises = [];

    for (let j = 0; j < numWorkers; j++) {
      const start = i + j * batchSize;
      const end = start + batchSize;
      const batch = data.slice(start, end);

      if (batch.length === 0) continue;

      const worker = new Worker("./worker.js", {
        workerData: { batch, userId: userId.toString() }, // Ensure userId is passed as a string
      });
      workers.push(worker);

      workerPromises.push(
        new Promise((resolve, reject) => {
          worker.on("message", (msg) => {
            console.log(msg);
            totalLinesProcessed += batch.length;
            console.log(`Total lines processed: ${totalLinesProcessed}`);
            resolve();
          });
          worker.on("error", (err) => reject(err));
          worker.on("exit", (code) => {
            if (code !== 0)
              reject(new Error(`Worker stopped with exit code ${code}`));
          });
        })
      );
    }

    await Promise.all(workerPromises); // Wait for all workers to finish
  }
};
module.exports = processDataInBatches;
