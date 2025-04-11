// models/Invoice.js
const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const Invoice = sequelize.define("Invoice", {
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
    type: DataTypes.STRING,
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
  notes: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
});

// Define associations
Invoice.associate = (models) => {
  Invoice.belongsTo(models.User, {
    foreignKey: "userId",
    as: "user",
  });
};

module.exports = Invoice;
