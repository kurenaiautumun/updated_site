const express = require("express");
const router = express.Router();
const { date, User, Blog, monthlyViews, viewAnalysis,popularBlogs, userViewCounts} = require("../models.js");
const { encrypt, decrypt } = require("./encrypt.js");
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
    //let n_blog = [0, 1]
    blog[0] = blog[0].toObject()
    blog[0].userId = encrypt(blog[0].userId)
    console.log("blog = ", blog);
    res.status(201).send({ blog });
  });
});


router.post("/blog/increaseViewCount", async (req,res)=>{
  let user = jwtVerify(req);
  console.log("in viewCount")
  //console.log("user = ", user)
  const time = req.body.time
  const _id = req.body.blogId;
  const totalTime = req.body.totalTime
  ////console.log("wordCount = ", totalTime)
  ////console.log("time = ", time)
  let msg = "View Count for Blog Increased by 1"
  let blog = await Blog.findOne({_id: _id})
  if (blog.status=="published"){
    blog.viewCount += 1
    msg = "view increased"
    blog.save()
  }
  else{
    msg = "blog is not published yet"
  }
  
  http_status = 201 
  res.status(200).json(msg)
})


router.post("/blog/viewcount", async (req, res) => {
  let user = jwtVerify(req);
  console.log("in viewCount")
  //console.log("user = ", user)
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

  let views;

  if (totalTime==null){
    res.json("totalTime is not present").status(404)
  }
  if (user!=null){
    views = new viewAnalysis({
      blogId: _id,
      userId: user.user._id,
      time: time
    })
    views.save()
  }
  else{
    //console.log("ip = ", req.ip)
    views = new viewAnalysis({
      blogId: _id,
      ip: req.ip,
      time: time,
    })
    views.save((err, view) => {
      if (err){
        console.log("error = ", err)
      }
      //else{
      //  console.log("views = ", views)
      //}
    })
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
    viewsMonth.save()
  }
  msg = "keep reading"
  let http_status = 200

  ////console.log("monthly views = ", await viewsMonth)
  ////console.log(blog.readTime*60, totalTime)
  
  
    if (blog.readTime!=null){
    //console.log(blog.readTime*60 < totalTime)
    //console.log(blog.readTime*120 > totalTime)
    if (((blog.readTime)*60 < totalTime) & ((blog.readTime)*60 + 30 > totalTime)){
      viewsMonth.viewCount += 1
      //blog.viewCount += 1
      msg = "view increased"
      http_status = 201 
      //blog.save()
      viewsMonth.save()
      res.json({ message: msg }).status(201);
    }
    else{
      res.json({ message: "keep reading" }).status(200);
    }
  }
  else{
    res.json({ message: "keep reading" }).status(200);
  }
  //monthlyViews.updateOne({ blogId: _id }, { $inc: { viewCount: 1 } }, (err, docs) => {
  //  if (err){
  //    //console.log("error - ", err)
  //  };
  //});
  ////console.log("before error")
  
});

