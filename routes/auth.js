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
  const newUser = await new User({
    username: req.body.username,
    email: req.body.email,
    password: hashedPassword,
  });
  try {
    const savedUser = await newUser.save();
    res.send({ newUser: newUser._id });
  } catch (err) {
    res.status(400).send(err);
  }
});

let refreshTokens = [];

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

  //Create and assign a accessToken
  const accessToken = jwt.sign(
    { _id: user._id, isAdmin: user.isAdmin },
    process.env.SECRET_ACCESS_KEY,
    {
      expiresIn: "30s",
    }
  );

  //Create and assign a refreshToken
  const refreshToken = jwt.sign(
    { _id: user._id, isAdmin: user.isAdmin },
    process.env.SECRET_REFRESH_KEY,
    {
      expiresIn: "365d",
    }
  );
  refreshTokens.push(refreshToken);
  //Set refreshToken in cookies
  res.cookie("refreshToken", refreshToken, {
    httpOnly: true,
    secure: false,
    maxAge: 60 * 60 * 1000,
    sameSite: "strict",
    path: "/",
  });
  const { password, ...info } = user._doc;
  return res.status(200).json({ ...info, accessToken });
});

//REFRESH TOKEN
router.post("/refresh-token", (req, res) => {
  const refreshToken = req.cookies.refreshToken;
  if (!refreshToken) return res.status(400).send("You are not authenticated");
  if (!refreshTokens.includes(refreshToken)) {
    return res.status(403).json("Refresh token is not valid");
  }

  jwt.verify(refreshToken, process.env.SECRET_REFRESH_KEY, (err, user) => {
    if (err) {
      console.log(err);
    }
    refreshTokens = refreshTokens.filter((token) => token !== refreshToken);
    //Create and assign a newAccessToken
    const newAccessToken = jwt.sign(
      { _id: user._id, isAdmin: user.isAdmin },
      process.env.SECRET_ACCESS_KEY,
      {
        expiresIn: "30s",
      }
    );

    //Create and assign a newRefreshToken
    const newRefreshToken = jwt.sign(
      { _id: user._id, isAdmin: user.isAdmin },
      process.env.SECRET_REFRESH_KEY,
      {
        expiresIn: "365d",
      }
    );
    refreshTokens.push(newRefreshToken);
    res.cookie("refreshToken", newRefreshToken, {
      httpOnly: true,
      secure: false,
      maxAge: 60 * 60 * 1000,
      sameSite: "strict",
      path: "/",
    });
    return res.status(200).json({ accessToken: newAccessToken });
  });
});

router.get("/logout", verify, (req, res) => {
  refreshTokens = refreshTokens.filter(
    (token) => token !== req.cookies.refreshToken
  );
  return res
    .clearCookie("refreshToken")
    .status(200)
    .json({ message: "Successfully logged out 😏 🍀" });
});

module.exports = router;
