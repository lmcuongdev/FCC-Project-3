const express = require("express");
const app = express();
const bodyParser = require("body-parser");
const shortid = require("shortid");

const cors = require("cors");

const mongoose = require("mongoose");
mongoose.connect(
  /* process.env.MLAB_URI || */ "mongodb://localhost:27017/fcc4",
  { useNewUrlParser: true, useUnifiedTopology: true }
);

const db = mongoose.connection;

User = mongoose.model(
  "users",
  new mongoose.Schema(
    {
      username: { type: String, unique: true },
      _id: {
        type: String,
        default: shortid.generate,
      },
      log: [
        {
          description: String,
          duration: Number,
          date: Date,
          _id: { required: false },
        },
      ],
    },
    { versionKey: false }
  )
);

User.find({}).then((res) => {
  console.log(res);
  console.log("===========================================");
});

app.use(cors());

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

app.use(express.static("public"));
app.get("/", (req, res) => {
  res.sendFile(__dirname + "/views/index.html");
});

// my code
app.post("/api/exercise/new-user", (req, res) => {
  const { username } = req.body;
  User.create({ username: username }, (err, user) => {
    if (err) res.send("username exists");
    else {
      console.log(user);
      res.json({ username: user.username, _id: user._id });
      // res.json(result.map((v) => ({ _id: v._id, username: v.username })));
    }
  });
});

app.get("/api/exercise/users", (req, res) => {
  User.find({}, (err, users) => {
    if (err) res.send(err);
    else
      res.json(
        users.map((u) => ({
          _id: u._id,
          username: u.username,
        }))
      );
  });
});

app.post("/api/exercise/add", (req, res) => {
  const { userId, description } = req.body;
  const date = req.body.date ? new Date(req.body.date) : new Date();
  const duration = Number(req.body.duration);
  if (date.toString() === "Invalid Date" || duration.toString() === "NaN")
    return res.send("Invalid date or duration input");
  // find that user
  const idValidate = { _id: userId };
  User.findOne(idValidate).then((user) => {
    // if user exists
    if (user) {
      const info = { description, duration, date };
      console.log(info);
      // do the update
      const updatedLog = [...user.log, info];
      User.updateOne(idValidate, { log: updatedLog }).then((result) => {
        console.log("Updated");
        res.json({
          userId,
          ...info,
          date: info.date.toDateString(),
          username: user.username,
        });
      });
    }
    // canr find that userid
    else {
      res.send("userId not exist");
    }
  });
});

app.get("/api/exercise/log", (req, res) => {
  console.log(req.query);
  const { userId, from, to, limit } = req.query;
  const idValidate = { _id: userId };
  User.findOne(idValidate).then((user) => {
    if (!user) return res.send("userId not exist");
    const log = user.log.map((ex) => ({
      ...ex.toObject(),
      date: ex.date.toDateString(),
    }));
    const response = {
      userId,
      username: user.username,
      count: user.log.length,
      log,
    };
    res.json(response);
  });
});

// Not found middleware
app.use((req, res, next) => {
  return next({ status: 404, message: "not found" });
});

// Error Handling middleware
app.use((err, req, res, next) => {
  let errCode, errMessage;

  if (err.errors) {
    // mongoose validation error
    errCode = 400; // bad request
    const keys = Object.keys(err.errors);
    // report the first validation error
    errMessage = err.errors[keys[0]].message;
  } else {
    // generic or custom error
    errCode = err.status || 500;
    errMessage = err.message || "Internal Server Error";
  }
  res.status(errCode).type("txt").send(errMessage);
});

const listener = app.listen(process.env.PORT || 3000, () => {
  console.log("Your app is listening on port " + listener.address().port);
});
