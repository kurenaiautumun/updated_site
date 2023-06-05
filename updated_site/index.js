var express = require('express');
var app = express();
var fs = require("fs");
var path= require("path");
var sql = require('mysql2')

const cors = require('cors');
app.use(cors({
    origin: '*'
}));

var connection = sql.createConnection({
   host:'127.0.0.1',
   user:'root',
   password:'12345',
  
});
connection.connect(function(err) {
   if (err) throw err;
   console.log("Connected!");})
   
   app.use(express.static(path.join(__dirname, 'updated_site')));


   app.use('/addDB',(req,res,next)=>{
      res.sendFile(path.join(__dirname,'index.html'));
      });
   connection.connect(function(error){
      if(!!error){
         console.log(error);
      }else {
         console.log('connected');
      }})


// app.post("/form-submit",function(req,res){
//    const username = req.body.users;
  
//   console.log("Username: " + users);

//   res.send("Data received");

// })


app.get("/addUser", function(req, res){
    data = {}
    data["data"] = user
    data["method"] = "GET"
    res.end(JSON.stringify("Hello"));
})

app.post('/addUser', function (req, res) {
   // First read existing users.
    data = {}
    data["data"] = "abhinav"
    data["method"] = "POST"
    res.end( JSON.stringify(data));
})

var server = app.listen(8080, function () {
   var host = server.address().address
   var port = server.address().port
   console.log("Example app listening at http://%s:%s", host, port)
})