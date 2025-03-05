const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");
const User = require("./userSchema"); // Ensure User is imported

const FileRequest = sequelize.define("FileRequest", {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  fileName: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  filePath: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  status: {
    type: DataTypes.ENUM("pending", "approved", "rejected"),
    defaultValue: "pending",
  },
  userId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: User,
      key: "id",
    },
  },
});

// Define associations here
User.hasMany(FileRequest, { foreignKey: "userId", as: "fileRequests" });
FileRequest.belongsTo(User, { foreignKey: "userId", as: "user" });

module.exports = FileRequest;
