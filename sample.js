var express = require('express');
var app = express();
var fs = require("fs");

const { exec } = require('child_process');

const cors = require('cors');
app.use(cors({
    origin: '*'
}));


app.post("/gitTrigger", function(req, res){
    data = {}
    data["method"] = "GET"
    exec('git pull; npm i', (err, stdout, stderr) => {
      if (err) {
        console.log("command could not be executed")
        return;
      }
    
      // the *entire* stdout and stderr (buffered)
      console.log(`stdout: ${stdout}`);
      console.log(`stderr: ${stderr}`);
    });
    res.end(JSON.stringify("git triggerred"));
})

app.get("/", function(req, res){
   data = {}
   data["method"] = "GET"
   res.end(JSON.stringify("Hello"));
})

app.get("/extra", function(req, res){
   data = {}
   data["method"] = "GET"
   res.end(JSON.stringify("Extra"));
})

var server = app.listen(3000, function () {
   var host = server.address().address
   var port = server.address().port
   console.log("Example app listening at http://%s:%s", host, port)
})