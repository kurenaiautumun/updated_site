const express = require("express");
const router = express.Router();
const { User, Blog, Comment } = require("../models");

// router.get("/", (req, res) => {
//   if (req.isAuthenticated()) {
//     var user = req.user;

//     Blog.find().exec({}, (err, blogs) => {
//       res.render("index", { user, blogs });
//     });
//   } else {
//     res.redirect("/login");
//   }
// });

router.get("/random", (req, res) => {
  const limit = parseInt(req.query.limit) || 10;
  Blog.aggregate([{ $sample: { size: limit } }]).exec((err, posts) => {
    if (err) {
      return res.status(500).json({ error: err });
    }
    res.status(200).json(posts);
  });
});

router.get("/dashboard", async (req, res) => {
  try {
    if (req.isAuthenticated()) {
      const user = req.user;
      const _id = user._id;

      const userData = await User.findOne({ _id });
      const blogData = await Blog.find({ userId: userData._id });
      console.log(blogData);

      const commentData = await Comment.find({ userId: userData._id });
      console.log(commentData);

      res.status(201).render("dashboard", {
        user: userData,
        blogs: blogData,
        comments: commentData,
      });
    } else {
      res.redirect("/login");
    }
  } catch (err) {
    res.status(500).send("Internal Server Error");
  }
});

///////////////////////////////////////////////////////////////////////////////////////

router.get("/", (req, res) => {
  var user = req.user;

  Blog.find().exec({}, (err, blogs) => {
    // Sort blogs by likes in descending order
    const blogsByLikes = blogs.sort((a, b) => b.likes.length - a.likes.length);

    // Sort blogs by views in descending order
    const blogsByViews = blogs.sort((a, b) => b.viewCount - a.viewCount);

    // Create separate objects for different blog lists
    const top5ByLikes = blogsByLikes.slice(0, 5);
    const top8ByLikes = blogsByLikes.slice(0, 8);
    const top6ByViews = blogsByViews.slice(0, 6);
    const restOfBlogs = blogs.slice(0); // Copy all blogs

    // Remove blogs from restOfBlogs that are already included in top5ByLikes or top6ByViews
    [...top5ByLikes, ...top6ByViews].forEach((blog) => {
      const index = restOfBlogs.findIndex(
        (b) => b._id.toString() === blog._id.toString()
      );
      if (index !== -1) {
        restOfBlogs.splice(index, 1);
      }
    });
    if (req.isAuthenticated()) {
      var dashboard = true;
      res.render("index", {
        user,
        dashboard,
        top5ByLikes,
        top8ByLikes,
        top6ByViews,
        restOfBlogs,
      });
    } else {
      var dashboard = false;
      res.render("index", {
        dashboard,
        top5ByLikes,
        top8ByLikes,
        top6ByViews,
        restOfBlogs,
      });
    }
  });
});

module.exports = router;
