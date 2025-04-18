const User = require("../models/userSchema");
const OtpModel = require("../models/otpSchema");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { client, sender } = require("../config/mailtrap.config.js");
const generateTokenAndCookie = require("../utils/generateToken.js");
const { sequelize } = require("../models");
const { Op } = require("sequelize");

// setInterval(() => OtpModel.cleanupExpired(), 3600000); // Clean hourly
const sendOtpEmail = async (email, userName) => {
  const t = await sequelize.transaction();
  try {
    // Ensure table exists
    await OtpModel.initTable();

    // Delete old OTPs
    await OtpModel.destroy({
      where: { email },
      transaction: t,
    });

    // Create new OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    await OtpModel.create(
      {
        email,
        otp,
        expiresAt: new Date(Date.now() + 10 * 60 * 1000),
      },
      { transaction: t }
    );

    // Send email using correct Mailtrap API
    const response = await client.send({
      from: sender,
      to: [{ email }],
      subject: "Your OTP for verification",
      text: `Hello ${userName},\n\nYour OTP is ${otp}.\nIt is valid for 10 minutes.`,
      category: "OTP Verification",
    });

    console.log("📧 Email sent:", response);
    await t.commit();
    return otp;
  } catch (error) {
    await t.rollback();
    console.error("OTP Error:", {
      email,
      error: error.message,
      stack: error.stack,
    });
    throw new Error("Failed to send OTP. Please try again later.");
  }
};
// Signup Controller
const signup = async (req, res, next) => {
  console.log("Signup Request:", req.body);
  const { userName, email,phoneNumber , password, panNumber } = req.body;

  try {
    // Validate required fields
    if (!userName|| !phoneNumber || !email || !password || !panNumber) {
      return res.status(400).json({
        success: false,
        message: "All fields are required",
      });
    }

    // Check if user already exists
    const [existingEmail,existingPhoneNumber, existingUsername, existingPan] = await Promise.all([
      User.findOne({ where: { email } }),
      User.findOne({ where: { phoneNumber: phoneNumber } }),
      User.findOne({ where: { username: userName } }),
      User.findOne({ where: { panNumber } }),
    ]);

    if (existingEmail) {
      return res.status(400).json({
        success: false,
        message: "User already exists with this email",
      });
    }
    if (existingPhoneNumber) {
      return res.status(400).json({
        success: false,
        message: "Phone number is already used",
      });
    }
    if (existingUsername) {
      return res.status(400).json({
        success: false,
        message: "User already exists with this username",
      });
    }
    if (existingPan) {
      return res.status(400).json({
        success: false,
        message: "User already exists with this PAN number",
      });
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create new user
    const user = await User.create({
      username: userName,
      email,
      phoneNumber,
      panNumber,
      password: hashedPassword,
    });
    console.log("User Created");

    if (!user) {
      return res.status(500).json({
        success: false,
        message: "User creation failed",
      });
    }

    // Send OTP email
    await sendOtpEmail(email, userName);

    // Generate JWT token and set cookie
    generateTokenAndCookie(res, user.id);

    res.status(201).json({
      success: true,
      message: "User created successfully",
      user: {
        id: user.id,
        username: user.username,
        phoneNumber:user.phoneNumber,
        email: user.email,
        panNumber: user.panNumber,
      },
    });
  } catch (error) {
    console.error("Signup Error:", error);
    next(error);
  }
};

// Verify OTP
const verifyOtp = async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      await t.rollback();
      return res.status(400).json({
        success: false,
        message: "Email and OTP are required",
      });
    }

    // Find the OTP record
    const otpRecord = await OtpModel.findOne({
      where: {
        email,
        otp,
        used: false,
        expiresAt: { [Op.gt]: new Date() }, // Fixed: Using properly imported Op
      },
      transaction: t,
    });

    if (!otpRecord) {
      await t.rollback();
      return res.status(400).json({
        success: false,
        message: "Invalid or expired OTP",
      });
    }

    // Mark OTP as used
    await otpRecord.update({ used: true }, { transaction: t });

    // Verify user
    const [updatedCount] = await User.update(
      { isVerified: true },
      {
        where: { email },
        transaction: t,
      }
    );

    if (updatedCount === 0) {
      await t.rollback();
      return res.status(400).json({
        success: false,
        message: "User not found",
      });
    }

    await t.commit();
    return res.status(200).json({
      success: true,
      message: "OTP verified successfully",
    });
  } catch (error) {
    await t.rollback();
    console.error("OTP Verification Error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error during OTP verification",
    });
  }
};

