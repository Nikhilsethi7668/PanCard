const express = require("express");
const sequelize = require("./config/database"); // Import Sequelize instance
const cors = require("cors");
const dataRoutes = require("./routes/filedata.route.js");
const Queue = require("bull");
const dotenv = require("dotenv");
const cookieParser = require("cookie-parser");
const router = require("./routes/auth.routes.js");

// Load environment variables
dotenv.config();

const app = express();
app.use(cookieParser());

const PORT = process.env.PORT || 4000;
const corseConnection = [
  "http://localhost:5173",
  "https://pancard-1-3vgg.onrender.com",
];

// Middleware
app.use(cors({ origin: corseConnection, credentials: true }));
app.use(express.json());

// MySQL Connection
sequelize
  .authenticate()
  .then(() => {
    console.log("Connected to MySQL database.");
  })
  .catch((err) => {
    console.error("Unable to connect to MySQL database:", err);
  });

// Sync Sequelize models with the database
sequelize
  .sync({ alter: true }) // Use `force: true` to drop and recreate tables (for development only)
  .then(() => {
    console.log("All models were synchronized successfully.");
  })
  .catch((err) => {
    console.error("Error synchronizing models:", err);
  });

// Bull queue for background processing
const fileQueue = new Queue("fileProcessing", "redis://127.0.0.1:6379");

// Routes
app.use("/api", dataRoutes(fileQueue)); // Pass fileQueue to dataRoutes
app.use("/api/auth", router);

// Start the Server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
