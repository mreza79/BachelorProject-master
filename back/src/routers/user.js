const express = require("express");
const multer = require("multer");
const nodemailer = require("nodemailer");
const path = require("path");
const User = require("../models/user");
const File = require("../models/file");
const auth = require("../middleware/auth");
// const passport = require("passport-google-oauth20");
const router = new express.Router();

const Find = require("find-in-files");

router.get("/searchfiles", auth, async (req, res) => {
  const user = req.user;
  const text = req.query.text;
  answers = [];
  console.log(text);
  try {
    const files = await File.find({ user: user._id });
    if (!files) {
      res.status(404).send("No files found");
    } else {
      /* const results = [];
      files.forEach((file) => {
        console.log(file);
        Find.find(text, "./uploads", file.name)
          .then(function (results) {
            results.push(file);
          })
          .catch(function (err) {
            console.error(err);
          });
        res.send(results);
      }); */

      files.forEach((file) => {
        Find.find(text, "./uploads", file.name).then(function (results) {
          for (var result in results) {
            var res = results[result];
            console.log(
              'found "' +
                res.matches[0] +
                '" ' +
                res.count +
                ' times in "' +
                result +
                '"'
            );
            // console.log(file);
            res.send(file);
            // return;
          }
          // console.log(answers)
        });
        // console.log("answers")
        // console.log(answers)
      });
      // console.log("answers2");
      // console.log(answers);
    }
    // res.status(200).send(answers);
  } catch (e) {
    res.status(500).send(e);
  }
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
  console.log(req.body);
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

router.delete("/file/:id", auth, async (req, res) => {
  try {
    const file = await File.findOneAndDelete({
      _id: req.params.id,
      user: req.user._id,
    });

    if (!file) {
      res.status(404).send();
    }

    res.send(file);
  } catch (e) {
    res.status(500).send();
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
      file.fieldname /* + "-" + Date.now() */ + path.extname(file.originalname)
    );
  },
});

const upload = multer({
  storage,
  fileFilter: function (req, file, cb) {
    if (!file.originalname.match(/\.(txt)$/)) {
      return cb(new Error("Please upload a txt document"));
    }
    cb(undefined, true);
  },
}).single("file");

router.post("/me/files", upload, auth, async (req, res) => {
  // console.log(req);
  // console.log(req.file);
  console.log(req.tag);
  console.log(req.deadline);

  const file = new File({
    name: req.file.originalname,
    user: req.user,
    tag: "file",
    deadline: new Date(new Date().getTime() + 1000 * 60 * 60 * 24),
  });

  try {
    await file.save();
  } catch {
    res.status(400).send("Cannot save to database");
    return;
  }

  upload(req, res, (err) => {
    if (err) {
      res.status(400).send("Cannot upload file");
    } else {
      res.sendFile(req.file);
    }
  });
});

router.get("/me/files", auth, async (req, res) => {
  console.log(req.user._id);
  try {
    const files = await File.find({ user: req.user._id });
    if (!files) {
      res.status(404).send("No files found");
    } else {
      res.status(201).send(files);
    }
  } catch (e) {
    res.status(500).send(e);
  }
});

router.get("/me/file/:id", auth, async (req, res) => {
  console.log(req.params.id);
  try {
    const file = await File.findOne({ _id: req.params.id });
    if (!file) {
      res.status(404).send("No file found");
    } else {
      res.status(201).send(file);
    }
  } catch (e) {
    res.status(500).send(e);
  }
});

router.get("/search", auth, async (req, res) => {
  var name = req.query.name;
  var tag = req.query.tag;
  var user = req.user;
  if (!tag) {
    await File.find({ user: user._id, name }, (err, file) => {
      if (err) {
        res.status(400).send("Something went wrong!");
      }
      res.send(file);
    });
  } else if (!name) {
    await File.find({ user: user._id, tag }, (err, file) => {
      if (err) {
        res.status(400).send("Something went wrong!");
      }
      res.send(file);
    });
  } else {
    await File.find({ user: user._id, name, tag }, (err, file) => {
      if (err) {
        res.status(400).send("Something went wrong!");
      }
      res.send(file);
    });
  }
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

async function sendEmail() {
  console.log("Checking for deadlines");
  var transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: "mrj9012@gmail.com",
      pass: "12345678",
    },
  });
  const files = await File.find({ deadline: { $gt: Date.now() } });

  console.log(files);

  for (const file of files) {
    var mailOptions = {
      from: "mrj9012@gmail.com",
      to: file.user.email,
      subject: "Deadline",
      text: "Deadline passed",
    };
    transporter.sendMail(mailOptions, function (error, info) {
      if (error) {
        console.log(error);
      } else {
        console.log("Email sent: " + info.response);
      }
    });
  }
}

setInterval(sendEmail, 60000);

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
