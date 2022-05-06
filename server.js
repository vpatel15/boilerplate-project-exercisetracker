const express = require('express')
const app = express()
const cors = require('cors')
const bodyParser = require("body-parser")
const mongoose = require("mongoose")
mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true });

const randHex = "abcdef0123456789"
const {Schema} = mongoose;
const userSchema = new Schema({
  username:String,
  _id: String,
  count: Number,
  log: [ {description: String,
         duration: Number,
         date: String}
        ]      
})

const User = mongoose.model("User", userSchema);
User.deleteMany({}, function(err,data){
  console.log("deleted");
})
app.use(bodyParser.urlencoded({extended: false}))
require('dotenv').config()

app.use(cors())

app.use(express.static('public'))

app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html')
});

app.post('/api/users', (req, res) => {
  //User.remove({}, function(err,data){});
  let id = "";
  for (let i = 0; i < 24; i++){
    id += randHex[Math.floor(Math.random()*16)];
  }
  //console.log(id);
  res.json({username: req.body.username, _id: id})
  let newUser = new User({
    username: req.body.username,
    _id: id,
    count: 0,
    log: []
  })
  newUser.save((err,data) => {
    //console.log(data);
  });
});

app.get('/api/users', (req, res) => {
  User.find({}, (err,data) => {
    let usersArr = [];
    data.forEach(function(user) {usersArr.push({username: user.username, _id: user._id})});
    res.send(usersArr);
    //console.log(usersArr);
  });
  
});

app.post('/api/users/:_id/exercises', (req, res) => {
  let date = new Date();
  if(req.body.date){
    date = new Date(req.body.date);
  }
  let dateStr = date.toDateString();
    User.findOne({_id:req.params._id},                                 function(err,data){
      //console.log("data");
      data.count ++;
      data.log.push({description:                                         req.body.description,
                    duration:                                             parseInt(req.body.duration,10),                       date: dateStr
      });
      //console.log(data);
      data.save(function(err,data){});
      res.send({
        username: data.username,
        description: req.body.description,
        duration: parseInt(req.body.duration,10),
        date: dateStr,
        _id: data._id
      });
    });
});

function fromToLog(arr,from,to,limit){
  //console.log("arr");
  
  let fromDate = new Date(from);
  let toDate = new Date(to);
  console.log([fromDate,toDate,limit]);
  let fromToArr = [];
  let counter = 0;
  if (!limit){
    limit = arr.length;
  }
  if (fromDate == "Invalid Date" || toDate == "Invalid Date"){
    while (counter < limit){
      fromToArr.push(arr[counter]);
      counter++;
    }
  }
  else{
    
    for (let i = 0; i < arr.length; i++){
      let currentDate = new Date(arr[i].date);
      if (currentDate.getTime() > fromDate.getTime()            && toDate.getTime() > currentDate.getTime())      {
        if (counter < limit){
          fromToArr.push(arr[i]);
        }
        counter++;
      }
    }
  }
  console.log("fromToArr");
  console.log(fromToArr);
  return fromToArr;
}

/*app.get('/api/users/:_id/logs?from=fromD&to=toD&limit=L', (req, res) => {
  console.log("Logs from to limit")
  
});*/

app.get('/api/users/:_id/logs',(req, res) => {
  if(req.query.from || req.query.to ||                     req.query.limit){
    //console.log("Logs from to limit");
    //console.log(req.query);
    let limit = 0;
    if(req.query.limit){
      limit = parseInt(req.query.limit,10);
    }
    User.findOne({_id:req.params._id},                                 function(err,data){
      console.log("Log array");
      console.log(data.log.toObject());
      let logMod = fromToLog(data.log.toObject(),                                  req.query.from,                                       req.query.to,                                         limit);
      console.log("response");
      /*console.log({
        username: data.username,
        count: data.count,
        _id: data._id,
        log: logMod
      });*/
      res.json({
        username: data.username,
        count: data.count,
        _id: data._id,
        log: logMod
      });
    });
  }
  else{
    User.findOne({_id:req.params._id},                                 function(err,data){
    //console.log("data logs");
    //console.log(data);
      res.send({
        username: data.username,
        count: data.count,
        _id: data._id,
        log: data.log
      });
    });
  }
});



const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port)
})