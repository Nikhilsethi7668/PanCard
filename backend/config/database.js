const { Sequelize } = require("sequelize");

const sequelize = new Sequelize("PanEmailDb", "root", "India_123", {
  host: "localhost", // IP address of your Ubuntu server
  dialect: "mysql",
  port: 3306, // Default MySQL port
  logging: false, // Disable logging for cleaner output
});

module.exports = sequelize;
