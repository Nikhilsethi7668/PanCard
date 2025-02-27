const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const dataRoutes = require("./routes/filedata.route.js");
const Queue = require("bull");
const dotenv = require("dotenv");
const cookieParser = require("cookie-parser");
const router = require("./routes/auth.routes.js");

const app = express();
const PORT = process.env.PORT || 4000;

// Middleware
app.use(cors({ origin: "http://localhost:5173", credentials: true }));
app.use(express.json());

// MongoDB Connectio
mongoose
  .connect(
    "mongodb+srv://nikhil62642:Nikhil1234@cluster0.smjb9.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0",
    {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      maxpoolSize: 10, // Increase connection pool size
    }
  )
  .then(() => console.log("Connected to MongoDB"))
  .catch((err) => console.error("Error connecting to MongoDB:", err));

// Bull queue for background processing
const fileQueue = new Queue("fileProcessing", "redis://127.0.0.1:6379");

// Routes
app.use("/api", dataRoutes(fileQueue));
app.use("/api/auth", router);

// Start the Server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
