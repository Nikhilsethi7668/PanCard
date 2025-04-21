const csv = require("csv-parser");
const fs = require("fs");
const sequelize = require("../config/database"); // Import sequelize
const Data = require("../models/dataSchema");
const User = require("../models/userSchema");
const processDataInBatches = require("../processDataInBatches");
const FileRequest = require("../models/fileRequests");
const path = require("path");
const { Parser } = require("json2csv");
const PanEmailData = require("../models/panEmailDataSchema");
const { Op, fn, col, where, literal, Sequelize } = require("sequelize");
const { Invoice } = require("../models");

let fileQueue;

// Set the Bull queue
const setQueue = (queue) => {
  fileQueue = queue;
  initializeQueueProcessor(); // Initialize the queue processor after setting the queue
};

const initializeQueueProcessor = () => {
  fileQueue.process(async (job, done) => {
    const { filePath, userId } = job.data;
    const results = [];

    console.log("Processing file:", filePath);

    // Stream the file and parse it using csv-parser
    fs.createReadStream(filePath)
      .pipe(csv())
      .on("headers", (headers) => {
        console.log("Headers:", headers);

        // Normalize headers to lowercase and trim whitespace
        const normalizedHeaders = headers.map((header) =>
          header.trim().toLowerCase()
        );

        console.log("Normalized Headers:", normalizedHeaders);

        // Find the indices of the relevant columns
        const emailHeaderIndex = normalizedHeaders.findIndex((header) =>
          header.includes("email")
        );

        console.log("Email Header Index:", emailHeaderIndex);

        if (panHeaderIndex === -1 || emailHeaderIndex === -1) {
          throw new Error("CSV file must contain 'email' column.");
        }

        // Store the indices for later use
        job.data.emailHeaderIndex = emailHeaderIndex;
      })
      .on("data", (data) => {
        console.log("Raw Row:", data);

        // Extract the relevant columns using the header names
        const email = data.email;

        console.log("Extracted Email:", email);

        // Skip empty rows
        if (email) {
          results.push({ email, userId });
        } else {
          console.log("Skipping row due to empty panNumber or email");
        }
      })
      .on("end", () => {
        console.log("Parsed Results:", results);
        console.log(`Parsed ${results.length} rows`);

        // Process the data in batches
        processDataInBatches(results, userId);

        // Delete the file after processing
        fs.unlinkSync(filePath);

        done(); // Signal that the job is done
      })
      .on("error", (error) => {
        console.error("Error parsing CSV file:", error);
        done(error); // Signal that the job failed
      });
  });
};

