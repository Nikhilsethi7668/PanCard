const express = require("express");
const sequelize = require("./config/database"); // Import Sequelize instance
const cors = require("cors");
const dotenv = require("dotenv");
const cookieParser = require("cookie-parser");
const Queue = require("bull");
require("./utils/remove-unverified-user.js");
// Import the invoice routes
const invoiceRoutes = require("./routes/invoiceRoutes");
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
// Database Connection & Sync
// server.js - Modify your sync code
// Remove any existing sync/alter code and replace with:

(async () => {
  try {
    await sequelize.authenticate();
    console.log("✅ Database connection established.");

    // Create tables if they don't exist
    await sequelize.sync({ force: true }); // Only for development!
    console.log("✅ Tables created successfully.");

    app.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
    });
  } catch (error) {
    console.error("❌ Database connection failed:", error);
    process.exit(1);
  }
})();

// Routes
app.use("/api", dataRoutes(fileQueue)); // Pass fileQueue to routes
app.use("/api/auth", authRoutes);

// Add after other middleware but before error handling
app.use("/api/invoice", invoiceRoutes);
