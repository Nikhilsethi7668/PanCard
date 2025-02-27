const User = require("../models/userSchema");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const generateTokenAndCookie = require("../utils/generateToken.js");
const signup = async (req, res) => {
  console.log(req.body);

  const { userName, email, password } = req.body;
  console.log(userName, email, password);

  try {
    if (!userName || !email || !password) {
      throw new Error("All fields are required");
    }

    const userAlreadyExists = await User.findOne({ email });

    if (userAlreadyExists) {
      return res.status(400).json({
        success: false,
        message: "User already exist with this email",
      });
    }
    const userAlreadyExistsbyUsername = await User.findOne({
      username: userName,
    });

    if (userAlreadyExistsbyUsername) {
      return res.status(400).json({
        success: false,
        message: "User already exists with this username",
      });
    }
    const username = userName;

    console.log("password", password);
    const hashedPassword = await bcrypt.hash(password, 10);

    const user = new User({
      username,
      email,
      password: hashedPassword,
    });
    console.log("user", user);

    await user.save();

    generateTokenAndCookie(res, user._id);
    res.status(201).json({
      success: true,
      message: "User created successfully",
      user: {
        ...user._doc,
        password: undefined,
        confirmPassword: undefined,
      },
    });
  } catch (error) {
    console.log("error", error);
    res.status(400).json({ success: false, message: error.message });
  }
};

const login = async (req, res) => {
  console.log("login");
  console.log(req.body);
  const { email, password } = req.body.email;
  console.log(email, password);

  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({
        success: false,
        message: "Invalid Credentials",
      });
    }
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(400).json({
        success: false,
        message: "Invalid Credentials",
      });
    }
    console.log("user", user);

    generateTokenAndCookie(res, user._id);

    user.lastLogin = new Date();
    await user.save();

    res.status(200).json({
      success: true,
      message: "Logged in Successfully",
      user: {
        ...user._doc,
        password: undefined,
      },
    });
  } catch (error) {
    console.log("error", error);
    res.status(400).json({
      success: false,
      message: `Login Failes : ${error}`,
    });
  }
};

const logout = async (req, res) => {
  res.clearCookie("token");
  res.status(200).json({
    success: true,
    message: "Logged-Out Successfully",
  });
};

const checkAuth = async (req, res) => {
  const { token } = req.cookies;
  if (!token) {
    return res.status(401).json({ authenticated: false });
  }
  console.log("token", token);
  const decoded = jwt.verify(token, process.env.JWT_Token);
  const user = await User.findById(decoded.userId);
  if (!user) {
    return res.status(401).json({ authenticated: false });
  }
  return res.status(200).json({ authenticated: true, user });
};
module.exports = { signup, login, logout, checkAuth };
