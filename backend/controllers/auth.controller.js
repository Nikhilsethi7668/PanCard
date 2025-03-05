const User = require("../models/userSchema"); // Import the User model
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const generateTokenAndCookie = require("../utils/generateToken.js");

// Signup Controller
const signup = async (req, res) => {
  console.log(req.body);

  const { userName, email, password, panNumber } = req.body;
  console.log(userName, email, password, panNumber);

  try {
    // Validate required fields
    if (!userName || !email || !password || !panNumber) {
      throw new Error("All fields are required");
    }

    // Check if user already exists with the same email
    const userAlreadyExists = await User.findOne({ where: { email } });
    if (userAlreadyExists) {
      return res.status(400).json({
        success: false,
        message: "User already exists with this email",
      });
    }

    // Check if user already exists with the same username
    const userAlreadyExistsbyUsername = await User.findOne({
      where: { username: userName },
    });
    if (userAlreadyExistsbyUsername) {
      return res.status(400).json({
        success: false,
        message: "User already exists with this username",
      });
    }

    // Check if user already exists with the same PAN number
    const userAlreadyExistsbyPan = await User.findOne({
      where: { panNumber },
    });
    if (userAlreadyExistsbyPan) {
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

    console.log("User created:", user);

    // Generate JWT token and set cookie
    generateTokenAndCookie(res, user.id);

    // Return success response
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
    console.log("Error:", error);
    res.status(400).json({ success: false, message: error.message });
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

    // Validate password
    // console.log("givenb pass", password);
    // console.log("user pass", user.password);
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      console.log(isPasswordValid);
      return res.status(400).json({
        success: false,
        message: "Invalid credentials",
      });
    }

    console.log("User logged in:", user);

    // Generate JWT token and set cookie
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

module.exports = { signup, login, logout, checkAuth };
