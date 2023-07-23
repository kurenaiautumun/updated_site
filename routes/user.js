const express = require("express");
const router = express.Router();
const { User, Referral, transporter, UserInfo } = require("../models.js");
const template = require("./template");
var ObjectId = require('mongodb').ObjectID;

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

router.get("/signup", function (req, res) {
  res.render("register");
});

router.post("/signup", async (req, res) => {
  try {
    const referralId = Math.floor(Math.random() * 10000000);

    const user = new User({
      username: req.body.username,
      email: req.body.email,
      role: req.body.role,
      pp: "https://kurenai-image-testing.s3.ap-south-1.amazonaws.com/logo-removebg-preview.png",
      referral: referralId,
    });

    const registeredUser = await User.register(user, req.body.password);

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

    const mailData = {
      from: "autumnkurenai@gmail.com",
      to: req.body.email,
      subject: "Welcome to Kurenai",
      html: template,
    };

    // await transporter.sendMail(mailData);

    req.login(registeredUser, function (err) {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      return res.status(201).redirect("/");
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post("/changepassword", function (req, res) {
  User.findByUsername(req.body.username, (err, user) => {
    if (err) {
      res.send(err);
    } else {
      user.changePassword(
        req.body.oldpassword,
        req.body.newpassword,
        function (err) {
          if (err) {
            res.send(err);
          } else {
            res.send("successfully change password");
          }
        }
      );
    }
  });
});

router.post("/userinfo/save", function (req, res) {
  const userInfo = new UserInfo({
    userId: req.body.userId,
    body: req.body.body,
  });
  userInfo.save((err, info) => {
    if (err) throw err;
    res.status(201).json({ message: "userInfo saved", info });
  });
});

router.post("/userinfo", function (req, res) {
  const userId = req.body.userId;
  User.find({ _id: userId }, (err, user) => {
    UserInfo.findOne({ userId }, (err, userInfo) => {
      console.log(user)
      res.status(201).json({ user, userInfo });
    });
  });
});


router.post("/basicUserInfo", function (req, res) {
  const userId = req.body.userId;
  User.find({ _id: userId }, (err, user) => {
    res.status(201).json({ user});
  });
});

router.post("/changeUserInfo", function (req, res) {
  const userId = req.body.userId;
  const info = req.body.info;
  User.updateOne({ _id: userId },
    {$set: {"info": info}},
    (err, user) => {
      if (err){
        console.log(err)
      };
      res.status(201).json({ user});
  });
});


router.post("/userImage", upload.single("image"), async (req, res) => {
  if (req.body.userId == undefined) {
    res.json({ message: "please provide a valid parameters" });
  } else {
    const Key = `user/images/${req.body.userId}/${req.file.originalname}`;

    const command = new PutObjectCommand({
      Bucket: process.env.BUCKET_NAME,
      Key,
      Body: req.file.buffer,
      Contenttype: req.file.mimetype,
      ACL: "public-read",
    });

    await s3.send(command);

    try {
      const id = req.body.userId;
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
      console.error(error);
      res
        .status(500)
        .json({ message: "Server error occurred while updating user profile" });
    }

  }
});


router.post("/userUpdate/:userId", async (req, res) => {
  try {
    const _id = req.params.userId;
    const { username, email } = req.body; // assuming these are the fields the user can update

    User.updateOne({ _id }, { username, email }, (error, docs) => {
      if (error) throw error;
      res
        .status(201)
        .json({ message: "User profile updated successfully", docs });
    });
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ message: "Server error occurred while updating user profile" });
  }
});


module.exports = router;
