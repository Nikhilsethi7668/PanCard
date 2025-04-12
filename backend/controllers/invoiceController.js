const csv = require("csv-parser");
const stream = require("stream");
const { Invoice, User } = require("../models");
const { Op, fn, col } = require("sequelize");
const sequelize = require("../config/database");

const generateInvoiceNumber = () =>
  `INV-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

exports.sendInvoice = async (req, res) => {
  try {
    if (!req.file)
      return res.status(400).json({ error: "No CSV file uploaded" });

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
        const pan = row["pan number"]?.trim();
        const bill = parseFloat(row["bill amount"]);
        const taxes = parseFloat(row["taxes"]);
        const total = parseFloat(row["total bill amount"]);

        if (!pan || isNaN(bill) || isNaN(taxes) || isNaN(total)) {
          errors.push(
            `Invalid or missing fields in row: ${JSON.stringify(row)}`
          );
          continue;
        }

        const user = await User.findOne({ where: { panNumber: pan } });
        if (!user) {
          errors.push(`User with PAN ${pan} not found`);
          continue;
        }

        const dueDate = new Date();
        dueDate.setDate(dueDate.getDate() + 15);

        const invoice = await Invoice.create({
          panNumber: pan,
          billAmount: bill,
          taxes,
          totalBillAmount: total,
          invoiceDate: new Date(),
          dueDate,
          userId: user.id,
          invoiceNumber: generateInvoiceNumber(),
          notes: row["notes"] || "",
        });

        processedInvoices.push(invoice);
      } catch (err) {
        errors.push(
          `Failed to process row with PAN ${row["pan number"]}: ${err.message}`
        );
      }
    }

    const statusCode = processedInvoices.length ? 200 : 400;
    res.status(statusCode).json({
      success: !!processedInvoices.length,
      message: `${processedInvoices.length} invoices processed`,
      failed: errors.length,
      invoices: processedInvoices,
      errors: errors.length ? errors : undefined,
    });
  } catch (err) {
    console.error("Send invoice error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
};

exports.getUserInvoices = async (req, res) => {
  try {
    const { userId } = req.params;
    const { month, year, unread } = req.query;

    const user = await User.findByPk(userId);
    if (!user) return res.status(404).json({ error: "User not found" });

    const where = { userId };

    if (month && year) {
      where.invoiceDate = {
        [Op.and]: [
          sequelize.where(fn("MONTH", col("invoiceDate")), month),
          sequelize.where(fn("YEAR", col("invoiceDate")), year),
        ],
      };
    }

    if (unread === "true") where.isRead = false;

    const invoices = await Invoice.findAll({
      where,
      order: [["invoiceDate", "DESC"]],
      include: [
        { model: User, as: "user", attributes: ["id", "username", "email"] },
      ],
    });

    res.json(invoices);
  } catch (err) {
    console.error("Get user invoices error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
};

exports.markAsRead = async (req, res) => {
  try {
    const { invoiceId } = req.params;
    const { userId } = req.body;

    const invoice = await Invoice.findOne({ where: { id: invoiceId, userId } });
    if (!invoice) return res.status(404).json({ error: "Invoice not found" });

    invoice.isRead = true;
    await invoice.save();

    res.json({ success: true, message: "Invoice marked as read" });
  } catch (err) {
    console.error("Mark as read error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
};

exports.getAllInvoices = async (req, res) => {
  try {
    const { month, year } = req.query;
    const where = {};

    if (month && year) {
      where.invoiceDate = {
        [Op.and]: [
          sequelize.where(fn("MONTH", col("invoiceDate")), month),
          sequelize.where(fn("YEAR", col("invoiceDate")), year),
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
  } catch (err) {
    console.error("Get all invoices error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
};
