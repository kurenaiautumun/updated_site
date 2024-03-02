const express=require('express')
const router=express.Router()
const { Review, User, Blog} = require('../models.js');
const jwtVerify = require("./jwt")


router.get("/review/:blogId",(req,res)=>{
    const blogId = req.params.blogId;
    Review.find({blogId},(err,review)=>{
      res.status(201).json({message:"review details",blogId, review})
    })
  })

  router.post("/newReview",(req,res)=>{
    const {userId, blogId, body, score} = req.body;
    const review = new Review({ 
      userId, blogId, body, score, date 
    })
    review.save();
    res.status(201).json({message:"review is saved",review})
  })


  router.post("/allReview", async (req, res)=>{
    let userId = req.query.userId
    let token = jwtVerify(req);
    try{
      let user = token.user._id
      //console.log("id = ", user)
      userObj = await User.findOne({_id:user})
      console.log("userObj = ", await userObj.role)
    
      if ((await userObj.role!="admin")&&(await userObj.role!="reviewer")){
        res.status(400).json("You are not allowed to access this page")
      }
      else{
        let blogs = await Blog.find({ status:"in-review", reviewer: { $exists: true }, "reviewer.0": {$exists: false} })
        console.log("blogs = ", await blogs)
        res.status(200).json(blogs)
      }
    }
    catch(err){
      res.status(404).json(`Please Log-In first - ${err}`)
    }

  })

  router.get("/allReview", (req,res)=>{
    res.render("review")
  })


  router.post("/setReview", async (req, res)=>{
    let token = jwtVerify(req);
    let blogId = req.body.blogId
    try{
      let user = token.user._id
      //console.log("id = ", user)
      userObj = await User.findOne({_id:user})
      console.log("userObj = ", await userObj.role)
    
      if ((await userObj.role!="admin")&&(await userObj.role!="reviewer")){
        res.status(400).json("You are not allowed to access this page")
      }
      else{
        let blog = await Blog.findOne({"_id": blogId})
        console.log("blogs = ", await blog)
        blog.status = "published"
        blog.save()
        res.status(200).json(blog)
      }
    }
    catch(err){
      res.status(404).json(`Please Log-In first - ${err}`)
    }
  })


    router.get("/refer", (req,res)=>{
      res.render("refer")
    })


  module.exports=router;
  