const express = require("express");
const router = express.Router();
const passport = require("passport");
const jwt = require("jsonwebtoken");

const { User, Referral, socialReg, socialShare, ipSetTable} = require("../models.js");

const multer = require("multer");
const { S3Client, PutObjectCommand } = require("@aws-sdk/client-s3");

const bcrypt = require("bcryptjs");
const {encrypt, decrypt} = require("./encrypt")

const s3 = new S3Client({
  region: process.env.BUCKET_REGION,
  credentials: {
    accessKeyId: process.env.ACCESS_KEY,
    secretAccessKey: process.env.SECRET_ACCESS_KEY,
  },
});

const crypto = require("crypto");

const upload = multer(multer.memoryStorage());

//Referrer-Policy: no-referrer-when-downgrade. for google login localhost

router.get("/login", (req, res) => {
  res.render("login");
});

router.get("/google", (req, res) => {
  res.render("google");
});

router.post("/googleLogin", upload.single("image"), async function(req, res){
  const name = req.body.name
  const email = req.body.email
  const picture = req.body.picture

  //console.log(name, email, picture)
  let msg
  let user = await User.findOne({email: email})
  let key = "already saved"

  //console.log("user = ", user)

  if(user){
    //console.log("user found")
    try{
      let ip_analysis = await ipSetTable({
        userId: await user._id,
        ip: req.ip
      })
      ip_analysis.save()
    }
    catch(err){
      console.log("IP could not be caught")
    }
    msg = 0
  }
  else{
    msg = 1
    //console.log("user not found")
    const referralId = Math.floor(Math.random() * 10000000);
    let name1 = name
    let names = await User.find({ "username": { "$regex": `${name}`, "$options": "i" }})

    console.log("names = ", await names)

    for (let i in await names){
      console.log("in count")
      name1 = `${name}${i}`
    }
    console.log("name1 = ", await name1)
    user = new User({
      username: await name1,
      role: "writer",
      email: email,
      referral: referralId
    })

    console.log("user = ", user)

    let pass = crypto.randomBytes(10).toString('hex');

    bcrypt.hash(pass, 8, async function(err, hash) {
      if(err){
        console.log("err in bcrypt = ", err)
        res.status(400).json("not working").end()
      }
      user.password = hash
      //user.save()

      user.save(async (err, user) => {
        if (err){
          console.log("err = ", err)
          if(err.toString().includes("username")){
            res.status(400).json(`User with this Username already exists`)
          }
          else{
            res.status(400).json(`User with this Email address already exists`)
          }
        }
        else{
          console.log("user saved - ", user)
        console.log(req.body.username)

        const registeredUser = user

      console.log("registered user = ", registeredUser)

        //console.log("referall")
        //console.log("id = ", registeredUser._id)
        const referralId = Math.floor(Math.random() * 10000000);
        try{
          const referral = new Referral({
            userId: registeredUser._id,
            hisReferral: referralId,
          });
          referral.save();
          console.log("referral = ", referral)
      }
      catch(err){
        console.log("error = ", err)
        res.status(404).json("referral table could not be set up")

      }
      try{
        let refferer = await socialShare.findOne({ip: req.ip})
        reg = socialReg({
          user: registeredUser._id,
          referrer: await refferer.user
        })
        reg.save()
      }
      catch(err){
        console.log("New visitor")
      }
      try{
        let ip_analysis = ipSetTable({
          userId: registeredUser._id,
          ip: req.ip
        })
        ip_analysis.save()
      }
      catch(err){
        console.log("IP could not be caught")
      }
        res.status(201).json(user);
    }
    });
  });

    const Key = `profile/images/${user.username}/profile.jpeg`;

    const res_pic = await fetch(picture)
    const blob = await res_pic.arrayBuffer()

    const command = new PutObjectCommand({
      Bucket: process.env.BUCKET_NAME,
      Key,
      Body: await blob,
      ACL: "public-read",
    });

    await s3.send(command);

  key = `https://kurenai-image-testing.s3.ap-south-1.amazonaws.com/${Key}`
  user.pp = key
  user.save()
  }
  jwt.sign({ user: user }, "secretkey", async(err, token) => 
  {
    res.status(200).json({
      _id: encrypt(user._id),
      success: msg,
      url: key,
      token: token
    });
  })
})

router.post("/login", function (req, res) {
  //console.log("in login")
  //console.log("body = ", req.body)
  const user = new User({
    username: req.body.username,
    password: req.body.password,
  });
  //console.log("user = ", user)
        User.findOne(
          { $or: [{ username: user.username }, { email: user.username }] },
          (err, user) => {
            //console.log("user = ", user)
            //console.log("password = ", user.password)
            bcrypt.compare(req.body.password, user.password).then(function(result) {
              // result == true
              //console.log("result = ", result)
              if (result==true){
                jwt.sign({ user: user }, "secretkey", (err, token) => {
                  //console.log("token = ", token)
                  //let n_user = user
                  //n_user._id = encrypt(n_user._id)
                  console.log(user)
                  //console.log(encrypt(n_user._id))
                res.status(200).json({"user": encrypt(user._id), "token": token});
              });
              }
              else{
                res.status(400).json("Wrong Username/Email or Password Combination")
              }
            });
            try{
              let ip_analysis = ipSetTable({
                userId: user._id,
                ip: req.ip
              })
              ip_analysis.save()
            }
            catch(err){
              console.log("IP could not be caught")
            }
        }
        );
});

router.get("/api", (req, res) => {

  res.json({

    message: "Hey, there! Welcome to this API service"

  });

});


router.get("/authenticated", (req, res) => {
  if (req.isAuthenticated()) {
    res.json({ auth: true });
  } else {
    res.json({ auth: false });
  }
});

router.post("/logout", function (req, res, next) {
  req.logout(function (err) {
    if (err) {
      return next(err);
    }
    res.status(201).json({ message: "user logout successfully" });
  });
});

module.exports = router;
