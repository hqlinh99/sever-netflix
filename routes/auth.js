const router = require("express").Router();
const User = require("../models/User");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { registerValidation, loginValidation } = require("../validation");
const verify = require("../verifyToken");

router.post("/register", async (req, res) => {
  //LETS VALIDATE THE DATA BEFORE WE A USER
  const { error } = registerValidation(req.body);
  if (error) return res.status(400).send(error.details[0].message);

  //Checking if the user is already in the database
  const emailExits = await User.findOne({ email: req.body.email });
  if (emailExits) return res.status(400).send("Email already exists!");

  //Hash passwords
  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(req.body.password, salt);

  //Create a new user
  const user = new User({
    username: req.body.username,
    email: req.body.email,
    password: hashedPassword,
  });
  try {
    const savedUser = await user.save();
    res.send({ user: user._id });
  } catch (err) {
    res.status(400).send(err);
  }
});

//LOGIN
router.post("/login", async (req, res) => {
  //LETS VALIDATE THE DATA BEFORE WE A USER
  const { error } = loginValidation(req.body);
  if (error) return res.status(400).send(error.details[0].message);

  //Checking if the email exists
  const user = await User.findOne({ email: req.body.email });
  if (!user) return res.status(400).send("Email is not found");

  //PASSWORD IS CORRECT
  const valiPass = await bcrypt.compare(req.body.password, user.password);
  if (!valiPass) return res.status(400).send("Invalid password");

  //Create and assign a token
  const token = jwt.sign(
    { _id: user._id, isAdmin: user.isAdmin },
    process.env.SECRET_KEY
  );
  res.cookie("token", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    maxAge: 60 * 60 * 1000,
  });
  const { password, ...info } = user._doc;
  res.status(200).json({ ...info, token });
});

router.get("/logout", verify, (req, res) => {
  return res
    .clearCookie("token")
    .status(200)
    .json({ message: "Successfully logged out 😏 🍀" });
});

module.exports = router;
