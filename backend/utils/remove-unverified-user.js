const { sequelize } = require("../config/database");
const OtpModel = require("../models/otpSchema");

const cleanupExpiredData = async () => {
  try {
    // Ensure table exists first
    await OtpModel.initTable();

    const count = await OtpModel.destroy({
      where: {
        expiresAt: { [sequelize.Op.lt]: new Date() },
      },
    });
    console.log(`🧹 Cleaned up ${count} expired OTPs`);
  } catch (error) {
    console.error("Cleanup Error:", error.message);
  }
};

// Run cleanup every hour
setInterval(cleanupExpiredData, 60 * 60 * 1000);

// Initial cleanup after 5 seconds delay
setTimeout(cleanupExpiredData, 5000);
