const express = require("express");
const sequelize = require("./config/database"); // Import Sequelize instance
const cors = require("cors");
const dotenv = require("dotenv");
const cookieParser = require("cookie-parser");
const Queue = require("bull");
const OtpModel = require("./models/otpSchema");
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

// server.js - Database connection
// server.js - Database connection
// server.js - Database connection
// server.js - Database connection
// server.js - Database connection
// server.js - Updated database initialization
// Add this utility function at the top of server.js
// Add this function
const initializeOtpTable = async () => {
  try {
    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS Otps (
        id INT AUTO_INCREMENT PRIMARY KEY,
        email VARCHAR(255) NOT NULL,
        otp VARCHAR(6) NOT NULL,
        expiresAt DATETIME NOT NULL,
        used TINYINT(1) DEFAULT 0,
        createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        INDEX otp_email_index (email),
        INDEX otp_expiry_index (expiresAt)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    `);
    console.log("✅ OTP table verified/created");
  } catch (error) {
    console.error("❌ OTP table initialization failed:", error);
    throw error;
  }
};

// In your main initialization
// Add this before app.listen
(async () => {
  try {
    await sequelize.authenticate();
    console.log("✅ Database connection established.");

    // Initialize OTP table first with retries
    await OtpModel.initTable(5); // 5 retries

    // Then sync other models
    await sequelize.sync({ alter: false });
    console.log("✅ All tables verified");

    // Start cleanup job only after tables are ready
    require("./utils/remove-unverified-user");

    app.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
    });
  } catch (error) {
    console.error("❌ Startup failed:", error);
    process.exit(1);
  }
})();
// Routes
app.use("/api", dataRoutes(fileQueue)); // Pass fileQueue to routes
app.use("/api/auth", authRoutes);

// Add after other middleware but before error handling
app.use("/api/invoice", invoiceRoutes);
