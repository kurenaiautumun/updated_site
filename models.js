const mongoose = require("mongoose");
const passportLocalMongoose = require("passport-local-mongoose");
const passport = require("passport");
const nodemailer = require("nodemailer");

const userSchema = new mongoose.Schema({
  username: String,
  firstName: String,
  lastName: String,
  role: String,
  info: String,
  referral: Number,
  pp: String,
  email: String,
  password: String,
  verified: Boolean,
  followers: Array,
  following: Array,
  recommendation: Array,
  totalEarn:{type:Number,default:0},
  started: Boolean,
});

const result = userSchema.index({ email: 1 }, { unique: true })
const username = userSchema.index({ username: 1 }, { unique: true })
//console.log(`Index created: ${result}`);


const blogSchema = new mongoose.Schema({
  title: String,
  keys: Array,
  body: Object,
  category: String,
  userId: String,
  author: String,
  meta: String,
  viewCount: { type: Number, default: 0 },
  status: String,
  date: String,
  tags: [String],
  readTime: Number,
  likes: Array,
  likeCount: Number, //Go simple first
  reviewer: Array,
  group: String,
  recommendation: Array,
  titleImage: String,
  slot:{type:String,default:0},
  totalTimeSpent:{
    type:Number,
    default:0
  }
});

const LikedBlogsSchema = new mongoose.Schema({
  userId: String,
  blogId: String,
  tag: Array
})

const StoriesSchema = new mongoose.Schema({
  title: String,
  author: String,
  user: String,
  chapters: Object,
  titleImage: String,
  finished: Boolean,
  tags: [String]
})

const storyName = StoriesSchema.index({ title: 1 }, { unique: true })

const commentSchema = new mongoose.Schema({
  userId: String,
  blogId: String,
  body: String,
  status: String,
  date: String,
  username: String,
});

const reviewSchema = new mongoose.Schema({
  blogId: String,
  userId: String,
  body: String,
  score: Number,
  date: String,
});

const userInfoSchema = new mongoose.Schema({
  userId: String,
  body: Object,
});

const competitionSchema = new mongoose.Schema({
  competitionName: String,
  blogId: Array,
  threshold: Number,
  prize: Array,
  status: String,
  startDate: String,
  endDate: String,
});

const rankingSchema = new mongoose.Schema({
  userId: String,
  blogId: String,
  viewCount: { type: Number, default: 0 },
  competitionId: String,
  rank: Number,
  qulified: Boolean,
});

const referralSchema = new mongoose.Schema({
  userId: String,
  referralArray: Array,
  hisReferral: Number
});

const earningsSchema = new mongoose.Schema({ //How much one blog is earning in a month
  userId: String,
  blogId: String,
  earned: Number,
  ViewCount: Number,
  startDate: String,
  endDate: String
})

const userEarnings = new mongoose.Schema({
  userId: String,
  reads: Number,
  blogs: Number,
  startDate: String,
  endDate: String
})

const viewAnalysisSchema = new mongoose.Schema({
  userId: String,
  blogId: String,
  time: Number,
  ip: String
})

const userViewCount = new mongoose.Schema({
  userId: String,
  blogId: String,
  //count: Number,
  ip: String,
  date: Date,
  author: String
})

const totalEarningsSchema = new mongoose.Schema({
  user: String,
  remain: Number,
  withdraw: Number,
  total: Number,
  updated: Date,
})

const referralEarningsSchema = new mongoose.Schema({ // Keeping it separate from wallet and everything
  user: String,
  referralArray: Array,
  hisReferral: Number
})

const paySlotsSchema = new mongoose.Schema({
  slot: Number,
  amount: Number
})

const corsOptions = {
  origin: "*",
  credentials: true,
  optionSuccessStatus: 200,
};


const monthlyViewsSchema = new mongoose.Schema({
  viewCount: Number,
  blogId: String,
  userId: String,
  startDate: String,
  endDate: String
})

const walletSchema = new mongoose.Schema({
  amount: Number,
  userId: String,
})


const popularBlogsSchema=new mongoose.Schema({
  tag:String,
  totalCount:Number
})


const socialShareSchema = new mongoose.Schema({
  user: String,
  ip: String,
  blogId: String
})

const socialUserReg = new mongoose.Schema({
  user: String,
  referrer: String
})


const ipSet = new mongoose.Schema({
  userId: String,
  ip: String
})

function toggle(arr, elem) {
  const index = arr.indexOf(elem);
  if (index !== -1) {
    arr.splice(index, 1);
  } else {
    arr.push(elem);
  }
}

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: "autumnkurenai@gmail.com",
    pass: process.env.PASSWORD,
  },
});

const date = new Date().toLocaleDateString();
const User = new mongoose.model("User", userSchema);
const Blog = new mongoose.model("blog", blogSchema);
const Comment = new mongoose.model("comment", commentSchema);
const Review = new mongoose.model("review", reviewSchema);
const UserInfo = new mongoose.model("userinfo", userInfoSchema);
const Competition = new mongoose.model("competition", competitionSchema);
const Ranking = new mongoose.model("ranking", rankingSchema);
const Referral = new mongoose.model("raferral", referralSchema);
const popularBlogs =new mongoose.model("popularblogs",popularBlogsSchema);
const TotalEarnings = new mongoose.model("TotalEarnings", totalEarningsSchema)
const Earnings = new mongoose.model("earnings", earningsSchema)
const paySlots = new mongoose.model("paySlots", paySlotsSchema)

const monthlyViews = new mongoose.model("monthlyViews", monthlyViewsSchema)

const viewAnalysis = new mongoose.model("viewAnalysis", viewAnalysisSchema)

const socialShare = new mongoose.model("socialShare", socialShareSchema)

const socialReg = new mongoose.model("socialReg", socialUserReg)

const ipSetTable = new mongoose.model("ipSet", ipSet)
date, User, Blog, monthlyViews, viewAnalysis,popularBlogs
const Story = new mongoose.model("stories", StoriesSchema)

const userViewCounts = new mongoose.model("userViewCounts", userViewCount)
const userMonthlyEarnings = new mongoose.model("userMonthlyEarnings", userEarnings)
const referralEarnings = new mongoose.model("referallEarnings", referralEarningsSchema)

const LikedBlogs = new mongoose.model("LikedBlogs", LikedBlogsSchema) // To know what blogs are liked by which user

//passport.use(User.createStrategy());
//passport.serializeUser(User.serializeUser());
//passport.deserializeUser(User.deserializeUser());

module.exports = {
  date,
  User,
  Blog,
  Comment,
  corsOptions,
  Review,
  UserInfo,
  Competition,
  Ranking,
  Referral,
  popularBlogs,
  toggle,
  transporter,
  Earnings,
  TotalEarnings,
  paySlots,
  monthlyViews,
  viewAnalysis,
  socialShare,
  socialReg,
  ipSetTable,
  Story,
  userViewCounts,
  userMonthlyEarnings,
  referralEarnings,
  LikedBlogs
};

