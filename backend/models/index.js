// models/index.js
const User = require("./userSchema");
const FileRequest = require("./fileRequests");
const sequelize = require("../config/database");

// Associations (defined only here)
User.hasMany(FileRequest, {
  foreignKey: "userId",
  as: "fileRequests",
});

FileRequest.belongsTo(User, {
  foreignKey: "userId",
  as: "user",
});

module.exports = { User, FileRequest, sequelize };
