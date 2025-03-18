const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const PanEmailData = sequelize.define(
  "PanEmailData",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    panNumber: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
      field: "PanNumber",
    },
    email: {
      type: DataTypes.JSON,
      allowNull: false,
      field: "Emails",
    },
  },
  {
    timestamps: false,
  }
);

module.exports = PanEmailData;
