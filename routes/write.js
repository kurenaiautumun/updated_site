const express = require("express");
const { serializeUser } = require("passport");
const router = express.Router();
const { encrypt, decrypt } = require("./encrypt.js");

const {Referral, User, socialShare, viewAnalysis} = require("../models.js");

// const editor = new EditorJS({
//   holder: "editor",
//   data: jsonData,
//   readOnly: true,
//   onChange: (data) => {
//     //console.log(data);
//   },
//   onReady: (editor) => {
//     //console.log(editor);
//   },
// });

router.get("/write", (req, res) => {
  console.log("user = ", req.user)
  console.log(req.query.blogId)
  res.render("writer", { user: req.user });
  //if (req.isAuthenticated()) {
  //  res.render("writer", { user: req.user });
  //} else {
  //  res.redirect("/login");
  //}
});

router.get("/read", (req, res) => {
  //console.log("req = ", req)
  res.render("read");
});

// store an IP along with a referral code to know which referrer has got which visiter along with which blog did they reading
router.get("/socialPublicity", async (req, res)=>{
  let userId
  try{
    let ref = await Referral.findOne({hisReferral: req.query.referral})
    let user = await User.findOne({_id: await ref.userId})
    userId = await user._id
  }
  catch(err){
    userId = req.query.referral
  }

  let blogId = req.query.blogId

  social = new socialShare({
    user: await userId,
    blogId: blogId,
    ip: req.ip.toString()
  })
  social.save()
  res.json("increased").status(200)
})


//plot referrers along with the IPs or Users they have reffered
router.post("/socialShares", async (req,res)=>{
  const pageSize = 10;
  const pageNumber = req.body.pageNumber;

  const userid = req.body.user_id
  const ip = req.body.ip

  let searchArray = {ip: { $exists: true }}

  if (userid){
    const user_id = decrypt(userid)
    searchArray = {user: user_id}
  }

  if (ip){
    searchArray = {ip: ip}
  }

  console.log("searchArray = ", searchArray)

  socialShare.aggregate([
    { $match: searchArray },
    { $sort: { createdAt: -1 } },
    { $skip: pageSize * (pageNumber - 1) },
    { $limit: pageSize },
    { $group: { _id: null, count: { $sum: 1 }, items: { $push: "$$ROOT" } } },
  ]).exec((err, results) => {
    if (err) {
      console.log("err = ", err)
      res.status(400).json(err)
    }
    try{
      let { count, items } = results[0];
      const totalPages = Math.ceil(count / pageSize);
      console.log("items = ", results)
      console.log("items = ", results[0])
      for (let i in items){
        console.log("items at i = ", i, items[i])
        items[i].user = encrypt(items[i].user)
      }
      res.status(200).json({
        items,
        totalPages,
        currentPage: pageNumber,
      });
    }
    catch(err){
      res.json(err).status(400)
    }
  });

})

//Query from view analysis, what Users and IPs are reading

router.get("/analyzeIPs", async(req, res)=>{
  res.render("IP_analysis")
})
router.post("/analyzeIPs", async (req,res)=> {
  const pageSize = req.body.pageSize;
  const pageNumber = req.body.pageNumber;

  //for (let i=0; i<11; i++){
//
  //  viewAna = new viewAnalysis({
  //    blogId: Math.floor(Math.random() * 10),
  //    time: 30,
  //    ip: `::${Math.floor(Math.random() * 10)}`
  //  })
  //  viewAna.save()
  //}

  const userid = req.body.user_id
  const ip = req.body.ip

  let searchArray = {ip: { $exists: true }}

  //search about the referral array of a single user
  if (userid){
    const user_id = decrypt(userid)
    let referrals = await socialShare.find({userId: user_id})
    console.log("referrals = ", referrals)
    let referallArray = []
    for (let i in await referrals){
      referallArray.push(referrals[i].ip)
    }
    searchArray["ip"] = {$in: referallArray}
  }

  //search the search history of a single IP
  if (ip){
    searchArray["ip"] = ip
  }

  console.log("searchArray = ", searchArray)

  viewAnalysis.aggregate([
    { $match: searchArray },
    { $sort: { createdAt: -1 } },
    { $skip: pageSize * (pageNumber - 1) },
    { $limit: pageSize },
    { $group: { _id: null, count: { $sum: 1 }, items: { $push: "$$ROOT" } } },
  ]).exec((err, results) => {
    if (err) {
      res.status(400).json(err)
    }
    try{
      let { count, items } = results[0];
      const totalPages = Math.ceil(count / pageSize);
      console.log("items = ", results)
      console.log("items = ", results[0])
      //for (let i in items){
      //  console.log("items at i = ", i, items[i])
      //  items[i].userId = encrypt(items[i].userId)
      //  for (let j in items[i].referralArray){
      //    console.log("items[i].referralArray[j] = ", items[i].referralArray[j])
      //    try{
      //      items[i].referralArray[j] = items[i].referralArray[j].email
      //    }
      //    catch(err){
      //      continue
      //    }
      //  }
      //}
      res.status(200).json({
        items,
        totalPages,
        currentPage: pageNumber,
      });
    }
    catch(err){
      res.json(err).status(400)
    }
  });
})

router.post("/write", (req, res) => {
  //console.log(req.body);
});

module.exports = router;
