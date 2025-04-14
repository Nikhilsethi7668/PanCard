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
    },
    totalWithoutTax: {
      type: DataTypes.FLOAT,
      allowNull: false,
    },
    total: {
      type: DataTypes.FLOAT,
      allowNull: false,
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



module.exports = Invoice;
