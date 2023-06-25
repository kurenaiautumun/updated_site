const express = require("express");
const router = express.Router();
const { date, User, Blog } = require("../models.js");
const jwtVerify = require("./jwt")

router.get("/blogss", (req, res) => {
  const _id = req.query.blogId;
  Blog.find({ _id }, (err, blog) => {
    // res.status(201).send({ blog });
    res.status(201).render("read", { blog: blog });
  });
});

router.get("/randomBlogs", (req, res) => {
  const size = req.query.size;
  Blog.aggregate([{ $sample: { size: parseInt(size)} }], (err, blog) => {
    // res.status(201).send({ blog });
    if (err) throw err;
    res.status(201).json({blog });
  });
});

router.get("/blog", (req, res) => {
  const _id = req.query.blogId;
  Blog.find({ _id }, (err, blog) => {
    // res.status(201).send({ blog });
    console.log(blog);
    res.status(201).send({ blog });
  });
});

router.post("/blog/viewcount", (req, res) => {
  const _id = req.query.blogId;
  if (req.body.action == "incrementViewCount") {
    Blog.updateOne({ _id }, { $inc: { viewCount: 1 } }, (err, docs) => {
      if (err) throw err;
      res.status(201).json({ message: "view increased" });
    });
  }
});

router.post("/newblog", (req, res) => {
  const { userId, title, body, views, status, titleImage} = req.body;
  let user;
  User.findOne({ _id: userId }, (err, user) => {
    user = user
    console.log("user -= ", user)
    const userName = user.username
    const blog = new Blog({
      userId,
      title,
      body,
      views,
      status,
      date,
      titleImage,
      userName,
    });
    blog.save((err, blog) => {
      res.status(201).json({ message: "blog saved", user, blog });
    });
  });
});

router.post("/updateBlog", (req, res) => {
  let { id, title, body, titleImage, tags, author, meta } = req.body;
  console.log(req.body)
  console.log("tags = ", tags)

  Blog.update(
    { _id: id },
    {$set: {
      "body": body, 
      "title": title,
      "titleImage": titleImage,
      "tags": tags,
      "author": author,
      "meta": meta
    }, function (err, docs) {
      if (!err){
        console.log("done for update")
      }
    }},
    {$push:{tags}}, function (err, docs) {
      if (!err){
        console.log("done")
      }
    }
  );

  res.status(201).json({ message: "update succesfully"})
});

router.get("/author", (req,res)=> {
  res.status(200).render("author")
})

router.post("/deleteBlog/:id", (req, res) => {
  const _id = req.params.id;
  Blog.deleteOne({ _id }, (err, blog) => {
    res.status(201).json({ message: "blog deleted succesfully", blog });
  });
});

router.post("/authorBlogs", async (req, res) => {
  console.log("func = ", jwtVerify(req))
  let user = jwtVerify(req);
  console.log("user = ", user)
  if (req.body.userId==null){
    res.status(400).json("please provide userId")
  }
  let userId = req.body.userId
  if (user){
    const blogData = await Blog.find({ userId: userId });
    console.log("blogs = ", blogData)
    res.json(blogData)
  }
  else{
    res.json(null)
  }
})

module.exports = router;
