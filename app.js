require("dotenv").config();
const express = require("express");
const app = express();
const ejs = require("ejs");
const cors = require("cors");
const mongoose = require("mongoose");
const passport = require("passport");
const session = require("express-session");

const { corsOptions } = require("./models.js");
const blogRoute = require("./routes/blog");
const dashRoute = require("./routes/dashboard");
const loginRoute = require("./routes/login");
const userRoute = require("./routes/user");
const commentRoute = require("./routes/comments");
const followRoute = require("./routes/follow");
const likeRoute = require("./routes/likes");
const reviewRoute = require("./routes/review");
const bucketRoute = require("./routes/bucket");
const recomandationRoute = require("./routes/recomandation");
const competitionRoute = require("./routes/competition");
const rankingRoute = require("./routes/ranking");

app.use(cors(corsOptions));
app.set("view engine", "ejs");
app.use(express.json());
app.use(express.static("public"));
app.use(express.urlencoded({ extended: true }));
app.use(
  session({
    secret: process.env.SECRET,
    resave: false,
    saveUninitialized: false,
  })
);
app.use(passport.initialize());
app.use(passport.session());

mongoose.set("strictQuery", false);
mongoose.connect(process.env.MONGOLAB_URI, { useNewUrlParser: true });

app.use("/", blogRoute);
app.use("/", dashRoute);
app.use("/", userRoute);
app.use("/", loginRoute);
app.use("/", bucketRoute);
app.use("/", followRoute);
app.use("/", reviewRoute);
app.use("/", commentRoute);
app.use("/", reviewRoute);
app.use("/", likeRoute);
app.use("/", recomandationRoute);
app.use("/", competitionRoute);
app.use("/", rankingRoute);

app.get("/write", (req, res) => {
  if (req.isAuthenticated()) {
    res.render("write", { user: req.user });
  } else {
    res.redirect("/login");
  }
});

app.post("/write", (req, res) => {
  console.log(req.body);
});

app.get("/signup", function (req, res) {
  res.render("register");
});

app.get("/login", (req, res) => {
  res.render("login");
});

app.listen(process.env.PORT, function () {
  console.log(`Server started on http://localhost:${process.env.PORT}`);
});
