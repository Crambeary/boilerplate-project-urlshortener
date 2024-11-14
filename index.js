require("dotenv").config();
const express = require("express");
const cors = require("cors");
const dns = require("node:dns");
const app = express();
const bodyParser = require("body-parser");
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
  ShortURL.find({}).sort('-short_url').limit(1).exec((err, data) => {
    done(err, data);
  });
}

const createAndSaveShortURL = (original_url, done) => {
  findLatestID((err, data) => {
    let short_url = parseInt(data[0].short_url) + 1;
    ShortURL.create({
      url: original_url,
      short_url: short_url,
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
  });
}

app.use(bodyParser.urlencoded({ extended: false }));

app.post("/api/shorturl", function (req, res) {
  console.log("received", req.body.url);
  let url = new URL(req.body.url).hostname;
  console.log("test", url);
  dns.lookup(url, function (err, data) {
    console.log("error", err);
    console.log("ip", data);
    if (!err) {
      console.log("success");
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
      res.json( { "error": "invalid url" });
    }
  });
});

app.get("/api/shorturl/:id", function (req, res) {
  const id = parseInt(req.params.id);
  ShortURL.findOne({"short_url": id}).exec((err, data) => {
    if (err) {
      res.json({  "error": err })
    } else if (!isNaN(data.url)) {
      res.json({ "url_error": "isNumber", "error": err , "data": data});
    } else {
      res.status(301).redirect(data.url);
    }
  })
});

app.listen(port, function () {
  console.log(`Listening on port ${port}`);
});
