const express = require("express");
const router = express.Router();
const { date, User, Blog, monthlyViews, viewAnalysis,popularBlogs} = require("../models.js");
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

router.post("/blog/viewcount", async (req, res) => {
  let user = jwtVerify(req);
  console.log("user = ", user)
  const time = req.body.time
  const _id = req.body.blogId;
  const totalTime = req.body.totalTime
  console.log("wordCount = ", totalTime)
  console.log("time = ", time)
  let blog = await Blog.findOne({_id: _id})
  console.log("blog = ", blog)
  if (time==null){
    res.json("time is not present").status(404)
  }

  if (totalTime==null){
    res.json("totalTime is not present").status(404)
  }
  if (user!=null){
    let views = new viewAnalysis({
      blogId: _id,
      userId: user.user._id,
      time: time
    })
    views.save()
  }
  

  let date = new Date(), y = date.getFullYear(), m = date.getMonth();
  console.log("date = ", date)
  let startDate = new Date(y, m, 2);
  let endDate = new Date(y, m + 1, 0);
  console.log(startDate)
  console.log(endDate)
  let viewsMonth = await monthlyViews.findOne({
    blogId: _id,
    startDate: startDate,
    endDate: endDate
  })
  if (viewsMonth==null){
    viewsMonth = await new monthlyViews({
      blogId: _id,
      startDate: startDate,
      endDate: endDate,
      viewCount: 0
    })
  }
  console.log("monthly views = ", await viewsMonth)
  console.log(blog.readTime*60, totalTime)
  if (blog.readTime!=null){
    console.log(blog.readTime*60 < totalTime)
    console.log(blog.readTime*120 > totalTime)
    if ((blog.readTime*60 < totalTime) & (blog.readTime*60 + 30 > totalTime)){
      viewsMonth.viewCount += 1
      blog.viewCount += 1
      blog.save()
    }
  }
  viewsMonth.save()
  //monthlyViews.updateOne({ blogId: _id }, { $inc: { viewCount: 1 } }, (err, docs) => {
  //  if (err){
  //    console.log("error - ", err)
  //  };
  //});
  //console.log("before error")
  //res.json({ message: "view increased" });
});

router.post("/newblog", (req, res) => {
  const { userId, title, body, views, status, titleImage} = req.body;
  let user;
  console.log("userID = ", userId)
  User.findOne({ _id: userId }, (err, user) => {
    user = user
    console.log("user -= ", user)
    const author = user.username
    const blog = new Blog({
      userId,
      title,
      body,
      views,
      status,
      date,
      titleImage,
      author,
      status,
    });
    blog.save((err, blog) => {
      res.status(201).json({ message: "blog saved", user, blog });
    });
  });
});

router.post("/updateBlog", async (req, res) => {
  let { id, title, body, titleImage, tags, author, meta, status, readTime } = req.body;
  console.log(req.body)
  console.log("tags = ", tags)
  console.log("id = ", id)
  for (const tag of tags) {

    console.log(`Processing tag: ${tag}`);

    let popular = await popularBlogs.findOne({ tag: tag });
    console.log(popular._id.toString());
    console.log(popular.totalCount);
    if(popular==null){
     console.log("it is null");
     let popularblog=new popularBlogs({
      tag:tag,
      totalCount:1
     })
     popularblog.save();
    }
    else{
      console.log("else called");
        popularBlogs.updateOne(
          { tag: tag},
          { $set:{totalCount:(popular.totalCount + 1)}}
        ); 
    }
    console.log(`Popular blogs for tag "${tag}":`, popular);
  }

  Blog.updateOne(
    { _id: id },
    {$set: {
      "body": body, 
      "title": title,
      "titleImage": titleImage,
      "tags": tags,
      "author": author,
      "meta": meta,
      "status": status,
      "readTime": readTime,
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
    const blogData = await Blog.find({ userId: userId, status: "published" });
    console.log("blogs = ", blogData)
    res.json(blogData)
  }
  else{
    res.json(null)
  }
})

router.post("/category/:tag", async (req, res)=>{
  const blogData = await Blog.find({
    tags : req.params.tag,
    status: "published"
  });
  console.log("blogs = ", blogData)
  res.json(blogData)
})

router.get("/category/:tag", async (req, res)=>{
  res.render("blog-category")
})

router.get("/chat", async (req, res)=>{
  res.render("chat")
})

module.exports = router;
