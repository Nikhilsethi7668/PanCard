const User = require("./userSchema");
const FileRequest = require("./fileRequestSchema");
const sequelize = require("../config/database");

// Ensure associations are established
User.hasMany(FileRequest, { foreignKey: "userId", as: "fileRequests" });
FileRequest.belongsTo(User, { foreignKey: "userId", as: "user" });

module.exports = { User, FileRequest, sequelize };
