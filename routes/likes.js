const express=require('express')
const router=express.Router()
const {Blog, toggle, LikedBlogs} = require('../models.js');

const {encrypt, decrypt} = require("./encrypt")
const jwtVerify = require("./jwt")

// Not using these two for now--------------------------------------
router.get("/like/:blogId/:userId",(req,res)=>{
    let { blogId, userId } = req.params;
    userId = decrypt(userId)
    Blog.findOne({_id:blogId},(err,blog)=>{
      let like = false;
      blog.likes.forEach(element => {
        if(element == userId) like=true;
      });
      res.status(201).json({like})
    })
  })
  
  router.post("/like/:blogId/:userId",(req,res)=>{
    let { blogId, userId } = req.params;
    userId = encrypt(userId)
    Blog.findOne({_id:blogId},(err,blog)=>{
      toggle(blog.likes,userId)
        Blog.updateOne({_id:blogId},{
          likes:blog.likes
        },(err,docs)=>{
          if (err) throw err;
          res.json({message:"updated like",blog,docs})
        })
    })
  })
// --------------------------------------------------------------------

//router.get("/like/:blogId",(req,res)=>{
//  let blogId= req.params.blogId //Get blog Id
//
//  Blog.findOne({_id:blogId},(err,blog)=>{
//    blog.likes.forEach(element => {
//      if(element == userId) like=true;
//    });
//    res.status(201).json({like})
//  })
//})

router.post("/like", async(req,res)=>{
  let blogId = req.body.blogId;
  let user = jwtVerify(req); // Verify user token and get user object
  //console.log("user = ", user)
  //console.log(user==null)
  let amounts = []
  let msg = "Likes not Increased as it was already liked"
  if (user==null){ // If user is null return immediately
    res.status(401).json("no user found")
    return null
  }
  else{
    user = user.user // Once again confirm with the key user inside
    if (user==null){
      res.status(401).json("User ID not correct")
      return null
    }
    let userId = user._id // Get ID
    let blog = await Blog.findOne({_id:blogId}) // Find the blog in question
    let likedBlogs = await LikedBlogs.findOne({blogId: blogId, userId: userId})

    console.log("likedblog - ", likedBlogs)
    console.log("all = ", await LikedBlogs.find())

    let likes = blog.likeCount

    if ((likes==null) | (likes==undefined)){
      likes = 0
    }

    likes += 1

    if (likedBlogs==null){
      const newBlog = await Blog.findOneAndUpdate(
        { _id: blogId },
        {
          $set: { likeCount: likes },
        },
        { strict: false }
      );
      msg = "Likes Increased by one"
      let newLike = new LikedBlogs({
        blogId: blogId,
        userId: userId
      })
      newLike.save()
    }
  }
  res.status(200).json(msg)
})

module.exports=router;
