const express = require("express");
const router = express.Router();
const { User } = require("../models.js");
const passport = require("passport");
const jwt = require("jsonwebtoken");


router.get("/login", (req, res) => {
  res.render("login");
});

router.post("/login", function (req, res) {
  console.log("in login")
  const user = new User({
    username: req.body.username,
    password: req.body.password,
  });
  console.log("user = ", user)
  req.login(user, function (err) {
    if (!err) {
        User.findOne(
          { $or: [{ username: user.username }, { email: user.username }] },
          (err, user) => {
            jwt.sign({ user: user }, "secretkey", (err, token) => {
              console.log("token = ", token)
            res.status(200).json({"user": user, "token": token});
          });
        }
        );
      }
      else {
        res.status(404).json({ message: "username or password is wrong" });
    }
  })
});

router.get("/api", (req, res) => {

  res.json({

    message: "Hey, there! Welcome to this API service"

  });

});


router.get("/authenticated", (req, res) => {
  if (req.isAuthenticated()) {
    res.json({ auth: true });
  } else {
    res.json({ auth: false });
  }
});

router.post("/logout", function (req, res, next) {
  req.logout(function (err) {
    if (err) {
      return next(err);
    }
    res.status(201).json({ message: "user logout successfully" });
  });
});

module.exports = router;
