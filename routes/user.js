const express = require("express");
const router = express.Router();
const { User, Referral, transporter, UserInfo } = require("../models.js");
const template = require("./template");
var ObjectId = require('mongodb').ObjectID;

const jwtVerify = require("./jwt")
const bcrypt = require("bcryptjs");

const multer = require("multer");

const crypto = require("crypto");
const { S3Client, PutObjectCommand, RedirectAllRequestsToFilterSensitiveLog } = require("@aws-sdk/client-s3");

const {encrypt, decrypt} = require("./encrypt")

const s3 = new S3Client({
  region: process.env.BUCKET_REGION,
  credentials: {
    accessKeyId: process.env.ACCESS_KEY,
    secretAccessKey: process.env.SECRET_ACCESS_KEY,
  },
});
const upload = multer(multer.memoryStorage());

router.get("/signup", function (req, res) {
  res.render("register");
});

router.post("/signup", async (req, res) => {
  try {
    const referralId = Math.floor(Math.random() * 10000000);

    let user = new User({
      username: req.body.username,
      email: req.body.email,
      role: req.body.role,
      firstName: "",
      lastName: "",
      pp: "https://kurenai-image-testing.s3.ap-south-1.amazonaws.com/logo-removebg-preview.png",
      referral: referralId,
    });


    bcrypt.hash(req.body.password, 8, async function(err, hash) {
      if(err){
        res.status(400).json("not working").end()
      }
      user.password = hash
      //user.save()

      user.save((err, user) => {
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


        if (req.body.referral != undefined) {
          console.log("in referral")
          //console.log(Referral.findOne({hisReferral: req.body.referral}))
          updateReferral(req.body.referral, registeredUser);
        }
        res.status(201).json(user);
    }
    });
  });
    
  
    const mailData = {
      from: "autumnkurenai@gmail.com",
      to: req.body.email,
      subject: "Welcome to Kurenai",
      html: template,
    };

    await transporter.sendMail(mailData);

    user._id = encrypt(user._id)


  } catch (err) {
    console.log("err = ", err)
    res.status(500).json({ error: err.message });
  }
});


async function updateReferral(id, user){
  await Referral.updateOne(
    { hisReferral: id },
    { $push: { referralArray: user } }
  );
}


//router.post("/changepassword", function (req, res) {
//  User.findByUsername(req.body.username, (err, user) => {
//    if (err) {
//      res.send(err);
//    } else {
//      user.changePassword(
//        req.body.oldpassword,
//        req.body.newpassword,
//        function (err) {
//          if (err) {
//            res.send(err);
//          } else {
//            res.send("successfully change password");
//          }
//        }
//      );
//    }
//  });
//});

//router.post("/userinfo/save", function (req, res) {
//  const userInfo = new UserInfo({
//    userId: req.body.userId,
//    body: req.body.body,
//  });
//  userInfo.save((err, info) => {
//    if (err) throw err;
//    res.status(201).json({ message: "userInfo saved", info });
//  });
//});

router.post("/userinfo", function (req, res) {
  const userId = decrypt(req.body.userId);
  User.find({ _id: userId }, (err, user) => {
    UserInfo.findOne({ userId }, (err, userInfo) => {
      //console.log(user)
      userInfo.userId = encrypt(userInfo.userId)
      res.status(201).json({ user, userInfo });
    });
  });
});


router.post("/basicUserInfo", function (req, res) {
  //console.log("id in basic user info = ", req.body.userId)
  const userId = decrypt(req.body.userId);
  //console.log("after decrypt = ", userId)
  User.find({ _id: userId }, (err, user) => {
    try{
      user[0]._id = encrypt(user[0]._id)
    res.status(201).json({ user});
    }
    catch(err){
      res.json(err).status(404)
    }
  });
});

//router.post("/changeUserInfo", function (req, res) {
//  const userId = req.body.userId;
//  const info = req.body.info;
//  User.updateOne({ _id: userId },
//    {$set: {"info": info}},
//    (err, user) => {
//      if (err){
//        //console.log(err)
//      };
//      res.status(201).json({ user});
//  });
//});
//

