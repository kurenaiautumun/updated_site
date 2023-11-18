const express = require("express")
const jwt = require("jsonwebtoken");

const router = express.Router();

function verifyToken(req, res, next) {

    const bearerHeader = req.headers["authorization"];
  
    if (typeof bearerHeader !== "undefined") {
  
      const bearerToken = bearerHeader.split(" ")[1];
  
      req.token = bearerToken;
  
      next();
  
    } else {
  
      res.sendStatus(403);
  
    }
  
  }
  
  function jwtVerify(req){

    //console.log("jet started")

    let data = null

    let bearerHeader;
    let bearerToken;

    try{
      bearerHeader = req.headers["authorization"];
      bearerToken = bearerHeader.split(" ")[1];
    }

    catch(err){
     bearerToken = req.session.token 
    }
  
    if (typeof bearerToken !== "undefined") {


      //console.log("token = ", bearerHeader)

      jwt.verify(bearerToken, "secretkey", (err, authData) => {
  
        if (err) {

            //console.log("err = ", err)
            return null
    
        } else {
            //console.log("verified")
            data = authData
    
        }
    
      });
  
    } else {
        data = null
    }

    console.log("end of jwt verify")

    return data
  
  };

module.exports = jwtVerify