router.post('/updateReadingTimeBlog', async (req, res) => {
  try {
    const timeSpentByBlog = await viewAnalysis.aggregate([
      {
        $group: {
          _id: '$blogId',
          totalTimeSpent: { $sum: '$time' },
        },
      },
    ]);

    const updatedBlogs = [];

    for (const { _id: blogId, totalTimeSpent } of timeSpentByBlog) {
      // console.log(timeSpentByBlog);
      updatedBlogs.push({ blogId, totalTimeSpent });
    }

    res.json({ message: 'Total time spent for blogs', updatedBlogs });
  } catch (error) {
    console.error('Error updating total time spent:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});


router.post('/updateReadingCountUser', async (req, res) => {
  let user = jwtVerify(req);
  const _id = req.body.blogId;
  const ip = req.ip

  let blog = await Blog.findOne({ //Find blog using corresponding blogId
    _id: _id
  })

  if (blog.status!="published"){
    res.status(401).json("Blog is not published yet, cannot increase count")
    return null
  }


  if (blog==null){
    res.status(404).json("Blog Id is wrong")
    return null
  }

  if (user==null){
    user = req.ip
  }
  else{
    user = user.user._id
  }

  let date = new Date(), y = date.getFullYear(), m = date.getMonth();//current date

  date = date

  ////console.log("date = ", date)
  let startDate = new Date(y, m, 2);
  let endDate = new Date(y, m + 1, 0);

  console.log("date = ", date, startDate, endDate)

  new_counts = await new userViewCounts({
    userId: user,
    blogId: _id,
    count: 1,
    ip: ip,
    date:date,
    author: await blog.userId
  })
  new_counts.save()
  //if count already exists increment it by 1
  res.status(200).json("count updated")
})

router.post("/getUserReadTimes", async (req,res)=>{
  let user = jwtVerify(req);

  let date = new Date(), y = date.getFullYear();//current date

  let userId = req.body.userId
  let blogId = req.body.blogId
  let author = req.body.author

  console.log("author = ", author)

  let m = req.body.month

  if ((m==undefined) | (m==null)){
    m = date.getMonth()
  }

  else{
    m = m - 1
  }

  console.log("m = ", m, "y = ", y)

  date = date

  ////console.log("date = ", date)
  let startDate = new Date(y, m, 2);
  let endDate = new Date(y, m + 1, 0);

  console.log("date = ", date, startDate, endDate)

  if ((blogId!=undefined) | (blogId!=null)){
    counts = await userViewCounts.find({
    blogId: blogId, 
    date: {
      $gte: startDate, $lte: endDate
      }
    }) 
  }
  else if ((userId!=undefined) | (userId!=null)){
    userId = decrypt(req.body.userId)
    counts = await userViewCounts.find({
      userId: userId, 
      date: {
        $gte: startDate, $lte: endDate
        }
      })
  }
  else if ((author!=undefined) | (author!=null)){
    author = decrypt(req.body.author)
    console.log("author = ", author)
    counts = await userViewCounts.find({
      author: author,
      date: {
        $gte: startDate, $lte: endDate
        }
      })
  }
  res.status(200).json(counts)

})

router.post('/updateReadingTimeUser', async (req, res) => {
  try {
    const timeSpentByBlog = await viewAnalysis.aggregate([
      {
        $group: {
          _id: {
            ip: '$ip',
            blogId: '$blogId',
          },
          totalTimeSpent: { $sum: '$time' },
        },
      },
      {
        $project: {
          _id: 0,
          userId: '$_id.ip',
          blogId: '$_id.blogId',
          totalTimeSpent: 1,
        },
      },
    ]);
    console.log(timeSpentByBlog);
    res.json({ message: 'Total time spent for blogs by user', updatedBlogs: timeSpentByBlog });
  } catch (error) {
    console.error('Error updating total time spent:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});





router.post("/newblog", async (req, res) => {
  const {title, body, views, status, titleImage, group} = req.body;
  const reviewers = []
  let token = jwtVerify(req);

  //////console.log("user = ", token.user)
  let userId = token.user._id
  let user = await User.findOne({_id: userId});

  console.log("user = ", await user)
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
    group,
    date,
    reviewers,
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
  });
  res.status(201).json({ message: "blog saved", user, blog });
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

router.get("/viewAnalysis", (req, res) => {
  res.render("viewAnalytics");
});


router.get("/review", (req, res) => {
  let user = jwtVerify(req);
  console.log("user in write - ". user)
  if (user.user.role=="admin"){
    res.render("review")
  }
  else{
    res.render("new_index")
  }
})


router.post("/review", (req, res)=>{
  Blog.aggregate([
    { $match: { status: "in-review" } }],
    (err, blog) => {
      // res.status(201).send({ blog });
      if (err) {
        console.log(err)
      }
      res.status(201).json({blog });
    });

})


module.exports = router;


