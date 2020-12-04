const express = require ('express');
const app = express ();
const bodyParser = require ('body-parser');
const cors = require ('cors');
const PORT = process.env.PORT || 4000;
const mongoose = require ('mongoose');
const axios = require ('axios');

require ('dotenv').config ();

mongoose.connect (
  'mongodb+srv://rma2002:' +
    process.env.ATLAS_PASS +
    '@cluster0-omtan.mongodb.net/osuproject?retryWrites=true&w=majority',
  {
    useNewUrlParser: true,
  }
);

var TimeSchema = new mongoose.Schema ({
  day: String,
  time: String,
  oneDigitpp: Number,
  twoDigitpp: Number,
  threeDigitpp: Number,
  fourDigitpp: Number,
});
const PPOverTime = mongoose.model ('PPOverTime', TimeSchema);

app.use (bodyParser.json ());
app.use (function (req, res, next) {
  res.header ('Access-Control-Allow-Origin', '*'); // update to match the domain you will make the request from
  res.header (
    'Access-Control-Allow-Headers',
    'Origin, X-Requested-With, Content-Type, Accept'
  );
  next ();
});

app.get ('/', function (req, res) {
  res.send ('<h1>This app is working hopefully</h1>');
});

// limit to returning only the last 20 entries
app.get ('/pp', function (req, res) {
  let q = PPOverTime.find ().limit (20).sort ({_id: -1});
  q.exec (function (err, data) {
    res.send (data);
  });
});

// thank you stack overflow
// some weird stuff with find and promises, luckily this post existed:
// https://stackoverflow.com/questions/20858299/model-find-toarray-claiming-to-not-have-toarray-method
const GetStuffFromDB = (query, callback) => {
  PPOverTime.find({"day": query}).exec((err, stuff) => {
    callback(err, stuff);
  })
}

// need this function because apparently the for loop that is entering values into
// the ret array in the method below, is NOT done in order, but rather asynchronous
// this means that the entry for November could come before december, for instance.
// I will order them in terms of ascending fourdigitpp requirements
// under the dubious but plausible assumption that it will increase a fair amount in a month
function compare( a, b ) {
  if ( a.fourDigitpp< b.fourDigitpp ){
    return -1;
  }
  if ( a.fourDigitpp> b.fourDigitpp ){
    return 1;
  }
  return 0;
}

const QueryForMonthlyData = (queries, callback) => {
  let ret = [];
  for (let i = 0; i < 13; i++) {
    GetStuffFromDB(queries[i], (err, vals) => {
      if (err) {
        return;
      }
      console.log(vals);
      ret.push(vals[0]);
      console.log(ret.length);
      if (ret.length === 13) {
        callback(ret);
      }
    })
  }
  
}

// so to summarize this endpoint will return an array of at most 12 objects
// representing the last 12 months' first day's data (if it exists). (0 to 12 months ago, 13 entries total needed)
app.get('/monthlypp', function(req, res) {
  // Get Todays Month + Year
  let today = new Date();
  let queries = [];
  for (let i = 0; i < 13; i++) {
    let query = today.toLocaleString("default", { month: "short" }) + " " + 1 + " " + today.getFullYear();
    queries.push(query);
    today.setMonth(today.getMonth() - 1);
  }
  
  QueryForMonthlyData(queries, (returnArray) => {
    var filtered = returnArray.filter(function(x) {
      return x !== undefined;
    });
      
      filtered.sort(compare);
      console.log(filtered);
      res.send(filtered);
    })
})

app.get ('/accesstoken', function (req, res) {
  let body = {
    client_id: 2128,
    client_secret: process.env.API_KEY,
    grant_type: 'client_credentials',
    scope: 'public',
  };
  axios.post ('https://osu.ppy.sh/oauth/token', body).then (response => {
    res.send (response.data.access_token);
  });
});

app.listen (PORT, function () {
  console.log ('Server is running on Port: ' + PORT);
});
