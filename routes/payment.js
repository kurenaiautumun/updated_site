const express = require("express");
const router = express.Router();
const { Blog, User, Referral, transporter,
   UserInfo, Earnings, TotalEarnings, paySlots, monthlyViews } = require("../models.js");

const jwtVerify = require("./jwt")


router.get("/all_referrals", async function(req,res){
    let user = jwtVerify(req);
  console.log("user = ", user)
  if (user){
    let newData = []
    let refData = await Referral.findOne({ userId: user.user._id });
    console.log("referrals")
    for(let i in refData.referralArray){
      console.log(refData.referralArray[i])
      let userData = await User.findOne({_id: refData.referralArray[i]})
      console.log("userData = ", await userData)
      newData.push(await userData)
    }
    console.log("blogs = ", newData)
    res.json(newData)
  }
  else{
    res.json(null)
  }
})

router.get("/referral_pay", async function(req,res){
    res.json("hello")
})

router.get("/calculateEarnings", async function(req, res){
  let user = jwtVerify(req);
  console.log("user = ", user)
  console.log(user==null)
  let amounts = []
  if (user==null){
    amounts = []
  }
  else{
    user = user.user
    if (user==null){
      res.status(400).json("no user found")
    }
    const views = await monthlyViews.find({ userId: user._id });
    console.log("blogs = ", views)
    for(let i in views){
      console.log(views[i].viewCount)
      let slot = (views[i].viewCount/1000)
      try{
        //pay_slip = paySlots.find({slot: slot}).amount
        pay_slip = 30*slot
      }
      catch(err){
        pay_slip = 0
      }
      amounts.push({"blog": views[i].blogId, "revenue": pay_slip})
    }
  }
  res.json(amounts)
})

router.post("/totalEarningsRef", async function(req, res){
  let user = req.body.userId
  console.log("user = ", user)
  console.log(user==null)
  let amounts = []
  let total_pay = 0
  let month = req.body.month
  let year = req.body.year
  if (user==null){
    amounts = []
  }
  else{
    if (user==null){
      res.status(400).json("no user found")
    }

    let refData = await Referral.findOne({ userId: user});
    console.log("referrals")
    for(let i in refData.referralArray){
      console.log(refData.referralArray[i])
      let _id = refData.referralArray[i]

      let userTable = await User.findOne({_id: user})
    
      let date = new Date(year, month, 1), y = date.getFullYear(), m = date.getMonth();
      console.log("date = ", date)
      console.log("m = ", m)
      let firstDay = new Date(y, m, 2);
      let lastDay = new Date(y, m + 1, 0);
      console.log(firstDay)
      console.log(lastDay)
      let views = await monthlyViews.find({userId: _id, startDate: firstDay, endDate: lastDay});
      console.log("blogs = ", views)
      let pay_slip = 0
      for(let i in views){
        console.log(views[i].viewCount)
        let slot = (views[i].viewCount/1000)
        try{
          //pay_slip = paySlots.find({slot: slot}).amount
          pay_slip += 30*slot
        }
        catch(err){
          pay_slip += 0
        }
      }
      total_pay += pay_slip
      amounts.push({"user": userTable, "revenue": pay_slip})
    }
  }
  res.json({"total": total_pay, "explanation": amounts})
})

router.post("/totalEarnings", async function(req, res){
  let user = jwtVerify(req);
  console.log("user = ", user)
  console.log(user==null)
  let amounts = []
  let total_pay = 0
  if (user==null){
    amounts = []
  }
  else{
    user = user.user
    if (user==null){
      res.status(400).json("no user found")
    }
    let views;
    if (req.body.month=="yes"){
      let date = new Date(), y = date.getFullYear(), m = date.getMonth();
      let firstDay = new Date(y, m, 2);
      let lastDay = new Date(y, m + 1, 0);
      console.log("date = ", date. firstDay, lastDay)
      views = await monthlyViews.find({userId: user._id, startDate: firstDay, endDate: lastDay});
    }
    else{
      views = await monthlyViews.find({ userId: user._id });
    }
    console.log("blogs = ", views)
    for(let i in views){
      console.log(views[i].viewCount)
      let slot = (views[i].viewCount/1000)
      try{
        //pay_slip = paySlots.find({slot: slot}).amount
        pay_slip = 30*slot
        total_pay += pay_slip
      }
      catch(err){
        pay_slip = 0
      }
      amounts.push({"blog": views[i].blogId, "revenue": pay_slip})
    }
  }
  res.json({"total": total_pay, "explanation": amounts})
})


router.get("/complete_earnings", async function(req, res){
  let user = jwtVerify(req);
  console.log("user = ", user)
  console.log(user==null)
  let total = null
  let status
  if (user==null){
    amounts = []
  }
  else{
    user = user.user
    if (user==null){
      res.status(400).json("no user found")
      status = 404
    }
    let views;
    let date = new Date()
    console.log("date = ", date)
    total = await TotalEarnings.findOne({user: user._id})
    console.log("total = ", total)
    if (total==null){
      total = new TotalEarnings({
        user: user._id,
        remain: 0,
        withdraw: 0,
        updated: new Date()
      })
      total.save()
      console.log("new saved")
    }
    status = 200
  }
  res.json(total).status(status)
})

router.post("/monthly_earnings", async function(req,res){
  let userId = req.body.userId
  let month = req.body.month
  let year = req.body.year
  let date = new Date(year, month, 1), y = date.getFullYear(), m = date.getMonth();

  console.log("date = ", date)
  console.log("m = ", m)
  let firstDay = new Date(y, m, 2);
  let lastDay = new Date(y, m + 1, 0);

  console.log(firstDay)
  console.log(lastDay)

  let views = await monthlyViews.find({userId: userId, startDate: firstDay, endDate: lastDay});
  views=(views/1000)*30;
  console.log(views)
  res.json(views).status(200)
})

router.post("/monthlyViews", async function(req, res){
  let blogId = req.body.blogId
  let views = req.body.views
  let mViews =  await monthlyViews.findOne({blogId: blogId})
  console.log(mViews)
  let date = new Date(), y = date.getFullYear(), m = date.getMonth();
  let startDate = new Date(y, m, 2);
  let endDate = new Date(y, m + 1, 0);
  let userId = await Blog.findOne({_id: blogId})
  console.log("user_id = ", await userId)
  console.log("user_id = ", await userId.userId)

  if(mViews!=null)
  {
    console.log("its there")
    mViews.viewCount = views
    mViews.save()
    console.log("79 = ", mViews)
  }
  else{
    new_views = new monthlyViews({
      blogId: blogId,
      userId: await userId.userId,
      viewCount: views,
      startDate: startDate,
      endDate: endDate
    })
    new_views.save()
    console.log("new saved")
  }
  //monthlyViews.update(
  //  {blogId: blogId},
  //  {$set: {
  //    viewCount: views
  //  }}
  //)}
  res.status(200).json({ message: "update succesfully"})
})

module.exports = router