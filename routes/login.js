const express = require("express");
const router = express.Router();
const passport = require("passport");
const jwt = require("jsonwebtoken");
const jwtVerify = require("./jwt")

const verification = require("./verification");

const { User, Referral, socialReg, socialShare, ipSetTable, transporter} = require("../models.js");

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
      verified: 0,
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
    req.session.token = token
    res.status(200).json({
      _id: encrypt(user._id),
      success: msg,
      url: key,
      token: token
    });
  })
})

router.post("/login", async function (req, res) {
  //console.log("in login")
  //console.log("body = ", req.body)
  const user = new User({
    username: req.body.username,
    password: req.body.password,
    email: req.body.email
  });
  console.log("user = ", user)
  console.log("user = ", await User.findOne({ username: user.username }))
  console.log("user = ", await User.findOne({ email: user.username }))
  console.log("user = ", await User.findOne({ $or: [{ username: user.username }, { email: user.username }] }))
        user_obj = User.findOne(
          { $or: [{ username: user.username }, { email: user.username }] },
          (err, user) => {
            console.log("user = ", user)
            if (user==null){
              res.status(404).json("No User found with this Email or Username")
            }
            else{
              console.log(user==null)
              user = user.toObject()
              console.log("password = ", user.password)
              bcrypt.compare(req.body.password, user.password).then(function(result) {
                // result == true
                //console.log("result = ", result)
                if (result==true){
                  jwt.sign({ user: user }, "secretkey", (err, token) => {
                    console.log("token = ", token)
                    req.session.token = token
                    user["_id"] = encrypt(user._id)
                    console.log(user._id)
                    console.log(encrypt(user._id))
                  res.status(200).json({"user": user, "token": token});
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
        }
        );
        console.log("user at end of login = ", user_obj)
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

router.post("/email-verification", async function (req, res) {
  let userid = jwtVerify(req)
  try{
    let url = `https://autumnkurenai.com/email-verification?time=${Date.now()}&user=${encrypt(userid.user._id)}`
    const mailData = {
      from: "autumnkurenai@gmail.com",
      //to: user.email,
      to: await userid.user.email,
      subject: "Email Verification",
      html: verification(url),
    };

    await transporter.sendMail(mailData);
    res.status(200).json("email sent")
  }
  catch(err){
    res.status(404).json(`user could not be verified - ${err}`)
  }
})


router.get("/email-verification", async function (req, res) {
  let code = req.query.code
  let user_id = req.query.user
  let time = req.query.time
  console.log("timestamp = ", Date.now())
  let valid = Math.floor((Date.now() - parseInt(time)) / 1000)/60

  try{
    user_id = decrypt(user_id)
  }
  catch(err){
    console.log("Err = ", err)
    res.status(200).json("Link is not valid")
  }

  let user = await User.findOne({_id: user_id});

  user.verified = true

  user.save()

  console.log("valid = ", valid)

  if (valid <15){    
    res.status(200).json("Successfuly Verified")
  }
  else {
    res.status(400).json("link has already expired")
  }
})

router.post("/checkEmailVerification", async (req, res) => {
  try {
    console.log(req.body.userId);
    const userId = req.body.userId;
    const decryptedUserId = decrypt(userId);
    console.log(decryptedUserId);

    const user = await User.findOne({ _id: decryptedUserId });

    if (user && user.verified === true) {
      res.json(true);
    } else {
      res.json(false);
    }
  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});
