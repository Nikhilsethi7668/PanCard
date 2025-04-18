const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");
const FileRequest = require("./fileRequests");

const Data = sequelize.define("Data", {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  email: {
    type: DataTypes.TEXT,
    allowNull: false,
    get() {
      const rawValue = this.getDataValue("email");
      return rawValue ? JSON.parse(rawValue) : [];
    },
    set(value) {
      this.setDataValue("email", JSON.stringify(value));
    },
  },
  userId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: "Users", // Reference the User table
      key: "id",
    },
  },
  fileRequestId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: FileRequest,
      key: "id",
    },
  },
});

module.exports = Data;
