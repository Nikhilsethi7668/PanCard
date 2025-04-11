const User = require("../models/userSchema"); // Import the User model
const OtpModel = require("../models/otpSchema.js");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const nodemailer = require("nodemailer");
const generateTokenAndCookie = require("../utils/generateToken.js");
const { client, sender } = require("../config/mailtrap.config.js");

const transporter = nodemailer.createTransport({
  service: "gmail",
  port: 465,
  secure: true,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

// Signup Controller
const signup = async (req, res, next) => {
  console.log("Signup Request:", req.body);

  const { userName, email, password, panNumber } = req.body;

  try {
    // Validate required fields
    if (!userName || !email || !password || !panNumber) {
      return res
        .status(400)
        .json({ success: false, message: "All fields are required" });
    }

    // Check if user already exists (Parallel Execution for Optimization)
    const [existingEmail, existingUsername, existingPan] = await Promise.all([
      User.findOne({ where: { email } }),
      User.findOne({ where: { username: userName } }),
      User.findOne({ where: { panNumber } }),
    ]);

    if (existingEmail) {
      return res.status(400).json({
        success: false,
        message: "User already exists with this email",
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

    // Create a new user
    const user = await User.create({
      username: userName,
      email,
      panNumber,
      password: hashedPassword,
    });

    if (!user) {
      return res
        .status(500)
        .json({ success: false, message: "User creation failed" });
    }

    // Generate OTP for verification
    const otp = Math.floor(100000 + Math.random() * 900000);
    await OtpModel.create({ email, otp });

    // Send OTP email (Async to avoid delaying response)

    const response = await client.send({
      from: sender,
      to: email,
      subject: "Your OTP for Account Verification",
      html: `
        <p>Hello ${userName},</p>
        <h2 style="color: #4CAF50;">${otp}</h2>
        <p>This OTP is valid for 10 minutes.</p>
        <p>If you did not request this, please ignore this email.</p>
      `,
      category: "Email Verification",
    });

    // Generate JWT token and set cookie
    generateTokenAndCookie(res, user.id);

    // Return success response
    console.log("User created successfully:", user.id);

    res.status(201).json({
      success: true,
      message: "User created successfully",
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        panNumber: user.panNumber,
      },
    });
  } catch (error) {
    console.error("Signup Error:", error);
    next(error); // Pass to centralized error handler (if exists)
  }
};

const verifyOtp = async (req, res, next) => {
  try {
    const { email, otp } = req.body;

    // Validate input
    if (!email || !otp) {
      return res
        .status(400)
        .json({ success: false, message: "Email and OTP are required" });
    }

    // Find OTP record
    const otpRecord = await OtpModel.findOne({ where: { email, otp } });

    if (!otpRecord) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid or expired OTP" });
    }

    // Update user verification status
    const updatedUser = await User.update(
      { isVerified: true },
      { where: { email } }
    );

    if (!updatedUser[0]) {
      return res.status(400).json({
        success: false,
        message: "User not found or already verified",
      });
    }

    // Delete OTP record after successful verification
    await OtpModel.destroy({ where: { email } });

    return res
      .status(200)
      .json({ success: true, message: "OTP verified successfully" });
  } catch (error) {
    console.error("OTP Verification Error:", error);
    next(error);
  }
};

// Login Controller
const login = async (req, res) => {
  console.log("Login request:", req.body);
  const { email, password } = req.body;

  try {
    // Find user by email
    const user = await User.findOne({ where: { email } });
    if (!user) {
      return res.status(400).json({
        success: false,
        message: "Invalid credentials",
      });
    }
    if (!user.isVerified) {
      // Generate a new OTP
      const otp = Math.floor(100000 + Math.random() * 900000);

      // Update or create OTP record in the database
      await OtpModel.upsert({ email, otp });

      // Send OTP email
      const response = await client.send({
        from: sender,
        to: email,
        subject: "Your OTP for Account Verification",
        html: `
          <p>Hello ${userName},</p>
          <h2 style="color: #4CAF50;">${otp}</h2>
          <p>This OTP is valid for 10 minutes.</p>
          <p>If you did not request this, please ignore this email.</p>
        `,
        category: "Email Verification",
      });
      return res.status(200).json({
        success: false,
        message: "Email is not verified. OTP has been resent.",
        status: "unverified",
        email: user.email,
      });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      console.log(isPasswordValid);
      return res.status(400).json({
        success: false,
        message: "Invalid credentials",
      });
    }

    console.log("User logged in:", user);

    generateTokenAndCookie(res, user.id);

    // Update last login timestamp
    user.lastLogin = new Date();
    await user.save();

    // Return success response
    res.status(200).json({
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
    console.log("Error:", error);
    res.status(400).json({
      success: false,
      message: `Login failed: ${error.message}`,
    });
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
  // console.log(token);

  if (!token) {
    return res.status(401).json({ authenticated: false });
  }

  try {
    // Verify JWT token
    const decoded = jwt.verify(token, "TokenForPanDetails");
    // console.log(decoded);
    const user = await User.findByPk(decoded.userId);

    if (!user) {
      return res.status(401).json({ authenticated: false });
    }

    // Return authenticated user
    return res.status(200).json({
      authenticated: true,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        panNumber: user.panNumber,
        isAdmin: user.isAdmin,
      },
    });
  } catch (error) {
    console.log("Error:", error);
    return res.status(401).json({ authenticated: false });
  }
};

module.exports = { signup, login, logout, checkAuth, verifyOtp };
