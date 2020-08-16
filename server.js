const express = require("express");
const app = express();
const bodyParser = require("body-parser");
const cors = require("cors");
const PORT = process.env.PORT || 4000;
const mongoose = require("mongoose");
const axios = require("axios");

require("dotenv").config();

mongoose.connect(
  "mongodb+srv://rma2002:" +
    process.env.ATLAS_PASS +
    "@cluster0-omtan.mongodb.net/osuproject?retryWrites=true&w=majority",
  {
    useNewUrlParser: true,
  }
);

var TimeSchema = new mongoose.Schema({
  day: String,
  time: String,
  oneDigitpp: Number,
  twoDigitpp: Number,
  threeDigitpp: Number,
  fourDigitpp: Number,
});
const PPOverTime = mongoose.model("PPOverTime", TimeSchema);

app.use(bodyParser.json());
app.use(function (req, res, next) {
  res.header("Access-Control-Allow-Origin", "*"); // update to match the domain you will make the request from
  res.header(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content-Type, Accept"
  );
  next();
});

app.get("/", function (req, res) {
  res.send("<h1>This app is working hopefully</h1>");
});

app.get("/pp", function (req, res) {
  PPOverTime.find({}, function (error, documents) {
    res.send(documents);
  });
});

app.get("/accesstoken", function (req, res) {
  let body = {
    client_id: 2128,
    client_secret: process.env.API_KEY,
    grant_type: "client_credentials",
    scope: "public",
  };
  axios.post("https://osu.ppy.sh/oauth/token", body).then((response) => {
    res.send(response.data.access_token);
  });
});

app.listen(PORT, function () {
  console.log("Server is running on Port: " + PORT);
});
