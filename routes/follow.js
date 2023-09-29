const express=require('express')
const router=express.Router()
const { User} = require('../models.js');
const {encrypt, decrypt} = require("./encrypt")

router.get("/follow/:userId",(req,res)=>{
    const _id = decrypt(req.params.userId);
    User.findOne({_id},(err,user)=>{
      if (err) throw err;
      let {followers , username, following} = user;
      for (let i in followers){
        followers[i] = encrypt(followers[i])
      }
      for (let i in following){
        following[i] = encrypt(following[i])
      }
      res.status(201).json({message:"followers details",username, followers, following})
    })
  })

  router.post("/follow/:userId",(req,res)=>{
    const _id = decrypt(req.params.userId);
    let {followers, following} = req.body;
    for (let i in followers){
      followers[i] = decrypt(followers[i])
    }
    for (let i in following){
      following[i] = decrypt(following[i])
    }
    User.updateOne({_id}, 
      {$push:{followers,following}}, function (err, docs) {
        if (!err){
          res.status(201).json({message:"update succesfully",docs})
        }
      });
  })

  module.exports=router;