// Upload and process file
const uploadFile = async (req, res) => {
  try {
    const userId = req.params.id;

    // Ensure user exists
    const user = await User.findByPk(userId);
    if (!user) {
      console.log("No User Exists");
      return res.status(400).json({ message: "User doesn't exist" });
    }

    // Check if file is uploaded
    if (!req.file) {
      return res.status(400).send("No file uploaded.");
    }

    // Add the file processing job to the queue
    const job = await fileQueue.add({ filePath: req.file.path, userId });

    // Wait for the job to finish
    await job.finished();

    // Send response after the job is completed
    res.status(200).send("File processed successfully.");
  } catch (error) {
    console.error("Error during file upload:", error);
    res.status(500).json({ message: "Internal server error." });
  }
};
// Function to fetch all data from the database
const getData = async (req, res) => {
  try {
    const panNumber = req.params.panNumber;
    const { page = 1, limit = 100, type } = req.query;
    const offset = (page - 1) * limit;
    const userId = req.query.userId;
    const user = await User.findByPk(userId);
    if (!user) {
      console.log("No User Exists");
      return res.status(400).json({ message: "User doesn't exist" });
    }
    if (!type) {
      return res.status(400).json({ message: "Type is required" });
    }
    let panEntry = {};

    if (user.isAdmin) {
      if (type === "data") {
        const targetUser = await User.findOne({ where: { panNumber } });
        if (!targetUser) {
          return res
            .status(404)
            .json({ message: "User with this PAN not found" });
        }

        const dataEntries = await Data.findAll({
          where: { userId: targetUser.id },
          attributes: ["email"],
          raw: true,
        });

        if (!dataEntries || dataEntries?.length === 0) {
          return res
            .status(404)
            .json({ message: "No data found for this user" });
        }

        // Process all emails into a single array
        const allEmails = await (dataEntries || [])
          .map((entry) => {
            try {
              return entry?.email ? JSON.parse(entry.email) : [];
            } catch (e) {
              console.error("Email parsing error:", e);
              return [];
            }
          })
          .flat()
          .filter((email) => typeof email === "string" && email.includes("@"));

        // Absolute safety check - ensure we're working with an array
        const safeEmails = (await Array.isArray(allEmails)) ? allEmails : [];
        const startIdx = Math.max(0, (parseInt(page) - 1) * parseInt(limit));
        const endIdx = startIdx + parseInt(limit);

        const paginatedEmails = safeEmails.slice(startIdx, endIdx);

        responseData = {
          panNumber,
          emails: paginatedEmails,
          totalEmails: allEmails.length,
          currentPage: parseInt(page),
          totalPages: Math.ceil(allEmails.length / limit),
        };
        res.status(200).json(responseData);
        return;
      }

      if (type == "user") {
        panEntry = await User.findOne({
          where: { panNumber },
        });
      }
      if (type == "panemail") {
        panEntry = await PanEmailData.findOne({
          where: { panNumber },
        });
      }
    } else {
      if (type !== "data") {
        return res.status(403).json({ message: "Access denied for this type" });
      }

      const dataEntries = await Data.findAll({
        where: { userId },
        attributes: ["email"],
        raw: true,
      });

      if (!dataEntries || dataEntries?.length === 0) {
        return res.status(404).json({ message: "No data found for this user" });
      }

      // Process all emails into a single array
      const allEmails = await (dataEntries || [])
        .map((entry) => {
          try {
            return entry?.email ? JSON.parse(entry.email) : [];
          } catch (e) {
            console.error("Email parsing error:", e);
            return [];
          }
        })
        .flat()
        .filter((email) => typeof email === "string" && email.includes("@"));

      const safeEmails = (await Array.isArray(allEmails)) ? allEmails : [];
      const startIdx = Math.max(0, (parseInt(page) - 1) * parseInt(limit));
      const endIdx = startIdx + parseInt(limit);

      const paginatedEmails = safeEmails.slice(startIdx, endIdx);
      responseData = {
        panNumber: user.panNumber,
        emails: paginatedEmails,
        totalEmails: allEmails.length,
        currentPage: parseInt(page),
        totalPages: Math.ceil(allEmails.length / limit),
      };
      res.status(200).json(responseData);
      return;
    }

    if (!panEntry) {
      return res
        .status(404)
        .json({ message: "PAN number not found for this user" });
    }

    const emails = panEntry?.email?.slice(offset, offset + parseInt(limit));

    res.status(200).json({
      panNumber: panEntry.panNumber,
      emails,
      totalEmails: panEntry.email?.length,
      currentPage: parseInt(page),
      totalPages: Math.ceil(panEntry?.email?.length / limit),
    });
  } catch (error) {
    console.error("Error fetching data:", error);
    res
      .status(500)
      .json({ message: "Error fetching data", error: error.message });
  }
};

