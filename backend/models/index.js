const User = require("./userSchema");
const FileRequest = require("./fileRequests");
const sequelize = require("../config/database");
const Invoice = require("./Invoice")
User.hasMany(FileRequest, {
  foreignKey: "userId",
  as: "fileRequests",
});

FileRequest.belongsTo(User, {
  foreignKey: "userId",
  as: "user",
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
