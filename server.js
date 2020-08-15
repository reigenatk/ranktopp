const express = require("express");
const app = express();
const bodyParser = require("body-parser");
const cors = require("cors");
const PORT = process.env.PORT || 4000;
const cron = require("node-cron");
const axios = require("axios");
const mongoose = require("mongoose");
const http = require("http");
require("dotenv").config();

app.use(cors());
app.use(bodyParser.json());

const server = http.createServer((req, res) => {
  res.statusCode = 200;
  res.setHeader("Content-Type", "text/html");
  res.end("<h1>Hello World</h1>");
});

mongoose.connect(
  "mongodb+srv://rma2002:alexandersam29@cluster0-omtan.mongodb.net/osuproject?retryWrites=true&w=majority",
  {
    useNewUrlParser: true,
  }
);
const connection = mongoose.connection;

connection.once("open", function () {
  console.log("MongoDB database connection established successfully");
});

var TimeSchema = new mongoose.Schema({
  day: String,

  oneDigitpp: Number,
  twoDigitpp: Number,
  threeDigitpp: Number,
  fourDigitpp: Number,
});

// create mongoose model
// capitalize collection name
const PPOverTime = mongoose.model("PPOverTime", TimeSchema);

cron.schedule("10 * * * * * ", () => {
  let today = new Date();
  let Monthago = today.getMonth();
  let Dayago = today.getDay();
  var days = function (month, year) {
    return new Date(year, month, 0).getDate();
  };
  if (Dayago == 1) {
    if (Monthago == 1) {
      console.log("Happy new year lol");
    } else {
      Monthago--;
      Dayago = days(today.getFullYear(), Monthago);
    }
  } else {
    Dayago--;
  }
  /*
  PPOverTime.user_track.remove({
    access_time: { $lt: new Date(today.getFullYear(), Monthago, Dayago) },
  });
  */
  console.log("Old Data Deleted...");
  console.log("Fetching New Data");
  let monthword = today.toLocaleString("default", { month: "short" });
  let timee = today.getHours() + ":" + today.getMinutes();
  let dayy = monthword + " " + today.getDate();
  let access_token = "";
  let body = {
    client_id: 2128,
    client_secret: process.env.API_KEY,
    grant_type: "client_credentials",
    scope: "public",
  };
  axios
    .post("https://osu.ppy.sh/oauth/token", body)
    .then((response) => {
      access_token = response.data.access_token;
      let oneDigit, twoDigit, threeDigit, fourDigit;
      oneDigit = twoDigit = threeDigit = fourDigit = 0;

      console.log("access token receieved");
      // now make a get request for each amount
      axios
        .get(
          "https://osu.ppy.sh/api/v2/rankings/osu/performance?cursor[page]=1",
          {
            headers: {
              Authorization: "Bearer " + access_token,
            },
          }
        )
        .then((response) => {
          let currentppRequired = Math.ceil(response.data.ranking[8].pp);
          oneDigit = currentppRequired;

          console.log("One digit pp acquired");

          axios
            .get(
              "https://osu.ppy.sh/api/v2/rankings/osu/performance?cursor[page]=2",
              {
                headers: {
                  Authorization: "Bearer " + access_token,
                },
              }
            )
            .then((response) => {
              let currentppRequired = Math.ceil(response.data.ranking[49].pp);
              console.log("Two digit pp acquired");
              twoDigit = currentppRequired;
              axios
                .get(
                  "https://osu.ppy.sh/api/v2/rankings/osu/performance?cursor[page]=20",
                  {
                    headers: {
                      Authorization: "Bearer " + access_token,
                    },
                  }
                )
                .then((response) => {
                  let currentppRequired = Math.ceil(
                    response.data.ranking[49].pp
                  );
                  threeDigit = currentppRequired;

                  console.log("Three digit pp acquired");
                  axios
                    .get(
                      "https://osu.ppy.sh/api/v2/rankings/osu/performance?cursor[page]=200",
                      {
                        headers: {
                          Authorization: "Bearer " + access_token,
                        },
                      }
                    )
                    .then((response) => {
                      let currentppRequired = Math.ceil(
                        response.data.ranking[49].pp
                      );
                      fourDigit = currentppRequired;

                      console.log("Four digit pp acquired");
                      let newObject = new PPOverTime({
                        day: dayy,
                        time: timee,
                        oneDigitpp: oneDigit,
                        twoDigitpp: twoDigit,
                        threeDigitpp: threeDigit,
                        fourDigitpp: fourDigit,
                      });
                      newObject.save(function (err, db) {
                        if (!err) {
                          console.log("Saved new values into DB");
                        }
                      });
                    });
                });
            });
        });
    })
    .catch((error) => {
      console.log(error);
    });
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
