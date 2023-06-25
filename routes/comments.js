const express = require("express");
const router = express.Router();
const { date, Comment } = require("../models.js");
const jwtVerify = require("./jwt")

router.get("/comment/:blogId", (req, res) => {
  const blogId = req.params.blogId;
  Comment.find({ blogId }, (err, user) => {
    res.status(201).json({ message: "all comments of blog", user });
  });
});

router.post("/newComment", (req, res) => {
  const {blogId, body, status, username } = req.body;
  let user = jwtVerify(req)
  let userId = user.user._id
  const comment = new Comment({ userId, blogId, body, status, date, username });
  comment.save(() => {
    res.status(201).json({ message: "comment is saved", comment });
  });
});

module.exports = router;
