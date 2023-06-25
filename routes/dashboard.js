const express = require("express");
const router = express.Router();
const { User, Blog, Comment } = require("../models");

const jwtVerify = require("./jwt")

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
  res.status(201).render("Dashboard", {
    user: [],
    blogs: [],
    comments: [],
  })
})


router.get("/currentUser", async (req, res) => {
  console.log("func = ", jwtVerify(req))
  let user = jwtVerify(req);
  console.log("user = ", user)
  if (user){
    res.json(user)
  }
  else{
    res.json(null)
  }
})

router.get("/userBlogs", async (req, res) => {
  console.log("func = ", jwtVerify(req))
  let user = jwtVerify(req);
  console.log("user = ", user)
  if (user){
    const blogData = await Blog.find({ userId: user.user._id });
    console.log("blogs = ", blogData)
    res.json(blogData)
  }
  else{
    res.json(null)
  }
})

function passing(req, res, next){
  req.token = "abh"
  return next();
}


router.post("/dashboard",  passing, async (req, res) => {
  console.log("dashboard")
  console.log("king = ", req.token)
  let user = jwtVerify(req);
  console.log("user = ", user.user)
  console.log("user = ", user.user._id)
  try {
      console.log("verified")
      const _id = user.user._id;

      const userData = await User.findOne({ _id });
      const blogData = await Blog.find({ userId: userData._id });
      console.log(blogData);

      const commentData = await Comment.find({ userId: userData._id });
      console.log(commentData);

      res.status(201).render("Dashboard", {
        user: userData,
        blogs: blogData,
        comments: commentData,
      });
  } catch (err) {
    console.log("err = ", err)
    res.status(500).send("Internal Server Error");
  }
});

///////////////////////////////////////////////////////////////////////////////////////

router.get("/blogList", (req, res) => {
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

    const posts = {
      "top5ByLikes": blogsByLikes.slice(0, 5),
      "top8ByLikes": blogsByLikes.slice(0, 8),
      "top6ByViews": blogsByViews.slice(0, 6),
      "restOfBlogs": blogs.slice(0)
    }
    res.status(200).json(posts);

  })
});

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
    console.log("auth = ", req.isAuthenticated())
    if (req.isAuthenticated()) {
      var dashboard = true;
      res.render("new_index", {
        user,
        dashboard,
        top5ByLikes,
        top8ByLikes,
        top6ByViews,
        restOfBlogs,
      });
    } else {
      var dashboard = false;
      res.render("new_index", {
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
