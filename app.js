require('dotenv').config();
const express = require("express");
const ejs = require("ejs");
const cors = require('cors');
const mongoose = require('mongoose');
const passport = require("passport");
const session = require('express-session');
const passportLocalMongoose = require("passport-local-mongoose");


const app = express();
app.set('view engine', 'ejs');
app.use(express.json());
app.use(express.static("public"));
app.use(express.urlencoded({extended: true}));

const corsOptions = {
  origin:'*', 
  credentials:true, 
  optionSuccessStatus:200,
}

app.use(cors(corsOptions))
app.use(session({
  secret:  process.env.SECRET,
  resave: false,
  saveUninitialized: false
}));
app.use(passport.initialize());
app.use(passport.session());


mongoose.set('strictQuery', true);
mongoose.connect(process.env.MONGOLAB_URI, {useNewUrlParser: true});

const  userSchema = new mongoose.Schema({
  username:String,
  email:String,
  password: String
});

userSchema.plugin(passportLocalMongoose);

const User = new mongoose.model("User",userSchema);

passport.use(User.createStrategy());

passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());


app.get("/",(req,res)=>{
    res.render("index")
})

app.get("/dashboard",(req,res)=>{
  // let user = req.query.user
  if(req.isAuthenticated()){
    res.render("dashboard",{username:"swqayam"})
}else{
    res.redirect("/login");
}
})

app.get("/register",function(req,res){
  res.render("register");
})

app.get("/login",(req,res)=>{
  res.render("login");
})

app.post("/signup",function(req,res){
  console.log(req.body)
  User.register({username:req.body.username,email:req.body.email}, req.body.password,
    function(err,user){
    if(err){
      console.log(err);
      res.redirect("/index");
    }else{
      passport.authenticate("local")(req,res,function(){
        res.redirect("/dashboard");
      })
    }
  })
});

app.post("/login",function(req,res){
  const user = new User({
    username: req.body.username,
    password: req.body.password
  });

  req.login(user, function(err){
  if(err) throw err;
    passport.authenticate("local")(req,res,function(){
      res.redirect("/dashboard");
    })
  })
})



app.listen(process.env.PORT, function() {
  console.log(`Server started on http://localhost:${process.env.PORT}`);
});



//PORT=5000
//MONGOLAB_URI=mongodb://localhost/