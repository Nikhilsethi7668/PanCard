const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

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
    panNumber: {
      type: DataTypes.STRING(10),
      allowNull: false,
    },
    billAmount: {
      type: DataTypes.FLOAT,
      allowNull: false,
    },
    taxes: {
      type: DataTypes.FLOAT,
      allowNull: false,
    },
    totalBillAmount: {
      type: DataTypes.FLOAT,
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
    status: {
      type: DataTypes.ENUM("pending", "paid", "overdue"),
      defaultValue: "pending",
    },
    isRead: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = Invoice;
