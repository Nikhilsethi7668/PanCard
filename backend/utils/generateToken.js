const jwt = require("jsonwebtoken");
const dotenv = require("dotenv");
const generateTokenAndCookie = (res, userId) => {
  const token = jwt.sign({ userId }, process.env.JWT_Token, {
    expiresIn: "7d",
  });
  console.log("Token:", token);
  res.cookie("token", token, {
    httpsOnly: true,
    secure: true,
    sameSite: "strict",
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });

  return token;
};
module.exports = generateTokenAndCookie;
