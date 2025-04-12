const express = require("express");
const sequelize = require("./config/database"); // Import Sequelize instance
const cors = require("cors");
const dotenv = require("dotenv");
const cookieParser = require("cookie-parser");
const Queue = require("bull");
require("./utils/remove-unverified-user.js");
// Load environment variables
dotenv.config();

const dataRoutes = require("./routes/filedata.route.js");
const authRoutes = require("./routes/auth.routes.js");

// Initialize Express app
const app = express();
app.use(cookieParser());

const PORT = process.env.PORT || 4000;
const corseConnection = [
  "http://localhost:5173",
  "http://localhost:4173",
  "https://panemail.amiigo.in",
  "https://pancard-1-3vgg.onrender.com",
];

// Middleware
app.use(cors({ origin: corseConnection, credentials: true }));
app.use(express.json());

// Bull queue for background processing
const fileQueue = new Queue("fileProcessing", "redis://127.0.0.1:6379");

// Database Connection & Sync
(async () => {
  try {
    await sequelize.authenticate();
    console.log("✅ Connected to MySQL database.");

    // Sync all models with the database
    await sequelize.sync({ alter: true });
    console.log("✅ All models were synchronized successfully.");

    // Start the Server after DB sync
    app.listen(PORT, () => {
      console.log(`🚀 Server is running on port ${PORT}`);
    });
  } catch (error) {
    console.error("❌ Error connecting to the database:", error);
    process.exit(1); // Exit process if DB connection fails
  }
})();

// Routes
app.use("/api", dataRoutes(fileQueue)); // Pass fileQueue to routes
app.use("/api/auth", authRoutes);
