const { Sequelize } = require("sequelize");

const sequelize = new Sequelize("EmailAppDb", "root", "India_123", {
  host: "94.250.203.249", // IP address of your Ubuntu server
  dialect: "mysql",
  port: 3306, // Default MySQL port
  logging: false, // Disable logging for cleaner output
});

module.exports = sequelize;
