const express = require("express");
const app = express();
const mongoose = require("mongoose");
const dotenv = require("dotenv");
const cookieParser = require("cookie-parser");
var cors = require("cors");

app.use(cors());
app.use(cookieParser());

//Import Routes
const authRoute = require("./routes/auth");
const userRoute = require("./routes/users");
const movieRoute = require("./routes/movies");
const listRoute = require("./routes/lists");

dotenv.config();

//Connect to DB
mongoose
  .connect(process.env.MONGO_URL, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    useCreateIndex: true,
  })
  .then(() => console.log("DB Connection Successfully!"))
  .catch((err) => console.log(err));

//Middelwares
app.use(express.json());
//Route Middelwares
app.use("/api/auth", authRoute);
app.use("/api/users", userRoute);
app.use("/api/movies", movieRoute);
app.use("/api/lists", listRoute);

// app.use(express.static(path.join(__dirname, "/client/build")));

// app.get('*', (req, res) => {
//   res.sendFile(path.join(__dirname, '/client/build', 'index.html'));
// });

app.use("/favicon.ico", express.static(__dirname + "/images/favicon.jpg"));

app.use(function (req, res, next) {
  res.header(
    "Access-Control-Allow-Origin",
    "https://clever-kilby-8ae033.netlify.app/"
  );
  res.header("Access-Control-Allow-Methods", "GET,PUT,POST,DELETE");
  res.header("Access-Control-Allow-Origin", "Content-Type");
});

app.listen(process.env.PORT || 5000, () => {
  console.log("Sever is running!");
});
