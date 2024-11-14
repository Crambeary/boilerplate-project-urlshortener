require("dotenv").config();
const express = require("express");
const cors = require("cors");
const dns = require("node:dns");
const bodyParser = require("body-parser");
const app = express();
const mongoose = require('mongoose')
const url = require("node:url");

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
  let url_test = req.body.url;
  if (url_test.match(/^http.*/)) {
    url_test = url_test.replace(/(http|https):\/\/(.*)?\//, "$2");
    console.log("test", url_test);
    dns.lookup(url_test, function (err, data) {
      console.log(err);
      console.log(data); // DNS resolved IP address
      if (!err) {
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
        res.json( {"error": "invalid url" , "err": err});
      }
    });
  } else {
    res.json({"error": "invalid url"})
  }
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
