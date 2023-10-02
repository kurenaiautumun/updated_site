const express = require("express");
const router = express.Router();
const { date, User, Blog, monthlyViews, viewAnalysis,popularBlogs} = require("../models.js");
const { encrypt } = require("./encrypt.js");
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
  Blog.aggregate([
    { $match: { status: "published" } },
    { $sample: { size: parseInt(size)} }],
  (err, blog) => {
    // res.status(201).send({ blog });
    if (err) throw err;
    res.status(201).json({blog });
  });
});

router.get("/blog", (req, res) => {
  const _id = req.query.blogId;
  Blog.find({ _id }, (err, blog) => {
    // res.status(201).send({ blog });
    blog[0].userId = encrypt(blog[0].userId)
    ////console.log(blog);
    res.status(201).send({ blog });
  });
});

router.post("/blog/viewcount", async (req, res) => {
  let user = jwtVerify(req);
  ////console.log("user = ", user)
  const time = req.body.time
  const _id = req.body.blogId;
  const totalTime = req.body.totalTime
  ////console.log("wordCount = ", totalTime)
  ////console.log("time = ", time)
  let blog = await Blog.findOne({_id: _id})
  ////console.log("blog = ", blog)
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
  ////console.log("date = ", date)
  let startDate = new Date(y, m, 2);
  let endDate = new Date(y, m + 1, 0);
  ////console.log(startDate)
  ////console.log(endDate)
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
  ////console.log("monthly views = ", await viewsMonth)
  ////console.log(blog.readTime*60, totalTime)
  if (blog.readTime!=null){
    //console.log(blog.readTime*60 < totalTime)
    //console.log(blog.readTime*120 > totalTime)
    if ((blog.readTime*60 < totalTime) & (blog.readTime*60 + 30 > totalTime)){
      viewsMonth.viewCount += 1
      blog.viewCount += 1
      blog.save()
    }
  }
  viewsMonth.save()
  //monthlyViews.updateOne({ blogId: _id }, { $inc: { viewCount: 1 } }, (err, docs) => {
  //  if (err){
  //    //console.log("error - ", err)
  //  };
  //});
  ////console.log("before error")
  res.json({ message: "view increased" });
});

router.post("/newblog", async (req, res) => {
  const {title, body, views, status, titleImage} = req.body;
  let token = jwtVerify(req);

  //////console.log("user = ", token.user)
  let userId = token.user._id
  let user = await User.findOne({_id: userId});

  ////console.log("user = ", await user)
  let blog_date = new Date(), y = blog_date.getFullYear(), m = blog_date.getMonth() + 1, d = blog_date.getDate();
  let date = `${d}/${m}/${y}`
  ////console.log("blog date = ", blog_date)
  //console.log(d,m,y)
  ////console.log("date = ", date)
  const author = user.username;
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

  ////console.log("date = ", date)
  ////console.log("m = ", m)
  let startDate = new Date(y, m, 2);
  let endDate = new Date(y, m + 1, 0);
  blog.save((err, blog) => {
      viewsMonth = new monthlyViews({
        blogId: blog._id,
        startDate: startDate,
        endDate: endDate,
        viewCount: 0
      })
    res.status(201).json({ message: "blog saved", user, blog });
  });
});

router.post("/updateBlog", async (req, res) => {
  let { id, title, body, titleImage, tags, author, meta, status, readTime } = req.body;
  //console.log(req.body)
  //console.log("tags = ", tags)
  //console.log("id = ", id)
  for (let tag of tags) {
    //console.log(`Processing tag: ${tag}`);
  
    let popular = await popularBlogs.findOne({ tag: tag });
  
    if (popular == null) {
      //console.log("Tag not found, creating a new entry.");
      let popularblog = new popularBlogs({
        tag: tag,
        totalCount: 1,
      });
      await popularblog.save(); 
    } 
    else {
      //console.log("Tag found, updating totalCount.");
      await popularBlogs.updateOne(
        { tag: tag },
        { $inc: { totalCount: 1 } }
      )}
    if (popular!=null){
    //console.log(popular._id.toString());
    //console.log(popular.totalCount);
    if(popular==null){
       //console.log("it is null");
       let popularblog=new popularBlogs({
        tag:tag,
        totalCount:1
       })
       popularblog.save();
      }
      else{
        //console.log("else called");
          popularBlogs.updateOne(
            { tag: tag},
            { $set:{totalCount:(popular.totalCount + 1)}}
          ); 
      }
      //console.log(`Popular blogs for tag "${tag}":`, popular);
    }
    else{
      //console.log("else called");
        popularBlogs.updateOne(
          { tag: tag},
          { $set:{totalCount:10}}
        ); 
    }
  
    // Refresh the popular variable after the update
    popular = await popularBlogs.findOne({ tag: tag });
    //console.log(`Popular blogs for tag "${tag}":`, popular);
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
        //console.log("done for update")
      }
    }},
    {$push:{tags}}, function (err, docs) {
      if (!err){
        //console.log("done")
      }
    }
  );

  res.status(201).json({ message: "update succesfully"})
});

router.get("/author", (req,res)=> {
  res.status(200).render("author")
})

router.get("/popularCount",async(req,res)=>{
  const allPopularBlogs = await popularBlogs.find({});
  res.json({data: allPopularBlogs });
})

router.post("/deleteBlog/:id", (req, res) => {
  const _id = req.params.id;
  Blog.deleteOne({ _id }, (err, blog) => {
    res.status(201).json({ message: "blog deleted succesfully", blog });
  });
});

router.post("/authorBlogs", async (req, res) => {
  let token = jwtVerify(req);

  //console.log("user = ", token.user)
  let userId = token.user._id
  let result
  if (req.body.userId==null){
    result = null
    code = 400
  }

  if (token.user){
    const blogData = await Blog.find({ userId: userId, status: "published" });
    //console.log("blogs = ", blogData)
    res.json(blogData)
  }
  else{
    res.status(400).json("please provide userId")
  }
})

router.post("/category/:tag", async (req, res)=>{
  const blogData = await Blog.find({
    tags : req.params.tag,
    status: "published"
  });
  //console.log("blogs = ", blogData)
  res.json(blogData)
})

router.get("/category/:tag", async (req, res)=>{
  res.render("blog-category")
})

module.exports = router;
