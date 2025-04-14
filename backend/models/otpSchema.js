const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const Otp = sequelize.define(
  "Otp",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    email: {
      type: DataTypes.STRING(255),
      allowNull: false,
      validate: {
        isEmail: true,
      },
    },
    otp: {
      type: DataTypes.STRING(6),
      allowNull: false,
      validate: {
        len: [6, 6],
      },
    },
    expiresAt: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    used: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
  },
  {
    tableName: "otps",
    indexes: [
      {
        fields: ["email"],
        name: "otp_email_index",
      },
      {
        fields: ["expiresAt"],
        name: "otp_expiry_index",
      },
    ],
    timestamps: true,
    createdAt: "createdAt",
    updatedAt: false,
    hooks: {
      beforeCreate: (otp) => {
        if (!otp.expiresAt) {
          otp.expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes
        }
      },
    },
  }
);

// Initialize table with retry logic
Otp.initTable = async (maxRetries = 3) => {
  let attempts = 0;
  while (attempts < maxRetries) {
    try {
      await sequelize.query(`
        CREATE TABLE IF NOT EXISTS otps (
          id INT AUTO_INCREMENT PRIMARY KEY,
          email VARCHAR(255) NOT NULL,
          otp VARCHAR(6) NOT NULL,
          expiresAt DATETIME NOT NULL,
          used TINYINT(1) DEFAULT 0,
          createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
          INDEX otp_email_index (email),
          INDEX otp_expiry_index (expiresAt)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
      `);
      console.log("✅ OTP table verified/created");
      return true;
    } catch (error) {
      attempts++;
      console.error(`Attempt ${attempts} failed:`, error.message);
      if (attempts >= maxRetries) throw error;
      await new Promise((resolve) => setTimeout(resolve, 1000 * attempts));
    }
  }
};

module.exports = Otp;
