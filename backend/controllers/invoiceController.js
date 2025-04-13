const { Invoice, User } = require("../models");
const csv = require("csv-parser");
const stream = require("stream");
const { Op } = require("sequelize");

exports.sendInvoice = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No CSV file uploaded" });
    }

    const results = [];
    const bufferStream = new stream.PassThrough();
    bufferStream.end(req.file.buffer);

    await new Promise((resolve, reject) => {
      bufferStream
        .pipe(csv())
        .on("data", (data) => results.push(data))
        .on("end", resolve)
        .on("error", reject);
    });

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
          errors.push(`Missing fields in row: ${JSON.stringify(row)}`);
          continue;
        }

        // Find user by PAN
        const user = await User.findOne({
          where: { panNumber: row["pan number"].trim() },
        });

        if (!user) {
          errors.push(`User not found for PAN: ${row["pan number"]}`);
          continue;
        }

        // Calculate due date (15 days from now)
        const dueDate = new Date();
        dueDate.setDate(dueDate.getDate() + 15);

        // Create invoice
        const invoice = await Invoice.create({
          panNumber: row["pan number"].trim(),
          billAmount: parseFloat(row["bill amount"]),
          taxes: parseFloat(row["taxes"]),
          totalBillAmount: parseFloat(row["total bill amount"]),
          invoiceNumber: `INV-${Date.now()}-${Math.floor(
            Math.random() * 1000
          )}`,
          dueDate,
          userId: user.id,
        });

        processedInvoices.push(invoice);
      } catch (error) {
        errors.push(
          `Error processing PAN ${row["pan number"]}: ${error.message}`
        );
      }
    }

    res.json({
      success: true,
      message: `Processed ${processedInvoices.length} invoices`,
      errors: errors.length ? errors : undefined,
    });
  } catch (error) {
    console.error("Error processing invoices:", error);
    res.status(500).json({ error: error.message });
  }
};

exports.getAllInvoices = async (req, res) => {
  try {
    const { month, year } = req.query;
    const where = {};

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
      include: [
        {
          model: User,
          attributes: ["id", "username", "email", "panNumber"],
        },
      ],
      order: [["invoiceDate", "DESC"]],
    });

    res.json(invoices);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getUserInvoices = async (req, res) => {
  try {
    const { userId } = req.params;
    const { month, year, unread } = req.query;

    const where = { userId };

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

    if (unread === "true") {
      where.isRead = false;
    }

    const invoices = await Invoice.findAll({
      where,
      order: [["invoiceDate", "DESC"]],
    });

    res.json(invoices);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.markAsRead = async (req, res) => {
  try {
    const { invoiceId } = req.params;
    const { userId } = req.user;

    const invoice = await Invoice.findOne({
      where: {
        id: invoiceId,
        userId,
      },
    });

    if (!invoice) {
      return res.status(404).json({ error: "Invoice not found" });
    }

    invoice.isRead = true;
    await invoice.save();

    res.json({ success: true, message: "Invoice marked as read" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
