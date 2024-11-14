require("dotenv").config();
const express = require("express");
const cors = require("cors");
const app = express();

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

app.post("api/shorturl", function (req, res) {
  return null; // code here for sending the url to db and getting id for json response
});

app.get("api/shorturl/:id", function (req, res) {
  return null; // find in db the matching id and show the matching url in json
});

app.listen(port, function () {
  console.log(`Listening on port ${port}`);
});