const allpan = async (req, res) => {
  try {
    const userId = req.params.id;
    const { page = 1, searchText = "", limit = 10, type = "data" } = req.query;

    const parsedPage = Math.max(parseInt(page), 1);
    const parsedLimit = Math.min(Math.max(parseInt(limit), 1), 100);
    const offset = (parsedPage - 1) * parsedLimit;

    const user = await User.findByPk(userId, {
      attributes: ["isAdmin"],
      raw: true,
    });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (type === "data") {
      // 1. Get users and map userId => panNumber
      const users = await User.findAll({
        attributes: ["id", "panNumber"],
        raw: true,
      });

      const userIdToPan = {};
      const panToUserIds = {};

      users.forEach(({ id, panNumber }) => {
        userIdToPan[id] = panNumber;
        if (!panToUserIds[panNumber]) panToUserIds[panNumber] = [];
        panToUserIds[panNumber].push(id);
      });

      // 2. Allowed users (admin or self)
      const allowedUserIds = user.isAdmin
        ? users.map((u) => u.id)
        : [parseInt(userId)];

      // 3. Get Data entries
      const dataEntries = await Data.findAll({
        where: {
          userId: { [Op.in]: allowedUserIds },
        },
        attributes: ["id", "userId", "email"],
        raw: true,
      });

      // 4. Group emails by panNumber
      const grouped = {};

      for (const entry of dataEntries) {
        const pan = userIdToPan[entry.userId];
        if (!grouped[pan]) {
          grouped[pan] = {
            panNumber: pan,
            emails: entry.email || "",
          };
        } else {
          grouped[pan].emails += "," + entry.email;
        }
      }

      // 5. Convert to array with emailCount
      let combinedResults = Object.entries(grouped).map(([pan, data], idx) => {
        const emailsArray = data.emails
          .split(",")
          .filter((e) => e.trim() !== "");
        return {
          id: idx + 1,
          panNumber: pan,
          emailCount: emailsArray.length,
        };
      });

      // 6. Apply search if provided
      if (searchText) {
        combinedResults = combinedResults.filter((item) =>
          item.panNumber?.toLowerCase().includes(searchText.toLowerCase())
        );
      }

      // 7. Pagination
      const totalCount = combinedResults.length;
      const paginated = combinedResults.slice(offset, offset + parsedLimit);

      return res.status(200).json({
        totalCount,
        currentPage: parsedPage,
        totalPages: Math.ceil(totalCount / parsedLimit),
        items: paginated,
        type: type,
      });
    }

    // ========== Logic for user and panemail remains unchanged ==========
    let model, whereCondition, attributes;
    switch (type) {
      case "user":
        if (!user.isAdmin) {
          return res.status(403).json({ message: "Access denied" });
        }
        model = User;
        whereCondition = {};
        attributes = ["id", "username", "panNumber", "email"];
        break;

      case "panemail":
        if (!user.isAdmin) {
          return res.status(403).json({ message: "Access denied" });
        }
        model = PanEmailData;
        whereCondition = {};
        attributes = ["id", "panNumber"];
        break;
    }

    if (searchText) {
      if (type === "panemail") {
        whereCondition.panNumber = {
          [Op.like]: `%${searchText.toLowerCase()}%`,
        };
      } else if (type === "user") {
        whereCondition[Op.or] = [
          { panNumber: { [Op.like]: `%${searchText.toLowerCase()}%` } },
          { username: { [Op.like]: `%${searchText.toLowerCase()}%` } },
          { email: { [Op.like]: `%${searchText.toLowerCase()}%` } },
        ];
      }
    }

    const totalCount = await model.count({ where: whereCondition });

    let results = await model.findAll({
      where: whereCondition,
      attributes: attributes,
      order: [["panNumber", "ASC"]],
      limit: parsedLimit,
      offset: offset,
      raw: true,
    });

    if (type === "panemail") {
      const ids = results.map((item) => item.id);
      let emailCounts = [];

      if (ids.length > 0) {
        emailCounts = await sequelize.query(
          `SELECT id, JSON_LENGTH(Emails) AS emailCount FROM PanEmailData WHERE id IN (?)`,
          {
            replacements: [ids],
            type: sequelize.QueryTypes.SELECT,
          }
        );
      }

      const countMap = emailCounts.reduce((acc, item) => {
        acc[item.id] = item.emailCount;
        return acc;
      }, {});

      results = results.map((item) => ({
        ...item,
        emailCount: countMap[item.id] || 0,
      }));
    } else if (type === "user") {
      results = results.map((item) => ({
        ...item,
        emailCount: item.email ? 1 : 0,
      }));
    }

    res.status(200).json({
      totalCount,
      currentPage: parsedPage,
      totalPages: Math.ceil(totalCount / parsedLimit),
      items: results,
      type: type,
    });
  } catch (error) {
    console.error("Error fetching data:", error);
    res.status(500).json({
      message: "Error fetching data",
      error: error.message,
    });
  }
};

