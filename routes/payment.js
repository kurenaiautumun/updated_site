const express = require("express");
const router = express.Router();
const { User, Referral, transporter, UserInfo, Earnings, TotalEarnings } = require("../models.js");

const jwtVerify = require("./jwt")


router.get("/all_referrals", async function(req,res){
    let user = jwtVerify(req);
  console.log("user = ", user)
  if (user){
    const refData = await Referral.find({ userId: user.user._id });
    console.log("blogs = ", refData)
    res.json(refData)
  }
  else{
    res.json(null)
  }
})

module.exports = router