// Login Controller
const login = async (req, res, next) => {
  console.log("Login request:", req.body);
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ where: { email } });
    if (!user) {
      return res.status(400).json({
        success: false,
        message: "Invalid credentials",
      });
    }

    console.log("User Found");

    // Handle unverified users
    if (!user.isVerified) {
      const otp = Math.floor(100000 + Math.random() * 900000).toString();

      await OtpModel.upsert({
        email,
        otp,
        expiresAt: new Date(Date.now() + 10 * 60 * 1000),
        used: false,
      });

      await sendOtpEmail(email, user.username);

      return res.status(200).json({
        success: false,
        message: "Email is not verified. OTP has been resent.",
        status: "unverified",
        email: user.email,
      });
    }

    console.log("User is verified");

    // Validate password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(400).json({
        success: false,
        message: "Invalid credentials",
      });
    }

    // Update last login and generate token
    user.lastLogin = new Date();
    await user.save();

    generateTokenAndCookie(res, user.id);

    return res.status(200).json({
      success: true,
      message: "Logged in successfully",
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        panNumber: user.panNumber,
        isAdmin: user.isAdmin,
      },
    });
  } catch (error) {
    console.error("Login Error:", error);
    next(error);
  }
};

// Logout Controller
const logout = async (req, res) => {
  res.clearCookie("token");
  res.status(200).json({
    success: true,
    message: "Logged out successfully",
  });
};

// Check Authentication Controller
const checkAuth = async (req, res) => {
  const { token } = req.cookies;

  if (!token) {
    return res.status(401).json({ authenticated: false });
  }

  try {
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET || "TokenForPanDetails"
    );
    const user = await User.findByPk(decoded.userId);

    if (!user) {
      return res.status(401).json({ authenticated: false });
    }

    return res.status(200).json({
      authenticated: true,
      user: {
        id: user.id,
        username: user.username,
        phoneNumber: user?.phoneNumber,
        email: user.email,
        panNumber: user.panNumber,
        isAdmin: user.isAdmin,
      },
    });
  } catch (error) {
    console.log("Auth Check Error:", error);
    return res.status(401).json({ authenticated: false });
  }
};

const updatePassword = async (req, res) => {
  const { userId } = req.user;
  const { currentPassword, password } = req.body;

  try {
    if (!currentPassword || !password) {
      return res.status(400).json({
        success: false,
        message: 'Both current and new passwords are required',
      });
    }

    const user = await User.findByPk(userId);

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      return res.status(400).json({ success: false, message: 'Current password is incorrect' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    user.password = hashedPassword;
    await user.save();

    return res.status(200).json({
      success: true,
      message: 'Password updated successfully',
    });
  } catch (error) {
    console.error('Update Password Error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};
const updateProfile = async (req, res) => {
  const { userId } = req.user; 
  const { username, phoneNumber } = req.body;

  try {
    if (!username || !phoneNumber) {
      return res.status(400).json({
        success: false,
        message: 'Username and phone number are required',
      });
    }

    // Check if username or phone is already taken by another user
    const [existingUsername, existingPhone] = await Promise.all([
      User.findOne({ where: { username, id: { [Op.ne]: userId } } }),
      User.findOne({ where: { phoneNumber, id: { [Op.ne]: userId } } }),
    ]);

    if (existingUsername) {
      return res.status(400).json({ success: false, message: 'Username already taken' });
    }
    if (existingPhone) {
      return res.status(400).json({ success: false, message: 'Phone number already in use' });
    }

    const [updatedCount] = await User.update(
      { username, phoneNumber },
      { where: { id: userId } }
    );

    if (updatedCount === 0) {
      return res.status(404).json({ success: false, message: 'User not found or no changes made' });
    }

    return res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
    });
  } catch (error) {
    console.error('Update Profile Error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};


module.exports = { signup, login, logout,updatePassword,updateProfile, checkAuth, verifyOtp };
