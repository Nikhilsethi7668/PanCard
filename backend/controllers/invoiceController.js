// controllers/invoiceController.js
const csv = require("csv-parser");
const stream = require("stream");
const { Invoice, User } = require("../models");
const { sendInvoiceEmail } = require("../services/emailService");
const { Op } = require("sequelize");

exports.sendInvoice = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No CSV file uploaded" });
    }

    const results = [];
    const bufferStream = new stream.PassThrough();
    bufferStream.end(req.file.buffer);

    // Parse CSV
    await new Promise((resolve, reject) => {
      bufferStream
        .pipe(csv())
        .on("data", (data) => results.push(data))
        .on("end", resolve)
        .on("error", reject);
    });

    // Process each invoice
    const processedInvoices = [];
    const errors = [];

    for (const row of results) {
      try {
        // Validate required fields
        if (
          !row["pan number"] ||
          !row["bill amount"] ||
          !row["taxes"] ||
          !row["total bill amount"]
        ) {
          errors.push(
            `Missing required fields for row: ${JSON.stringify(row)}`
          );
          continue;
        }

        // Find user by PAN number
        const user = await User.findOne({
          where: { panNumber: row["pan number"] },
        });

        if (!user) {
          errors.push(`User with PAN ${row["pan number"]} not found`);
          continue;
        }

        // Calculate due date (15 days from now)
        const dueDate = new Date();
        dueDate.setDate(dueDate.getDate() + 15);

        // Create invoice
        const invoice = await Invoice.create({
          panNumber: row["pan number"],
          billAmount: parseFloat(row["bill amount"]),
          taxes: parseFloat(row["taxes"]),
          totalBillAmount: parseFloat(row["total bill amount"]),
          invoiceDate: new Date(),
          dueDate: dueDate,
          userId: user.id,
          invoiceNumber: `INV-${Date.now()}-${Math.floor(
            Math.random() * 1000
          )}`,
          notes: row["notes"] || "",
        });

        // Prepare data for email
        const invoiceData = {
          invoiceNumber: invoice.invoiceNumber,
          customerName: user.username,
          billAmount: invoice.billAmount,
          taxes: invoice.taxes,
          totalBillAmount: invoice.totalBillAmount,
          dueDate: invoice.dueDate.toISOString().split("T")[0],
          notes: invoice.notes,
        };

        // Send email with invoice data
        await sendInvoiceEmail(user.email, invoiceData);

        processedInvoices.push(invoice);
      } catch (error) {
        errors.push(
          `Error processing PAN ${row["pan number"]}: ${error.message}`
        );
      }
    }

    if (processedInvoices.length === 0 && errors.length > 0) {
      return res.status(400).json({
        success: false,
        message: "All invoices failed to process",
        errors,
      });
    }

    res.json({
      success: true,
      message: `Processed ${processedInvoices.length} invoices successfully`,
      failed: errors.length,
      invoices: processedInvoices,
      errors: errors.length > 0 ? errors : undefined,
    });
  } catch (error) {
    console.error("Error processing invoices:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

exports.getUserInvoices = async (req, res) => {
  try {
    const { userId } = req.params;
    const { month, year } = req.query;

    // Validate user exists
    const user = await User.findByPk(userId);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    let where = { userId };

    if (month && year) {
      where.invoiceDate = {
        [Op.and]: [
          sequelize.where(
            sequelize.fn("MONTH", sequelize.col("invoiceDate")),
            month
          ),
          sequelize.where(
            sequelize.fn("YEAR", sequelize.col("invoiceDate")),
            year
          ),
        ],
      };
    }

    const invoices = await Invoice.findAll({
      where,
      order: [["invoiceDate", "DESC"]],
      include: [
        {
          model: User,
          as: "user",
          attributes: ["id", "username", "email"],
        },
      ],
    });

    res.json(invoices);
  } catch (error) {
    console.error("Error fetching invoices:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

exports.getAllInvoices = async (req, res) => {
  try {
    const { month, year } = req.query;

    let where = {};

    if (month && year) {
      where.invoiceDate = {
        [Op.and]: [
          sequelize.where(
            sequelize.fn("MONTH", sequelize.col("invoiceDate")),
            month
          ),
          sequelize.where(
            sequelize.fn("YEAR", sequelize.col("invoiceDate")),
            year
          ),
        ],
      };
    }

    const invoices = await Invoice.findAll({
      where,
      order: [["invoiceDate", "DESC"]],
      include: [
        {
          model: User,
          as: "user",
          attributes: ["id", "username", "email", "panNumber"],
        },
      ],
    });

    res.json(invoices);
  } catch (error) {
    console.error("Error fetching all invoices:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};