// Function to fetch all users
const getAllUsers = async (req, res) => {
  try {
    const userId = req.params.id;

    // Check if the requesting user is an admin
    const requestingUser = await User.findByPk(userId);
    if (!requestingUser || !requestingUser.isAdmin) {
      return res.status(403).json({ message: "Unauthorized" });
    }

    const users = await User.findAll();
    res.status(200).json(users);
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error fetching users", error: error.message });
  }
};

// Function to grant admin access to a user
const grantAdminAccess = async (req, res) => {
  try {
    const userId = req.params.id; // Selected user's ID
    const { requestingUserId } = req.body; // Requesting user's ID

    // Check if the requesting user is an admin
    const requestingUser = await User.findByPk(requestingUserId);
    if (!requestingUser || !requestingUser.isAdmin) {
      return res.status(403).json({ message: "Unauthorized" });
    }

    // Update the selected user's isAdmin status
    const updatedUser = await User.update(
      { isAdmin: true },
      { where: { id: userId }, returning: true }
    );

    if (!updatedUser[1]) {
      return res.status(404).json({ message: "User not found" });
    }

    res.status(200).json(updatedUser[1][0]);
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error granting admin access", error: error.message });
  }
};
const downloadEmails = async (req, res) => {
  try {
    const { panNumber } = req.params;
    const { userId, type } = req.query;

    // Fetch the PAN entry for the specific user
    const user = await User.findByPk(userId);
    const whereCondition = user.isAdmin ? {} : { userId };
    let panEntry = {};
    if (type === "data") {
      let dataEntries = [];
      let pan = panNumber;

      if (user.isAdmin) {
        const targetUser = await User.findOne({ where: { panNumber } });
        if (!targetUser) {
          return res
            .status(404)
            .json({ message: "User with this PAN not found" });
        }
        dataEntries = await Data.findAll({
          where: { userId: targetUser.id },
          attributes: ["email"],
          raw: true,
        });
        pan = targetUser.panNumber;
      } else {
        dataEntries = await Data.findAll({
          where: { userId },
          attributes: ["email"],
          raw: true,
        });
      }

      if (!dataEntries || dataEntries.length === 0) {
        return res.status(404).json({ message: "No data found for this user" });
      }

      const allEmails = dataEntries
        .map((entry) => {
          try {
            return entry?.email ? JSON.parse(entry.email) : [];
          } catch (e) {
            console.error("Email parsing error:", e);
            return [];
          }
        })
        .flat()
        .filter((email) => typeof email === "string" && email.includes("@"));

      return res.status(200).json({
        emails: allEmails,
      });
    }
    if (type == "panemail") {
      panEntry = await PanEmailData.findOne({
        where: { panNumber },
      });
    }

    if (!panEntry) {
      return res
        .status(404)
        .json({ message: "PAN number not found for this user" });
    }

    // Return all emails
    res.status(200).json({ emails: panEntry.email });
  } catch (error) {
    console.error("Error fetching emails for download:", error);
    res
      .status(500)
      .json({ message: "Error fetching emails", error: error.message });
  }
};

// Function to delete a user
const deleteUser = async (req, res) => {
  try {
    const userId = req.params.id; // Selected user's ID
    const { requestingUserId } = req.body; // Requesting user's ID

    // Check if the requesting user is an admin
    const requestingUser = await User.findByPk(requestingUserId);
    if (!requestingUser || !requestingUser.isAdmin) {
      return res.status(403).json({ message: "Unauthorized" });
    }

    // Delete the selected user
    await Invoice.destroy({ where: { userId } });
    await Data.destroy({ where: { userId } });
    await FileRequest.destroy({ where: { userId } });
    const deletedUser = await User.destroy({ where: { id: userId } });

    if (!deletedUser) {
      return res.status(404).json({ message: "User not found" });
    }

    res.status(200).json({ message: "User deleted successfully" });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error deleting user", error: error.message });
  }
};
// Submit file upload request
const submitFileRequest = async (req, res) => {
  try {
    const userId = req.params.id;
    const file = req.file;

    // Validate file
    if (!file) {
      return res.status(400).json({ message: "No file uploaded." });
    }

    // Validate userId
    if (!userId || isNaN(userId)) {
      return res.status(400).json({ message: "Invalid user ID." });
    }

    // Create new file request
    const newRequest = await FileRequest.create({
      userId: parseInt(userId, 10),
      fileName: file.originalname,
      filePath: file.path,
      // approvalStage and numberOfPans will default automatically
    });

    res.status(200).json({
      message: "File upload request submitted for approval.",
      requestId: newRequest.id,
    });
  } catch (error) {
    console.error("Error submitting file request:", error);
    res.status(500).json({ message: "Internal server error." });
  }
};

