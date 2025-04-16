// fileRequests.js (updated)
const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");
const User = require("./userSchema");

const FileRequest = sequelize.define("FileRequest", {
  userId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: User, 
      key: "id",
    },
  },
  approvalStage: {
    type: DataTypes.STRING,
    allowNull: false,
    defaultValue: "pending",
  },
  fileName: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  filePath: {
    type: DataTypes.STRING,
    allowNull: false,
  },

  approvedBy: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: User,
      key: "id",
    },
  },

  approvedAt: {
    type: DataTypes.DATE,
    allowNull: true,
  },

  numberOfPans: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    allowNull: false,
  },
});

module.exports = FileRequest;
