const { Sequelize } = require("sequelize");

const sequelize = new Sequelize("PanEmailDB", "root", "India_123", {
  host: "66.94.120.78", // IP address of your Ubuntu server
  dialect: "mysql",
  port: 3306, // Default MySQL port
  logging: false, // Disable logging for cleaner output
});

module.exports = sequelize;
