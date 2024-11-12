const jwt = require("jsonwebtoken");
const SECRET = "SOMEnewSecret";

const auth = async (req, res, next) => {
  const token = req.headers.authorization;
  if (!token.startsWith("Bearer ")) {
    return res.status(403).json({ message: "Please pass a bearer token" });
  }

  try {
    const userId = jwt.verify(token.split(" ")[1], SECRET).id;
    req.headers.userId = userId;
    next();
  } catch (e) {
    res.status(403).json({ message: "Invalid token"});
  }
};
module.exports = {SECRET, auth};
