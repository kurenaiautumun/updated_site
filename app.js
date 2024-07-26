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
const writeRoute = require("./routes/write.js");
const payment = require("./routes/payment")
const chats = require("./routes/chat")
const stories = require("./routes/stories")

//const cookieParser = require("cookie-parser");

// Initialization
//app.use(cookieParser());
 
app.use(session({
    secret: "amar",
    saveUninitialized: true,
    resave: true
}));
 

app.use(cors(corsOptions));
app.set("view engine", "ejs");
app.use(express.json());
app.use(express.static("public"));

app.use(
  session({
    secret: process.env.SECRET,
    resave:true,
    saveUninitialized:true
  })
);
app.use(passport.initialize());
app.use(passport.session());

app.use(express.urlencoded({ extended: true }));

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
app.use("/", writeRoute);
app.use("/", payment);
app.use("/", chats);
app.use("/", stories);

app.listen(process.env.PORT, function () {
  console.log(`Server started on http://localhost:${process.env.PORT}`);
});

//process.on('uncaughtException', function (exception) {
//  console.log("exception = ", exception)
// });


//hanlding uncaught errors
 process.on('uncaughtException', err => {
  console.log(`Uncaught Exception - : ${err.message}`)
})
