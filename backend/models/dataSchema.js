const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const Data = sequelize.define("Data", {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  panNumber: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  email: {
    type: DataTypes.TEXT, // Store emails as a JSON string
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
});

module.exports = Data;