router.post("/userImage", upload.single("image"), async (req, res) => {
  let userId = decrypt(req.body.userId)
  if (userId == undefined) {
    res.json({ message: "please provide a valid parameters" });
  } else {
    let user = await User.findOne({_id: userId})
    let userId = user.username
    const Key = `user/images/${userId}/${req.file.originalname}`;

    const command = new PutObjectCommand({
      Bucket: process.env.BUCKET_NAME,
      Key,
      Body: req.file.buffer,
      Contenttype: req.file.mimetype,
      ACL: "public-read",
    });

    await s3.send(command);

    try {
      const id = userId;
      const { pp } = Key
      User.updateOne({ _id: id },
        {$set: {"pp": `https://kurenai-image-testing.s3.ap-south-1.amazonaws.com/${Key}`}}, 
      (error, docs) => {
        if (error) throw error;
        res
          .status(201)
          .json({ message: "User profile updated successfully", docs ,
          success: 1,
          url: `https://kurenai-image-testing.s3.ap-south-1.amazonaws.com/${Key}`,});
      });
    } catch (error) {
      //console.error(error);
      res
        .status(500)
        .json({ message: "Server error occurred while updating user profile" });
    }

  }
});


router.post("/userUpdate", async (req, res) => {
  try {
    const { username, email, info, firstName, lastName } = req.body; // assuming these are the fields the user can update

    let user = jwtVerify(req);

    //console.log("user = ", user.user)

    let id = user.user._id

    let details = await User.findOne({_id: id})

    //console.log("details = ", details)

    details.firstName = firstName
    details.lastName = lastName
    details.info = info

    details.save()

    //console.log("details = ", details)
      res
        .status(201)
        .json({ message: "User profile updated successfully" });
    }
  catch(err){
    //console.log(err);
  }
});


router.get("/profile", async(req,res) => {
  res.render("profile")
})


router.get("/changePassword", (req, res)=>{
  res.render("forgotPass")
})

router.post("/resetPassword", async(req, res)=>{
  let user = await User.findOne({email: req.body.email})

  let pass = crypto.randomBytes(10).toString('hex');
  bcrypt.hash(pass, 8, function(err, hash) {
    if(err){
      res.status(400).json("not working", err)
    }
    user.password = hash
    user.save()
    const mailData = {
      from: "autumnkurenai@gmail.com",
      to: req.body.email,
      subject: "Password Change",
      html: `Your password has been successfully reset, you can use this temporary password to login - ${pass}`,
    };
    try{
      transporter.sendMail(mailData);
      res.status(200).send("registered")
    }
    catch(err){
      //console.log("Err = ", err)
    }
  });
})

router.post("/changePassword", async (req,res)=>{
  let token = jwtVerify(req);

  //console.log("user = ", token.user)
  let id = token.user._id
  
  let user = await User.findOne({_id: id})
  //console.log("pass = ", user.password)
  bcrypt.compare(req.body.old_password, user.password).then(function(result) {
    // result == true
    //console.log("result = ", result)
    if (result==true){
      bcrypt.hash(req.body.new_password, 8, function(err, hash) {
          if(err){
            res.status(400).json("not working")
          }
          user.password = hash
          user.save()
      });
    }
    else{
      res.status(404).json("Password is not Correct")
    }
  });
  res.status(200).json("Password Changed Successfully")
})


router.post("/encrypt", async (req,res)=>{
  if (req.body.text==null){
     res.status(400).json("no text provided")
  }
  else{
     res.status(200).json(encrypt(String(req.body.text)))
  }
})

router.post("/decrypt", async (req,res)=>{
  if (req.body.text==undefined){
     res.status(400).json("no text provided")
  }
  res.status(200).json(decrypt(req.body.text))
})

module.exports = router;

router.get("/duplicates", async (req, res)=>{
  let users = await User.find()
  let list = []
  
  for (let i in await users){
    //console.log("i = ", i)
    if (list.includes(users[i].email)){
      console.log("duplicate", users[i]._id, users[i].email, users[i].username)
      users[i].delete()
    }
    else{
      list.push(users[i].email)
    }
  }
  let users2 = await User.find()
  let list2 = []
  
  for (let i in await users2){
    //console.log("i = ", i)
    if (list.includes(users2[i].username)){
      console.log("duplicate", users2[i]._id, users2[i].email, users2[i].username)
      users2[i].delete()
    }
    else{
      list.push(users2[i].username)
    }
  }
  //console.log("users = ", await users)
  return res.json([list, list2])
})