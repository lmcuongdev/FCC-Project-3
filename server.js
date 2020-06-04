"use strict";

var express = require("express");
const dns = require("dns");
const bodyParser = require("body-parser");

var cors = require("cors");

var app = express();

// Basic Configuration
var port = process.env.PORT || 3000;

/** this project needs a db !! **/

// mongoose.connect(process.env.DB_URI);

app.use(cors());

app.use(bodyParser.urlencoded({ extended: false }));

/** this project needs to parse POST bodies **/
// you should mount the body-parser here

app.use("/public", express.static(process.cwd() + "/public"));

app.get("/", function (req, res) {
  res.sendFile(process.cwd() + "/views/index.html");
});

// your first API endpoint...
app.get("/api/hello", function (req, res) {
  res.json({ greeting: "hello API" });
});

const ar = [];

app.get("/api/shorturl/:x", (req, res) => {
  const { x } = req.params;
  const num = parseInt(x);
  if (isNaN(num) || num === 0) {
    res.json({ error: "Wrong format" });
  } else {
    if (num <= ar.length) {
      res.redirect(ar[num - 1]);
    } else {
      res.json({ error: "No short URL found for the given input" });
    }
  }
  console.log(num);
});

app.post("/api/shorturl/new", (req, res) => {
  const { url } = req.body;
  console.log(url);
  const index = ar.indexOf(url);
  if (index !== -1) {
    res.json({ original_url: ar[index], short_url: index + 1 });
  } else {
    const urlReg = new RegExp(/^https?:\/\/www\.(\w+)(\.[a-z]+)+(\/(\w+)*)*/i);
    if (urlReg.test(url)) {
      ar.push(url);
      res.json({ original_url: url, short_url: ar.length });
    } else {
      res.json({ error: "invalid URL" });
    }
    // dns.lookup("url", (err, address, family) => {
    //   if (err) console.log(err);
    //   else {
    //     console.log(address);
    //     console.log(family);
    //   }
    // });
  }
});

app.listen(port, function () {
  console.log("Node.js listening ...");
});
