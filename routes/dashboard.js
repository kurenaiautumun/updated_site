const express = require("express");
const router = express.Router();
const { User, Blog, Comment } = require("../models");

router.get("/", (req, res) => {
  if (req.isAuthenticated()) {
    var user = req.user;

    Blog.find().exec({}, (err, blogs) => {
      res.render("index", { user, blogs });
    });
  } else {
    res.redirect("/login");
  }
});

router.get("/random", (req, res) => {
  const limit = parseInt(req.query.limit) || 10;
  Blog.aggregate([{ $sample: { size: limit } }]).exec((err, posts) => {
    if (err) {
      return res.status(500).json({ error: err });
    }
    res.status(200).json(posts);
  });
});

router.get("/dashboard/:userId", (req, res) => {
  const userId = req.params.userId;

  User.find({ _id: userId }, (err, user) => {
    Blog.find({ userId }, (err, blogs) => {
      Comment.find({ userId }, (err, comments) => {
        res
          .status(201)
          .render("dashboard", { message: "dashboard", user, blogs, comments });
      });
    });
  });
});

module.exports = router;
