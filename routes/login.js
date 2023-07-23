const express = require("express");
const router = express.Router();
const passport = require("passport");
const jwt = require("jsonwebtoken");

const { User, Referral} = require("../models.js");

const multer = require("multer");
const { S3Client, PutObjectCommand } = require("@aws-sdk/client-s3");

const s3 = new S3Client({
  region: process.env.BUCKET_REGION,
  credentials: {
    accessKeyId: process.env.ACCESS_KEY,
    secretAccessKey: process.env.SECRET_ACCESS_KEY,
  },
});

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

  console.log(name, email, picture)
  let msg
  let user = await User.findOne({email: email})
  let key = "already saved"

  console.log("user = ", user)

  if(user){
    console.log("user found")
    msg = 0
  }
  else{
    msg = 1
    console.log("user not found")
    const referralId = Math.floor(Math.random() * 10000000);
    user = new User({
      username: name,
      role: "writer",
      email: email,
      referral: referralId
    })

    const randomstring = Math.random().toString(36).slice(-8);

    const registeredUser = await User.register(user, randomstring);

    const referral = new Referral({
      userId: registeredUser._id,
      hisReferral: referralId,
    });
    await referral.save();

    if (req.body.referral !== undefined) {
      await Referral.updateOne(
        { hisReferral: req.body.referral },
        { $push: { referralArray: registeredUser } }
      );
    }

    const Key = `profile/images/${user._id}/profile.jpeg`;

    const res = await fetch(picture)
    const blob = await res.arrayBuffer()

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
      _id: user._id, 
      success: msg,
      url: key,
      token: token
    });
  })
})

router.post("/login", function (req, res) {
  console.log("in login")
  console.log("body = ", req.body)
  const user = new User({
    username: req.body.username,
    password: req.body.password,
  });
  console.log("user = ", user)
  req.login(user, function (err) {
    if (!err) {
        User.findOne(
          { $or: [{ username: user.username }, { email: user.username }] },
          (err, user) => {
            jwt.sign({ user: user }, "secretkey", (err, token) => {
              console.log("token = ", token)
            res.status(200).json({"user": user, "token": token});
          });
        }
        );
      }
      else {
        res.status(404).json({ message: "username or password is wrong" });
    }
  })
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
