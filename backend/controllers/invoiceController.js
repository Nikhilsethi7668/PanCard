const db = require("../models");
const csv = require("csv-parser");
const stream = require("stream");
const Sequelize = require("sequelize");
const { Op } = Sequelize;
const Invoice = require("../models/Invoice");
const { Where } = require("sequelize/lib/utils");
const sequelize = require("sequelize");

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
        const requiredFields = [
          "panNumber",
          "billToName",
          "totalEmails",
          "perEmailPrice",
          "taxType",
          "taxPercentage",
          "dueDate"
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
          where: { panNumber: row["panNumber"].trim() },
        });

        if (!user) {
          errors.push(`User not found for PAN: ${row["panNumber"]}`);
          continue;
        }

        // Calculate values based on email fields
        const totalEmails = parseInt(row["totalEmails"]);
        const perEmailPrice = parseFloat(row["perEmailPrice"]);
        const subtotal = totalEmails * perEmailPrice;
        const taxPercentage = parseFloat(row["taxPercentage"]);
        const taxAmount = subtotal * (taxPercentage / 100);
        const total = subtotal + taxAmount;
        console.log(Invoice.rawAttributes);
        console.log("Creating invoice with:", {
          invoiceNumber: row["invoiceNumber"] || `INV-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
          invoiceDate: row["invoiceDate"] ? new Date(row["invoiceDate"]) : new Date(),
          dueDate: new Date(row["dueDate"]),
          billToName: row["billToName"],
          billToCompany: row["billToCompany"] || null,
          billToAddress: row["billToAddress"] || null,
          billToEmail: row["billToEmail"] || null,
          panNumber: row["panNumber"].trim(),
          totalEmails: totalEmails,
          perEmailPrice: perEmailPrice,
          subtotal: subtotal,
          taxType: row["taxType"],
          taxPercentage: taxPercentage,
          taxAmount: taxAmount,
          total: total,
          notes: row["notes"] || null,
          paymentStatus: row["paymentStatus"]?.toLowerCase() || "pending",
          isRead: false,
          userId: user.id,
        });
        
        // Create invoice with new fields
        const invoice = await Invoice.create({
          invoiceNumber: row["invoiceNumber"] || `INV-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
          invoiceDate: row["invoiceDate"] ? new Date(row["invoiceDate"]) : new Date(),
          dueDate: new Date(row["dueDate"]),
          billToName: row["billToName"],
          billToCompany: row["billToCompany"] || null,
          billToAddress: row["billToAddress"] || null,
          billToEmail: row["billToEmail"] || null,
          panNumber: row["panNumber"].trim(),
          // Email-related fields
          totalEmails: totalEmails,
          perEmailPrice: perEmailPrice,
          subtotal: subtotal,
          // Tax fields
          taxType: row["taxType"],
          taxPercentage: taxPercentage,
          taxAmount: taxAmount,
          total: total,
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
      processedCount: processedInvoices.length,
      errorCount: errors.length,
      errors: errors.length ? errors : undefined,
    });
  } catch (error) {
    console.error("Error processing invoices:", error);
    res.status(500).json({ 
      success: false,
      error: error.message 
    });
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
    if (year) {
      if (month) {
        // Both month and year are provided
        where[Op.and] = [
          ...(where[Op.and] || []),
          Sequelize.where(
            Sequelize.fn('MONTH', Sequelize.col('invoiceDate')),
            month
          ),
          Sequelize.where(
            Sequelize.fn('YEAR', Sequelize.col('invoiceDate')),
            year
          )
        ];
      } else {
        // Only year is provided
        where[Op.and] = [
          ...(where[Op.and] || []),
          Sequelize.where(
            Sequelize.fn('YEAR', Sequelize.col('invoiceDate')),
            year
          )
        ];
      }
    } else if (month) {
      // Only month is provided (current year assumed)
      const currentYear = new Date().getFullYear();
      where[Op.and] = [
        ...(where[Op.and] || []),
        Sequelize.where(
          Sequelize.fn('MONTH', Sequelize.col('invoiceDate')),
          month
        ),
        Sequelize.where(
          Sequelize.fn('YEAR', Sequelize.col('invoiceDate')),
          currentYear
        )
      ];
    }

    // Add search functionality
    if (searchText) {
      where[Op.or] = [
        {
          invoiceNumber: {
            [Op.like]: `%${searchText}%`
          }
        },
        {
          panNumber: {
            [Op.like]: `%${searchText.toUpperCase()}%`
          }
        },
        {
          billToName: {
            [Op.like]: `%${searchText}%`
          }
        }
      ];
    }

    const invoices = await Invoice.findAll({
      where,
      attributes: [
        'id',
        'invoiceNumber',
        'invoiceDate',
        'dueDate',
        'billToName',
        'billToCompany',
        'billToAddress',
        'billToEmail',
        'panNumber',
        'totalEmails',
        'perEmailPrice',
        'subtotal',
        'taxType',
        'taxPercentage',
        'taxAmount',
        'total',
        'notes',
        'paymentStatus',
        'isRead',
        'createdAt',
        'updatedAt'
      ],
      include: [
        {
          model: db.User,
          as: "user",
          attributes: ["id", "username", "email", "panNumber"],
          required: true,
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

exports.updateInvoiceStatus = async (req, res) => {
  try {
    const { isAdmin } = req.user; 
    const { invoiceId } = req.params;
    const { status } = req.body;

    // Validate required fields
    if (!invoiceId || !status) {
      return res.status(400).json({ 
        error: "Invoice ID and status are required" 
      });
    }

    // Check if user is admin
    if (!isAdmin) {
      return res.status(403).json({ 
        error: "Only admin users can update invoice status" 
      });
    }

    // Validate status value
    const validStatuses = ['pending', 'paid', 'overdue', 'cancelled'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ 
        error: `Invalid status. Must be one of: ${validStatuses.join(', ')}` 
      });
    }

    // Find the invoice
    const invoice = await Invoice.findByPk(invoiceId);
    if (!invoice) {
      return res.status(404).json({ 
        error: "Invoice not found" 
      });
    }

    // Additional business logic checks
    if (status === 'paid' && invoice.paymentStatus === 'paid') {
      return res.status(400).json({ 
        error: "Invoice is already marked as paid" 
      });
    }

    // Update the invoice
    const updatedInvoice = await invoice.update({ 
      paymentStatus: status,
      ...(status === 'paid' && { paymentDate: new Date() })
    });

    return res.json({ 
      success: true,
      message: "Invoice status updated successfully",
      invoice: updatedInvoice 
    });

  } catch (error) {
    console.error("Error updating invoice status:", error);
    return res.status(500).json({ 
      error: "Internal server error",
      details: error.message 
    });
  }
};