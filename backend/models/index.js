const User = require("./userSchema");
const FileRequest = require("./fileRequests");
const sequelize = require("../config/database");
const Invoice = require("./Invoice");
const Data = require("./dataSchema");
User.hasMany(FileRequest, {
  foreignKey: "userId",
  as: "fileRequests",
});

FileRequest.belongsTo(User, {
  foreignKey: "userId",
  as: "user",
});

FileRequest.belongsTo(User, {
  foreignKey: "approvedBy",
  as: "approver",
});

User.hasMany(Invoice, {
  foreignKey: "userId",
  as: "invoices",
});

Invoice.belongsTo(User, {
  foreignKey: "userId",
  as: "user",
});

User.associate = (models) => {
};

Invoice.associate = (models) => {
};

module.exports = { User, FileRequest, Invoice, sequelize };