// Fetch pending requests for admin
const getRequests = async (req, res) => {
  try {
    const { approvalStage } = req.query;

    const whereClause = {};

    // If approvalStage is provided, filter by it
    if (approvalStage) {
      whereClause.approvalStage = approvalStage;
    }

    const requests = await FileRequest.findAll({
      where: whereClause,
      include: [
        {
          model: User,
          as: "user",
          attributes: ["email"],
        },
      ],
    });

    res.status(200).json(requests);
  } catch (error) {
    console.error("Error fetching file requests:", error);
    res.status(500).json({ message: "Internal server error." });
  }
};

const updateRequestStatus = async (req, res) => {
  try {
    const { requestId } = req.params;
    const { status } = req.body;
    const { userId } = req.user;

    if (!["approved", "rejected"].includes(status)) {
      return res.status(400).json({ message: "Invalid approval stage." });
    }

    const request = await FileRequest.findByPk(requestId);
    if (!request) {
      return res.status(404).json({ message: "Request not found." });
    }

    request.approvalStage = status;

    if (status === "approved") {
      // Add metadata
      request.approvedBy = userId;
      request.approvedAt = new Date();
      const processedDir = path.join(__dirname, "../uploads/processed");
      if (!fs.existsSync(processedDir)) {
        fs.mkdirSync(processedDir, { recursive: true });
      }

      if (fs.existsSync(request.filePath)) {
        const finalPath = path.join(processedDir, request.fileName);
        fs.renameSync(request.filePath, finalPath);
        request.filePath = finalPath;

        const results = [];
        await new Promise((resolve, reject) => {
          fs.createReadStream(finalPath)
            .pipe(csv())
            .on("headers", (headers) => {
              const normalizedHeaders = headers.map((h) =>
                h.trim().toLowerCase()
              );
              if (!normalizedHeaders.some((h) => h.includes("email"))) {
                reject(
                  new Error("CSV must contain 'pan' and 'email' columns.")
                );
              }
            })
            .on("data", (row) => {
              const email = row.email;
              if (email) {
                results.push({
                  email,
                  fileRequestId: request.id,
                  userId: request.userId,
                });
              }
            })
            .on("end", () => {
              request.numberOfPans = results.length;
              processDataInBatches(results, request.userId); // your batch processor logic
              fs.unlinkSync(finalPath); // delete after processing
              resolve();
            })
            .on("error", (error) => {
              reject(error);
            });
        });
      } else {
        return res.status(404).json({ message: "File not found." });
      }
    } else if (status === "rejected") {
      // Just delete file
      if (fs.existsSync(request.filePath)) {
        fs.unlinkSync(request.filePath);
      }
    }

    await request.save();

    res.status(200).json({ message: `Request ${status} successfully.` });
  } catch (error) {
    console.error("Error updating request status:", error);
    res.status(500).json({ message: "Internal server error." });
  }
};

// Fetch pending requests for a specific user
const getRequestsByUser = async (req, res) => {
  try {
    const userId = req.params.userId;
    const { approvalStage } = req.query;

    // Validate userId
    if (!userId || isNaN(userId)) {
      return res.status(400).json({ message: "Invalid user ID." });
    }

    const whereClause = {
      userId: parseInt(userId, 10),
    };

    // Add stage filter if present
    if (approvalStage) {
      whereClause.approvalStage = approvalStage;
    }

    const requests = await FileRequest.findAll({
      where: whereClause,
      include: [
        {
          model: User,
          as: "user",
          attributes: ["email"],
        },
      ],
    });

    res.status(200).json(requests);
  } catch (error) {
    console.error("Error fetching requests for user:", error);
    res.status(500).json({ message: "Internal server error." });
  }
};

