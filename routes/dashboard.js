const express = require('express');
const router = express.Router();
const { User, Blog, Comment, TotalEarnings,monthlyViews} = require("../models");

const jwtVerify = require("./jwt")
const {encrypt, decrypt} = require("./encrypt")

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


router.get("/oldDashboard", async (req, res) => {
  res.status(201).render("Dashboard", {
    user: [],
    blogs: [],
    comments: [],
  })
})

router.get("/dashboard", async (req, res) => {
  res.status(201).render("newDashboard", {
    user: [],
    blogs: [],
    comments: [],
  })
})


router.get("/currentUser", async (req, res) => {
  //console.log("func = ", jwtVerify(req))
  let user = jwtVerify(req);
  console.log("user = ", user)
  if (user){
    user.user._id = encrypt(user.user._id)
    //console.log("user in current user = ", user)
    res.json(user)
  }
  else{
    res.render("login")
  }
})

router.get("/userBlogsPublish", async (req, res) => {
  //console.log("userBlogsPublish is called");
  //console.log("func = ", jwtVerify(req))
  let user = jwtVerify(req);
  //console.log("user = ", user)
  if (user){
    if (user.user){
      const page = parseInt(req.query.page);
      //console.log(page);
      const pageSize = parseInt(req.query.pageSize);
      //console.log(pageSize);
      const skip = (page - 1) * pageSize;
      //console.log(skip);

      const blogData = await Blog.find({ userId: user.user._id, status: "Published" })
            .skip(skip)
            .limit(pageSize)
            .exec();
            
      //console.log("blogs = ", blogData)
      const totalDataCount = await Blog.countDocuments({ userId: user.user._id, status: "Published" });
      //console.log(totalDataCount);

      for(i in blogData){
        let views=blogData[i].viewCount;
        let slot = (views/1000)*30;
        blogData[i].slot = slot;
        blogData[i].userId = encrypt(blogData[i].userId)
      }

      
      res.json({blogData,totalDataCount});
    }
    else{
      res.json("no user found")
    }
  }
  else{
    res.json(null)
  }
})

router.get("/userBlogsDraft", async (req, res) => {
  //console.log("userBlogsDraft is called");
  //console.log("func = ", jwtVerify(req))
  let user = jwtVerify(req);
  //console.log("user = ", user)
  if (user){
    if (user.user){
      const page = parseInt(req.query.page);
      //console.log(page);
      const pageSize = parseInt(req.query.pageSize);
      //console.log(pageSize);
      const skip = (page - 1) * pageSize;
      //console.log(skip);

      const blogData = await Blog.find({ userId: user.user._id, status: "draft" })
            .skip(skip)
            .limit(pageSize)
            .exec();
            
      // //console.log("blogs = ", blogData)
      const totalDataCount = await Blog.countDocuments({ userId: user.user._id, status: "draft" });
      //console.log(totalDataCount);
      //console.log("blogs = ", blogData)
      for (let blog in blogData){
        blogData[blog].userId = encrypt(blogData[blog].userId)
      }
      res.json({blogData,totalDataCount});
    }
    else{
      res.json("no user found")
    }
  }
  else{
    res.json(null)
  }
})

router.get("/userBlogsInReview", async (req, res) => {
  //console.log("userBlogsInReview is called");
  //console.log("func = ", jwtVerify(req))
  let user = jwtVerify(req);
  //console.log("user = ", user)
  if (user){
    if (user.user){
      const page = parseInt(req.query.page);
      //console.log(page);
      const pageSize = parseInt(req.query.pageSize);
      //console.log(pageSize);
      const skip = (page - 1) * pageSize;
      //console.log(skip);

      const blogData = await Blog.find({ userId: user.user._id, status: "in-review" })
            .skip(skip)
            .limit(pageSize)
            .exec();
            
      //console.log("blogs = ", blogData)
      const totalDataCount = await Blog.countDocuments({ userId: user.user._id, status: "in-review" });
      //console.log(totalDataCount);
      for (let blog in blogData){
        //console.log("blog = ", blogData[blog])
        blogData[blog].userId = encrypt(blogData[blog].userId)
      }
      res.json({blogData,totalDataCount});
    }
    else{
      res.json("no user found")
    }
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
  //console.log("dashboard")
  //console.log("king = ", req.token)
  let user = jwtVerify(req);
  //console.log("user = ", user.user)
  //console.log("user = ", user.user._id)
  try {
      //console.log("verified")
      const _id = user.user._id;

      let userData = await User.findOne({ _id });
      userData._id = encrypt(userData._id)
      const blogData = await Blog.find({ userId: userData._id, status: "published"  });
      //console.log(blogData);

      const commentData = await Comment.find({ userId: userData._id });
      //console.log(commentData);

      res.status(201).render("Dashboard", {
        user: userData,
        blogs: blogData,
        comments: commentData,
      });
  } catch (err) {
    //console.log("err = ", err)
    res.status(500).send("Internal Server Error");
  }
});

///////////////////////////////////////////////////////////////////////////////////////

router.get("/blogList", async (req, res) => {
  var user = req.user;
    // Sort blogs by views in descending order
    //const blogsByViews = blogs.sort((a, b) => b.viewCount - a.viewCount);

    // Create separate objects for different blog lists
    const top5ByLikes = await Blog.find({status: "published"}).sort({"likeCount": -1}).limit(5);
    const top8ByLikes = await Blog.find({status: "published"}).sort({"likeCount": -1}).skip(5).limit(8);
    const top6ByViews = await Blog.find({status: "published" }).sort({"viewCount": -1}).limit(6)
    const recent = await Blog.find({status: "published"}).sort("date").limit(20);

    const restOfBlogs = await Blog.find({status: "published" }).limit(20)

    const posts = {
      "top5ByLikes": top5ByLikes,
      "top8ByLikes": top8ByLikes,
      "top6ByViews": top6ByViews,
      "restOfBlogs": restOfBlogs,
      "recent": recent
    }
    console.log("posts = ", posts)
    res.status(200).json(posts);
});

router.get("/", (req, res) => {
  console.log("home")
  var user = req.user;

  Blog.find({status: "published"}).exec({}, (err, blogs) => {
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
    //console.log("auth = ", req.isAuthenticated())
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
