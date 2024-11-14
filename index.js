require("dotenv").config();
const express = require("express");
const cors = require("cors");
const dns = require("node:dns");
const bodyParser = require("body-parser");
const app = express();
const mongoose = require('mongoose')

// Basic Configuration
const port = process.env.PORT || 3000;

app.use(cors());

app.use("/public", express.static(`${process.cwd()}/public`));

app.get("/", function (req, res) {
  res.sendFile(process.cwd() + "/views/index.html");
});

// Your first API endpoint
app.get("/api/hello", function (req, res) {
  res.json({ greeting: "hello API" });
});

// TODO: setup mongodb connection
mongoose.connect(
    process.env.MONGO_URI,
    {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      useCreateIndex: true,
      dbName: process.env.MONGO_DB_NAME
    });
// setup schema
const urlSchema = new mongoose.Schema({
  url: {
    type: String,
    required: true,
  },
  short_url: {
    type: Number,
    required: true,
    index: true,
    unique: true
  }
});
// setup model
let ShortURL = mongoose.model('short_url', urlSchema);

const findLatestID = (done) => {
  ShortURL.find('id');
}

const createAndSaveShortURL = (original_url, done) => {
  ShortURL.create({
    url: original_url,
    short_url: 2
  }, function(err, data) {
    if (err) {
      if (err.code === 11000) { // duplicate key
        console.log(err);
        done(err, data);
      }
    } else {
      done(null, data);
    }
  });
}

app.use(bodyParser.urlencoded({ extended: false }));

app.post("/api/shorturl", function (req, res) {
  dns.lookup(req.body.url, function (err, data) {
    console.log(data); // DNS resolved IP address
    if (!err) {
      // get the last entry from mongodb for id
      // increment id
      // post new url to mongodb, { id: Number, url: "String" }
      // TODO: place DB id in the short_url response.
      createAndSaveShortURL(req.body.url, (err, data) => {
        if (err) {
          console.log(err);
          if (err.code === 11000) {
            res.json({ "internal error": "duplicate key", "error": err });
          } else {
            res.json({ "error": err });
          }
        } else {
          console.log(data);
          res.json({"original_url": req.body.url, "short_url": data.short_url});
        }
      });
    } else {
      res.json( {"error": "invalid url" });
    }
  });
});

app.get("api/shorturl/:id", function (req, res) {
  return null; // find in db the matching id and show the matching url in json
});

app.listen(port, function () {
  console.log(`Listening on port ${port}`);
});