const downloadFile = async (req, res) => {
  try {
    const { requestId } = req.params;

    // Find the request by ID
    const request = await FileRequest.findByPk(requestId);
    if (!request) {
      return res.status(404).json({ message: "File request not found." });
    }

    // Check if the file exists
    const filePath = request.filePath;
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ message: "File not found." });
    }

    // Set proper headers for CSV download
    res.setHeader("Content-Type", "text/csv");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="${
        request.fileName.endsWith(".csv")
          ? request.fileName
          : request.fileName + ".csv"
      }"`
    );

    // Create read stream and pipe to response
    const fileStream = fs.createReadStream(filePath);
    fileStream.pipe(res);

    fileStream.on("error", (error) => {
      console.error("File stream error:", error);
      res.status(500).end();
    });
  } catch (error) {
    console.error("Error downloading file:", error);
    return res.status(500).json({ message: "Internal server error." });
  }
};
const deleteFileRequest = async (req, res) => {
  try {
    const { requestId } = req.params;

    // Fetch the request
    const request = await FileRequest.findByPk(requestId);
    if (!request) {
      return res.status(404).json({ message: "File request not found." });
    }

    // Set approvalStage to 'deleted'
    request.approvalStage = "deleted";
    await request.save();

    // Delete associated data entries
    await Data.destroy({
      where: { fileRequestId: requestId },
    });

    // Optionally delete the file from disk if it exists
    if (fs.existsSync(request.filePath)) {
      fs.unlinkSync(request.filePath);
    }

    return res
      .status(200)
      .json({
        message: "File request marked as deleted and associated data removed.",
      });
  } catch (error) {
    console.error("Error deleting file request:", error);
    return res.status(500).json({ message: "Internal server error." });
  }
};

const downloadCsv = async (req, res) => {
  try {
    const { requestId } = req.params;

    // Fetch all data entries associated with the requestId
    const dataEntries = await Data.findAll({
      where: { fileRequestId: requestId },
      raw: true,
    });

    if (!dataEntries || dataEntries.length === 0) {
      return res
        .status(404)
        .json({ message: "No data found for this request." });
    }

    // Transform data into CSV format
    const csvData = [];
    dataEntries.forEach((entry) => {
      // Parse the JSON email array
      const emails = JSON.parse(entry.email);

      // Create a row for each email associated with the PAN
      emails.forEach((email) => {
        csvData.push({
          email: email,
        });
      });
    });

    // Configure CSV parser
    const fields = ["email"];
    const opts = { fields };
    const parser = new Parser(opts);
    const csv = parser.parse(csvData);

    // Create a unique filename
    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
    const filename = `data-export-${requestId}-${timestamp}.csv`;
    const filePath = path.join(__dirname, "../temp", filename);

    // Ensure temp directory exists
    if (!fs.existsSync(path.dirname(filePath))) {
      fs.mkdirSync(path.dirname(filePath), { recursive: true });
    }

    // Write CSV to file
    fs.writeFileSync(filePath, csv);

    // Set headers for file download
    res.setHeader("Content-Type", "text/csv");
    res.setHeader("Content-Disposition", `attachment; filename=${filename}`);

    // Stream the file and then delete it
    const fileStream = fs.createReadStream(filePath);
    fileStream.pipe(res);

    fileStream.on("close", () => {
      fs.unlinkSync(filePath); // Clean up the temp file
    });
  } catch (error) {
    console.error("Error generating CSV:", error);
    return res.status(500).json({
      message: "Error generating CSV export",
      error: error.message,
    });
  }
};

module.exports = {
  downloadCsv,
  uploadFile,
  allpan,
  getData,
  setQueue,
  getAllUsers,
  grantAdminAccess,
  deleteUser,
  downloadEmails,
  submitFileRequest,
  getRequests,
  updateRequestStatus,
  getRequestsByUser,
  downloadFile,
  deleteFileRequest,
};
