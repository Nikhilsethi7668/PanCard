const jwt = require("jsonwebtoken");

module.exports = (req, res, next) => {
  const token = req.cookies.token;

  if (!token) {
    return res.status(401).json({ msg: "Authentication failed" });
  }

  try {
    const payload = jwt.verify(token, process.env.JWT_Token);
    req.user = { userId: payload.userId, isAdmin: payload.isAdmin };
    next();
  } catch (error) {
    return res.status(401).json({ msg: "Authentication invalid" });
  }
};
