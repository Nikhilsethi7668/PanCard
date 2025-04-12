// fileRequests.js (updated)
const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");
const User = require("./userSchema");

const FileRequest = sequelize.define("FileRequest", {
  // ... (keep all your field definitions)
  userId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: User, // This is okay to keep
      key: "id",
    },
  },
});

// Remove these lines:
// User.hasMany(FileRequest, { foreignKey: "userId", as: "fileRequests" });
// FileRequest.belongsTo(User, { foreignKey: "userId", as: "user" });

module.exports = FileRequest;
