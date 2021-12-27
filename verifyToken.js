const jwt = require("jsonwebtoken");
module.exports = function(req, res, next) {
  const token = req.cookies.token;
  if (!token) return res.status(401).send("You are not authenticated");

  try {
    const verified = jwt.verify(token, process.env.SECRET_KEY);
    req.user = verified;
    next();
  } catch (err) {
    res.status(400).send("Invalid Token");
  }
}
