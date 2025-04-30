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
    const { page = 1, limit = 100, type = "data" } = req.query;
    const parsedPage = Math.max(parseInt(page), 1);
    const parsedLimit = Math.min(Math.max(parseInt(limit), 1), 1000);
    const offset = (parsedPage - 1) * parsedLimit;
    const userId = req.query.userId;

    if (!panNumber) {
      return res.status(400).json({ message: "PAN number is required" });
    }

    const user = await User.findByPk(userId, {
      attributes: ['id', 'panNumber', 'isAdmin'],
      raw: true
    });

    if (!user) {
      return res.status(400).json({ message: "User doesn't exist" });
    }

    if (type !== "data" && type !== "user") {
      return res.status(400).json({ message: "Invalid type parameter" });
    }

    if (!user.isAdmin && type === "user") {
      return res.status(403).json({ message: "Access denied for user type" });
    }

    if (type === "data") {
      let emails = [];
      let totalEmails = 0;
      let source = 'data';

      // For non-admin, only allow access to their own PAN
      if (!user.isAdmin && panNumber !== user.panNumber) {
        return res.status(403).json({ message: "Access denied to other PANs" });
      }

      // First try to get from User -> Data
      const targetUser = await User.findOne({ 
        where: { panNumber },
        attributes: ['id'],
        raw: true
      });

      if (targetUser) {
        const dataEntries = await Data.findAll({
          where: { userId: targetUser.id },
          attributes: ['email'],
          raw: true,
        });

        if (dataEntries?.length > 0) {
          emails = dataEntries
            .map((entry) => {
              try {
                return entry?.email ? JSON.parse(entry.email) : [];
              } catch (e) {
                console.error("Email parsing error:", e);
                return [];
              }
            })
            .flat()
            .filter(email => typeof email === "string" && email.includes("@"));
          totalEmails = emails.length;
        }
      }

      // If no emails found and user is admin, try PanEmailData
      if (user.isAdmin && totalEmails === 0) {
        const panEmailEntry = await PanEmailData.findOne({
          where: { panNumber },
          attributes: ['Emails'],
          raw: true,
        });

        if (panEmailEntry?.Emails) {
          try {
            emails = typeof panEmailEntry.Emails === 'string' 
              ? JSON.parse(panEmailEntry.Emails) 
              : panEmailEntry.Emails;
            
            emails = emails.filter(email => typeof email === "string" && email.includes("@"));
            totalEmails = emails.length;
            source = 'panemail';
          } catch (e) {
            console.error("Error parsing PanEmail emails:", e);
          }
        }
      }

      if (totalEmails === 0) {
        return res.status(404).json({ 
          message: "No email data found for this PAN number",
          source
        });
      }

      return res.status(200).json({
        panNumber,
        emails: emails.slice(offset, offset + parsedLimit),
        totalEmails,
        currentPage: parsedPage,
        totalPages: Math.ceil(totalEmails / parsedLimit),
        source
      });
    }

    if (type === "user") {
      const userEntry = await User.findOne({
        where: { panNumber },
        attributes: ['id', 'panNumber', 'email'],
      });

      if (!userEntry) {
        return res.status(404).json({ message: "User not found" });
      }

      const emails = userEntry.email ? [userEntry.email] : [];
      
      return res.status(200).json({
        panNumber: userEntry.panNumber,
        emails: emails.slice(offset, offset + parsedLimit),
        totalEmails: emails.length,
        currentPage: parsedPage,
        totalPages: Math.ceil(emails.length / parsedLimit),
        source: 'user'
      });
    }

  } catch (error) {
    console.error("Error fetching data:", error);
    res.status(500).json({
      message: "Error fetching data",
      error: error.message,
    });
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

    if (type === "user") {
      if (!user.isAdmin) {
        return res.status(403).json({ message: "Access denied" });
      }
      
      const whereCondition = {};
      const attributes = ["id", "username", "panNumber", "email"];

      if (searchText) {
        whereCondition[Op.or] = [
          { panNumber: { [Op.like]: `%${searchText.toLowerCase()}%` } },
          { username: { [Op.like]: `%${searchText.toLowerCase()}%` } },
          { email: { [Op.like]: `%${searchText.toLowerCase()}%` } },
        ];
      }

      const totalCount = await User.count({ where: whereCondition });

      const users = await User.findAll({
        where: whereCondition,
        attributes: attributes,
        order: [["panNumber", "ASC"]],
        limit: parsedLimit,
        offset: offset,
        raw: true,
      });

      const results = users.map(item => ({
        ...item,
        emailCount: item.email ? 1 : 0,
      }));

      return res.status(200).json({
        totalCount,
        currentPage: parsedPage,
        totalPages: Math.ceil(totalCount / parsedLimit),
        items: results,
        type: type,
      });
    }

    if (type === "data") {
      // 1. Get allowed user IDs (admin or self)
      const allowedUserIds = user.isAdmin 
        ? (await User.findAll({ attributes: ["id"], raw: true })).map(u => u.id)
        : [parseInt(userId)];

      // 2. Initialize variables for combined results
      let combinedResults = [];
      let dataCount = 0;
      let panEmailCount = 0;
      const searchTerm = searchText ? searchText.toLowerCase() : null;

      // 3. First try to get from Data model
      if (searchTerm) {
        // Search for users with matching PAN numbers
        const userPans = await User.findAll({
          where: { 
            panNumber: { [Op.like]: `%${searchTerm}%` },
            id: { [Op.in]: allowedUserIds }
          },
          attributes: ["id", "panNumber"],
          raw: true,
        });

        if (userPans.length > 0) {
          // Get all data entries for these users
          const dataEntries = await Data.findAll({
            where: { userId: { [Op.in]: userPans.map(u => u.id) } },
            attributes: ["userId", "email"],
            raw: true,
          });

          // Calculate email counts per user
          const userEmailCounts = {};
          dataEntries.forEach(entry => {
            try {
              const emails = entry.email ? JSON.parse(entry.email) : [];
              const validEmails = emails.filter(e => typeof e === "string" && e.includes("@"));
              userEmailCounts[entry.userId] = (userEmailCounts[entry.userId] || 0) + validEmails.length;
            } catch (e) {
              console.error("Error parsing emails:", e);
            }
          });

          // Map to panNumbers with counts
          combinedResults = userPans.map(u => ({
            panNumber: u.panNumber,
            emailCount: userEmailCounts[u.id] || 0,
            source: 'data'
          }));

          dataCount = combinedResults.length;
        }
      } else {
        // No search - get all data entries for allowed users
        const dataEntries = await Data.findAll({
          where: { userId: { [Op.in]: allowedUserIds } },
          attributes: ["userId", "email"],
          raw: true,
        });

        // Calculate email counts per user
        const userEmailCounts = {};
        dataEntries.forEach(entry => {
          try {
            const emails = entry.email ? JSON.parse(entry.email) : [];
            const validEmails = emails.filter(e => typeof e === "string" && e.includes("@"));
            userEmailCounts[entry.userId] = (userEmailCounts[entry.userId] || 0) + validEmails.length;
          } catch (e) {
            console.error("Error parsing emails:", e);
          }
        });

        // Get panNumbers for users with data
        const usersWithData = await User.findAll({
          where: { 
            id: { [Op.in]: Object.keys(userEmailCounts).map(Number) },
            ...(user.isAdmin ? {} : { id: parseInt(userId) })
          },
          attributes: ["id", "panNumber"],
          raw: true,
        });

        combinedResults = usersWithData.map(u => ({
          panNumber: u.panNumber,
          emailCount: userEmailCounts[u.id] || 0,
          source: 'data'
        }));

        dataCount = combinedResults.length;
      }

      // 4. Check if we need more results from PanEmail (admin only)
      if (user.isAdmin) {
        const remainingNeeded = parsedLimit * parsedPage - combinedResults.length;
        
        if (remainingNeeded > 0 || (searchTerm && combinedResults.length === 0)) {
          const panEmailWhere = {};
          
          if (searchTerm) {
            panEmailWhere.panNumber = { [Op.like]: `%${searchTerm}%` };
          }

          // Get total count from PanEmail for pagination
          panEmailCount = await PanEmailData.count({ where: panEmailWhere });

          // Calculate how many we need from PanEmail
          const panEmailOffset = Math.max(0, offset - dataCount);
          const panEmailLimit = Math.max(0, parsedLimit - Math.max(0, dataCount - offset));

          if (panEmailLimit > 0) {
            const panEmailResults = await PanEmailData.findAll({
              where: panEmailWhere,
              attributes: ["id", "panNumber"],
              order: [["panNumber", "ASC"]],
              limit: panEmailLimit,
              offset: panEmailOffset,
              raw: true,
            });

            // Get email counts for these PANs
            const panEmailIds = panEmailResults.map(item => item.id);
            let emailCounts = [];

            if (panEmailIds.length > 0) {
              emailCounts = await sequelize.query(
                `SELECT id, JSON_LENGTH(Emails) AS emailCount FROM PanEmailData WHERE id IN (?)`,
                {
                  replacements: [panEmailIds],
                  type: sequelize.QueryTypes.SELECT,
                }
              );
            }

            const countMap = emailCounts.reduce((acc, item) => {
              acc[item.id] = item.emailCount;
              return acc;
            }, {});

            // Add to combined results
            const panEmailItems = panEmailResults.map(item => ({
              panNumber: item.panNumber,
              emailCount: countMap[item.id] || 0,
              source: 'panemail'
            }));

            combinedResults = combinedResults.concat(panEmailItems);
          }
        }
      }

      // 5. Apply pagination to the combined results
      const paginatedResults = combinedResults.slice(
        Math.max(0, offset),
        offset + parsedLimit
      );

      // 6. Prepare response
      return res.status(200).json({
        totalCount: dataCount + (user.isAdmin ? panEmailCount : 0),
        dataCount,
        panEmailCount: user.isAdmin ? panEmailCount : 0,
        currentPage: parsedPage,
        totalPages: Math.ceil((dataCount + (user.isAdmin ? panEmailCount : 0)) / parsedLimit),
        items: paginatedResults,
        type: type,
      });
    }

    return res.status(400).json({ message: "Invalid type parameter" });
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
    const { userId, type = "data" } = req.query;

    // Validate required parameters
    if (!panNumber || !userId) {
      return res.status(400).json({ message: "PAN number and user ID are required" });
    }

    // Get requesting user and validate
    const requestingUser = await User.findByPk(userId, {
      attributes: ['id', 'panNumber', 'isAdmin'],
      raw: true
    });

    if (!requestingUser) {
      return res.status(404).json({ message: "Requesting user not found" });
    }

    // Non-admin users can only access their own PAN data
    if (!requestingUser.isAdmin && panNumber !== requestingUser.panNumber) {
      return res.status(403).json({ message: "Access denied to other PANs" });
    }

    if (type === "data") {
      let emails = [];
      let source = 'data';

      // First try to find user with this PAN
      const targetUser = await User.findOne({ 
        where: { panNumber },
        attributes: ['id'],
        raw: true
      });

      if (targetUser) {
        // Get emails from Data model for this user
        const dataEntries = await Data.findAll({
          where: { userId: targetUser.id },
          attributes: ['email'],
          raw: true,
        });

        if (dataEntries?.length > 0) {
          emails = dataEntries
            .map((entry) => {
              try {
                return entry?.email ? JSON.parse(entry.email) : [];
              } catch (e) {
                console.error("Email parsing error:", e);
                return [];
              }
            })
            .flat()
            .filter(email => typeof email === "string" && email.includes("@"));
          source = 'data';
        }
      }

      // If no user found or no emails in Data model, try PanEmail (for admins only)
      if (requestingUser.isAdmin && emails.length === 0) {
        const panEmailEntry = await PanEmailData.findOne({
          where: { panNumber },
          attributes: ['Emails'],
          raw: true,
        });

        if (panEmailEntry?.Emails) {
          try {
            emails = typeof panEmailEntry.Emails === 'string' 
              ? JSON.parse(panEmailEntry.Emails) 
              : panEmailEntry.Emails;
            
            emails = emails
              .filter(email => typeof email === "string" && email.includes("@"));
            source = 'panemail';
          } catch (e) {
            console.error("Error parsing PanEmail emails:", e);
          }
        }
      }

      if (emails.length === 0) {
        return res.status(404).json({ 
          message: "No email data found for this PAN number",
          source
        });
      }

      return res.status(200).json({
        panNumber,
        emails,
        totalCount: emails.length,
        source
      });
    }

    return res.status(400).json({ message: "Invalid type parameter" });
  } catch (error) {
    console.error("Error fetching emails for download:", error);
    res.status(500).json({
      message: "Error fetching emails",
      error: error.message,
    });
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
          attributes: ["email","panNumber"],
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
          attributes: ["email","panNumber"],
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

    // Fetch all data entries associated with the requestId, including user information
    const dataEntries = await Data.findAll({
      where: { fileRequestId: requestId },
      include: [{
        model: User,
        attributes: ['panNumber'],
        required: true
      }],
      raw: true,
    });

    if (!dataEntries || dataEntries.length === 0) {
      return res
        .status(404)
        .json({ message: "No data found for this request." });
    }

    // Transform data into CSV format
    const csvData = [];
    for (const entry of dataEntries) {
      // Parse the JSON email array
      const emails = JSON.parse(entry.email);

      // Create a row for each email associated with the PAN
      emails.forEach((email) => {
        csvData.push({
          email: email,
          panNumber: entry['User.panNumber'] // Access the PAN number from the included User model
        });
      });
    }

    // Configure CSV parser
    const fields = ["email", "panNumber"]; // Include panNumber in fields
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
