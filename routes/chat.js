const express = require("express");
const router = express.Router();
const jwtVerify = require("./jwt")

const moment = require("moment")

var mysql = require('mysql2');


router.post("/sendMessages", async (req, res) => {
    let user = jwtVerify(req);
    let second_user = req.body.second_user
    //let date = new Date();
    //const date=new Date().toLocaleString('en-US', {timeZone: 'Asia/Kolkata'}).replace(/T/, ' ').replace(/\..+/, '')
    //const date = moment.unix(utc).tz('Asia/Kolkata').format('YYYY-MM-DD HH:mm:ss');
    options = {
        timeZone: 'Asia/Kolkata',
        "day": "2-digit",
        "hour": "2-digit",
        "minute": "2-digit",
        "second": "2-digit",
        "year": "numeric",
        "month": "2-digit"
    }
    const date = new Date().toLocaleString("en-US", options)
    console.log("date = ", date)

    date_obj = date.slice(0, 10).split("/")

    date_str = `${date_obj[2]}-${date_obj[0]}-${date_obj[1]}`

    console.log("date_str = ", date_str)

    console.log("time = ", date.slice(11,20))

    const new_date = date_str + date.slice(11,20)

    console.log("new date = ", new_date)

    const message_body = req.body.message_body

    user_id =  second_user + user.user._id //should be the user way, just doing this for testing 

    let con = mysql.createConnection({
      host: "database-1.cjesuihmj6i2.ap-south-1.rds.amazonaws.com",
      user: "admin",
      password: "UWc}lj:)p&1Mu:U&CJt]I&#m3x%8",
      database: "MESSAGES"
    });
    
    try{
        console.log("user = ", user.user._id)
        con.connect(function(err) {
            if (err){
                console.log("error = ", err)
                con.end()
            }
            else{
                //var sql = "SELECT * FROM messages WHERE dateTime BETWEEN '2000-01-01 00:00:00' AND '2002-09-18 12:00:00';"
                let sql = `INSERT INTO messages VALUES('${user_id}','${message_body}','${new_date}');`
                con.query(sql, function (err, result) {
                  if (err){
                    console.log("error = ", err)
                  }
                  else{
                    //console.log("1 record inserted, ID: " + result.insertId);
                    console.log("result = ", result)
                    return res.status(200).json("Message Sent")
                  }
                });
            }
          });
    }
    catch(err){
        console.log("error = ", err)
        res.status(404).json(`user id not provided - ${err}`)
    }
})


router.post("/getMessages", async(req, res)=>{
  let user = jwtVerify(req);
  let second_user = req.body.second_user

  let user_id = user.user._id + second_user

  let reverse_id = second_user + user.user._id

  console.log("user_id = ", user_id)

  let con = mysql.createConnection({
    host: "database-1.cjesuihmj6i2.ap-south-1.rds.amazonaws.com",
    user: "admin",
    password: "UWc}lj:)p&1Mu:U&CJt]I&#m3x%8",
    database: "MESSAGES"
  });

  try{
      console.log("user = ", user.user._id)
      con.connect(function(err) {
          if (err){
              console.log("error = ", err)
              con.end()
          }
          else{
              let sql = `SELECT * FROM messages WHERE (userID='${user_id}' OR userID='${reverse_id}') AND dateTime BETWEEN '2000-01-01 00:00:00' AND '2023-09-18 12:00:00';`
              //let sql = `INSERT INTO messages VALUES('${user_id}','${message_body}','${new_date}');`
              con.query(sql, function (err, result) {
                if (err){
                  console.log("error = ", err)
                }
                else{
                  //console.log("1 record inserted, ID: " + result.insertId);
                  console.log("result = ", result)
                  return res.status(200).json(result)
                }
              });
          }
        });
  }
  catch(err){
      console.log("error = ", err)
      res.status(404).json(`user id not provided - ${err}`)
  }
})

module.exports = router;

//CREATE TABLE messages (
//    userId varchar(255),
//    message TEXT,
//    dateTime datetime);
//
//SELECT * FROM messages WHERE dateTime BETWEEN '2000-01-01 00:00:00' AND '2002-09-18 12:00:00';