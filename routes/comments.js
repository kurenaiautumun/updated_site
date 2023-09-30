const express = require("express");
const router = express.Router();
const { date, Comment, User } = require("../models.js");
const jwtVerify = require("./jwt")
const {encrypt, decrypt} = require("./encrypt")

router.get("/comment/:blogId", (req, res) => {
  const blogId = req.params.blogId;
  Comment.find({ blogId }, (err, user) => {
    for (let i in user){
      user[i]._id = encrypt(user[i]._id)
    }
    res.status(201).json({ message: "all comments of blog", user });
  });
});

router.post("/newComment", async (req, res) => {
  const {blogId, body, status} = req.body;
  let user = jwtVerify(req)
  let userId = user.user._id
  let username = await User.findOne({_id: userId})
  console.log("user = ", await username.username)
  console.log("username = ", username)
  username = await username.username
  const comment = new Comment({ userId, blogId, body, status, date, username });
  comment.save(() => {
    res.status(201).json(comment);
  });
});

module.exports = router;
