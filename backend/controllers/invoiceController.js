const db = require("../models");
const csv = require("csv-parser");
const stream = require("stream");
const Sequelize = require("sequelize");
const { Op } = Sequelize;
const Invoice = require("../models/Invoice");
const { Where } = require("sequelize/lib/utils");

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
        const requiredFields = [
          "panNumber",
          "billToName",
          "taxType",
          "taxPercentage",
          "taxAmount",
          "totalWithoutTax",
          "total",
          "dueDate",
        ];

        const missingFields = requiredFields.filter(
          (field) => !row[field] || row[field].trim() === ""
        );

        if (missingFields.length) {
          errors.push(
            `Missing required fields [${missingFields.join(", ")}] in row: ${JSON.stringify(row)}`
          );
          continue;
        }

        
        // Find user by PAN
        const user = await db.User.findOne({
          where: { panNumber:row["panNumber"].trim() },
        });

        if (!user) {
          errors.push(`User not found for PAN: ${row["panNumber"]}`);
          continue;
        }
        console.log("user pan:", user.panNumber ,"id", user.id);
        // Create invoice
        const invoice = await Invoice.create({
          invoiceNumber: row["invoiceNumber"] || `INV-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
          invoiceDate: row["invoiceDate"] ? new Date(row["invoiceDate"]) : new Date(),
          dueDate: new Date(row["dueDate"]),
          billToName: row["billToName"],
          billToCompany: row["billToCompany"] || null,
          billToAddress: row["billToAddress"] || null,
          billToEmail: row["billToEmail"] || null,
          panNumber: row["panNumber"].trim(),
          taxType: row["taxType"],
          taxPercentage: parseFloat(row["taxPercentage"]),
          taxAmount: parseFloat(row["taxAmount"]),
          totalWithoutTax: parseFloat(row["totalWithoutTax"]),
          total: parseFloat(row["total"]),
          notes: row["notes"] || null,
          paymentStatus: row["paymentStatus"]?.toLowerCase() || "pending",
          isRead: false,
          userId: user.id,
        });

        processedInvoices.push(invoice);
      } catch (error) {
        errors.push(
          `Error processing PAN ${row["panNumber"]}: ${error.message}`
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
    const { isAdmin, userId } = req.user;
    const { month, year, userid, searchText } = req.query;

    let where = {};

    if (isAdmin && userid) {
      where.userId = userid;
    } else if (!isAdmin) {
      where.userId = userId;
    }

    // Add date filtering
    if (month && year) {
      where[Op.and] = [
        ...(where[Op.and] || []),
        where(
          Sequelize.fn("MONTH", Sequelize.col("invoiceDate")),
          month
        ),
        where(
          Sequelize.fn("YEAR", Sequelize.col("invoiceDate")),
          year
        )
      ];
    }

    // Add panNumber search
    if (searchText) {
      where[Op.and] = [
        ...(where[Op.and] || []),
       new Where(
          Sequelize.fn("UPPER", Sequelize.col("user.panNumber")),
          {
            [Op.like]: `%${searchText.toUpperCase()}%`
          }
        )
      ];
    }

    const invoices = await Invoice.findAll({
      where,
      include: [
        {
          model: db.User,
          as: "user",
          attributes: ["id", "username", "email", "panNumber"],
          required: true, // ensures INNER JOIN
        },
      ],
      order: [["invoiceDate", "DESC"]],
    });

    res.json(invoices);
  } catch (error) {
    console.error(error);
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
          db.sequelize.where(
            db.sequelize.fn("MONTH", sequelize.col("invoiceDate")),
            month
          ),
          db.sequelize.where(
            db.sequelize.fn("YEAR", sequelize.col("invoiceDate")),
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
