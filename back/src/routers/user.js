const express = require("express");
const multer = require("multer");
const nodemailer = require("nodemailer");
const User = require("../models/user");
const File = require("../models/file");
const auth = require("../middleware/auth");
// const passport = require("passport-google-oauth20");
const router = new express.Router();

const Find = require("find-in-files");

router.get("/searchfiles", auth, async (req, res) => {
  const user = req.user;
  const text = req.query.text;
  const files = await File.find({ user: user._id });
  const results = [];
  Find.find(text, ".", ".txt$")
    .then(function (results) {
      for (const file in results) {
        results.push(file);
      }
    })
    .catch(function (err) {
      console.error(err);
    });
  res.send(results);
});

/* const fs = require("fs");
const readline = require("readline");
const stream = require("stream");

const searchStream = (filename, text) => {
  return new Promise((resolve) => {
    const inStream = fs.createReadStream("file/" + filename + ".txt");
    const outStream = new stream();
    const rl = readline.createInterface(inStream, outStream);
    const result = [];
    const regEx = new RegExp(text, "i");
    rl.on("line", function (line) {
      if (line && line.search(regEx) >= 0) {
        result.push(line);
      }
    });
    rl.on("close", function () {
      console.log("finished search", filename);
      resolve(result);
    });
  });
}; */

router.post("/signup", async (req, res) => {
  const user = new User(req.body);

  // console.log(req)

  // console.log(user)

  try {
    await user.save();
    const token = await user.generateAuthToken();
    res.status(201).send({ user, token });
  } catch (e) {
    res.status(400).send(e);
  }
});

// router.get("/", async (req, res) => {
//   res.send('<a href="/auth/google"> Authenticate with google')
// })

router.post("/login", async (req, res) => {
  try {
    const user = await User.findByCredentials(
      req.body.email,
      req.body.password
    );

    const token = await user.generateAuthToken();
    res.status(200).send({ user, token });
  } catch (e) {
    res.status(400).send(e);
  }
});

router.post("/logout", auth, async (req, res) => {
  try {
    req.user.tokens = req.user.tokens.filter(
      (token) => token.token !== req.token
    );
    await req.user.save();
    res.send();
  } catch (e) {
    res.status(500).send(e);
  }
});

router.post("/logoutAll", auth, async (req, res) => {
  try {
    req.user.tokens = [];
    await req.user.save();
    res.send();
  } catch (e) {
    res.status(500).send(e);
  }
});

router.get("/me", auth, async (req, res) => {
  res.send(req.user);
});

router.patch("/me", auth, async (req, res) => {
  const updates = Object.keys(req.body);
  const allowedUpdates = ["email", "password" /* , "files" */];
  const isValidOperation = updates.every((update) =>
    allowedUpdates.includes(update)
  );

  if (!isValidOperation)
    return res.status(400).send({ error: "Invalid Updates!" });

  try {
    updates.forEach((update) => (req.user[update] = req.body[update]));
    await req.user.save();
    res.send(req.user);
  } catch (e) {
    res.status(400).send(e);
  }
});

router.delete("/me", auth, async (req, res) => {
  try {
    await req.user.remove();
    res.send(req.user);
  } catch (e) {
    res.status(500).send(e);
  }
});

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "uploads/");
  },
  filename: function (req, file, cb) {
    cb(
      null,
      file.fieldname + "-" + Date.now() + path.extname(file.originalname)
    );
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 10000000 * 2 },
  fileFilter: function (req, file, cb) {
    if (!file.originalname.match(/\.(txt)$/)) {
      return cb(new Error("Please upload a txt document"));
    }
    cb(undefined, true);
  },
}).single("file" + Date.now());

router.post("/me/files", auth, async (req, res) => {
  
  upload(req, res, (err) => {
    if (err) {
      res.status(400).send("Something went wrong!");
    }
    res.send(req.file);
  });
});

router.get("/me/files", auth, async (req, res) => {
  const files = File.find({ users: req.user });
  res.status(201).send(files);
});

router.get("/search", auth, async (req, res) => {
  var name = req.query.name;
  var tag = req.query.tag;
  var user = req.user;
  await File.find({ users: user._id, name, tags: tag }, (err, file) => {
    if (err) {
      res.status(400).send("Something went wrong!");
    }
    res.send(file);
  });
});

router.get("/date/:id", auth, async (req, res) => {
  var id = req.param.id;
  await File.find({ id }, (err, file) => {
    if (err) {
      res.status(400).send("Something went wrong!");
    }
    res.send(file);
  });
});

// function sendEmail() {
//   const files = File.find({ deadline: { $gt: Date.now() } });
//   console.log("Checking for deadlines");
//   var transporter = nodemailer.createTransport({
//     service: "gmail",
//     auth: {
//       user: "mrj9012@gmail.com",
//       pass: "12345678",
//     },
//   });

//   files.forEach((file) => {
//     var mailOptions = {
//       from: "mrj9012@gmail.com",
//       to: file.user.email,
//       subject: "Deadline",
//       text: "Deadline passed",
//     };
//     transporter.sendMail(mailOptions, function (error, info) {
//       if (error) {
//         console.log(error);
//       } else {
//         console.log("Email sent: " + info.response);
//       }
//     });
//   });
// }

// setInterval(sendEmail, 60000);

// router.get("/auth/google", async (req, res) => {
//   passport.authenticate("google", { scope: ["email"] });
// });
// router.get("/google/callback", async (req, res) => {
//   passport.authenticate('google', {
//     successRedirect: '/',
//     failureRedirect: '/login',
//   })
// });

module.exports = router;
