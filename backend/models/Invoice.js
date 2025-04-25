const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");
const User = require("./userSchema");

const Invoice = sequelize.define(
  "Invoice",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    invoiceNumber: {
      type: DataTypes.STRING,
      unique: true,
      allowNull: false,
    },
    invoiceDate: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
    dueDate: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    billToName: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    panNumber: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    billToCompany: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    billToAddress: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    billToEmail: {
      type: DataTypes.STRING,
      allowNull: true,
      validate: {
        isEmail: true,
      },
    },
    // New email-related fields
    totalEmails: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
      comment: "Total number of emails processed"
    },
    perEmailPrice: {
      type: DataTypes.FLOAT,
      allowNull: false,
      defaultValue: 0,
      comment: "Price per individual email"
    },
    subtotal: {
      type: DataTypes.FLOAT,
      allowNull: false,
      defaultValue: 0,
      comment: "Total before tax (totalEmails * perEmailPrice)"
    },
    taxType: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    taxPercentage: {
      type: DataTypes.FLOAT,
      allowNull: false,
    },
    taxAmount: {
      type: DataTypes.FLOAT,
      allowNull: false,
      comment: "Calculated tax amount (subtotal * taxPercentage/100)"
    },
    total: {
      type: DataTypes.FLOAT,
      allowNull: false,
      comment: "Final total including tax (subtotal + taxAmount)"
    },
    notes: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    paymentStatus: {
      type: DataTypes.ENUM("pending", "paid", "overdue"),
      defaultValue: "pending",
    },
    isRead: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: User, 
        key: "id",
      },
    },
  },
  {
    timestamps: true,
  }
);

Invoice.beforeValidate((invoice, options) => {

  invoice.subtotal = invoice.totalEmails * invoice.perEmailPrice;
  
  if (!invoice.taxAmount && invoice.taxPercentage) {
    invoice.taxAmount = invoice.subtotal * (invoice.taxPercentage / 100);
  }
  
  if (!invoice.total) {
    invoice.total = invoice.subtotal + (invoice.taxAmount || 0);
  }
  
  ['perEmailPrice', 'subtotal', 'taxAmount', 'total'].forEach(field => {
    if (invoice[field] !== undefined) {
      invoice[field] = parseFloat(invoice[field].toFixed(2));
    }
  });
});
module.exports = Invoice;