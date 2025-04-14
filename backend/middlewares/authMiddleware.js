const jwt = require("jsonwebtoken");
const { User } = require("../models");

module.exports =async (req, res, next) => {
  const token = req.cookies.token;

  if (!token) {
    return res.status(401).json({ msg: "Authentication failed" });
  }
  
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET||"TokenForPanDetails");
    const user = await User.findOne({ where: { id:payload.userId } });
    req.user = { userId: user.id, isAdmin: user.isAdmin };
    next();
  } catch (error) {
    console.log(error);
    
    return res.status(401).json({ msg: "Authentication invalid" });
  }
};
