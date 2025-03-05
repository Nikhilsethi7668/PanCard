const { Sequelize } = require("sequelize");

const sequelize = new Sequelize("myapp_db", "myapp_user", "Nikhil1234", {
  host: "localhost",
  dialect: "mysql",
  port: 3306, // Default MySQL port
  logging: false, // Disable logging for cleaner output
});

module.exports = sequelize;
