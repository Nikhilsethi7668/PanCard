const cron = require("node-cron");
const { Op } = require("sequelize");
const User = require("../models/userSchema");
const OtpModel = require("../models/otpSchema");

const cleanupExpiredData = async () => {
  try {
    const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000);

    await User.destroy({
      where: {
        isVerified: false,
        lastLogin: {
          [Op.lt]: tenMinutesAgo,
        },
      },
    });

    await OtpModel.destroy({
      where: {
        createdAt: {
          [Op.lt]: tenMinutesAgo,
        },
      },
    });

    console.log("Expired users and OTPs cleaned up successfully.");
  } catch (error) {
    console.error("Error in cleanup job:", error);
  }
};

// Schedule the cleanup job to run every 10 minutes
cron.schedule("*/1 * * * *", async () => {
  console.log("Running scheduled cleanup job...");
  await cleanupExpiredData();
});

module.exports = cron;
