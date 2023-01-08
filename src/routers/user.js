const express = require("express");
const multer = require("multer");
const User = require("../models/user");
const File = require("../models/file");
const auth = require("../middleware/auth");
const router = new express.Router();

router.post("/users", async (req, res) => {
  const user = new User(req.body);

  try {
    await user.save();
    const token = await user.generateAuthToken();
    res.status(201).send({ user, token });
  } catch (e) {
    res.status(400).send(e);
  }
});

router.post("/users/login", async (req, res) => {
  try {
    const user = await User.findByCredentials(
      req.body.email,
      req.body.password
    );
    const token = await user.generateAuthToken();
    res.send({ user, token });
  } catch (e) {
    res.status(400).send(e);
  }
});

router.post("/users/logout", auth, async (req, res) => {
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

router.post("/users/logoutAll", auth, async (req, res) => {
  try {
    req.user.tokens = [];
    await req.user.save();
    res.send();
  } catch (e) {
    res.status(500).send(e);
  }
});

router.get("/users/me", auth, async (req, res) => {
  res.send(req.user);
});

router.patch("/users/me", auth, async (req, res) => {
  const updates = Object.keys(req.body);
  const allowedUpdates = ["name", "email", "password", "files"];
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

router.delete("/users/me", auth, async (req, res) => {
  try {
    await req.user.remove();
    res.send(req.user);
  } catch (e) {
    res.status(500).send(e);
  }
});

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "uploads");
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
    if (!file.originalname.match(/\.(pdf|doc|docx)$/)) {
      return cb(new Error("Please upload a pdf document"));
    }
    cb(undefined, true);
  },
}).single("file" + Date.now());

router.post("/users/me/files", auth, async (req, res) => {
  upload(req, res, (err) => {
    if (err) {
      res.status(400).send("Something went wrong!");
    }
    res.send(req.file);
  });
});

router.get("/users/me/files", auth, async (req, res) => {
  res.status(201).send(req.user.file);
});

router.get("/users/search", auth, async (req, res) => {
  var name = req.query.name;
  var tag = req.query.tag;
  await File.find({ name, tag }, (err, file) => {
    if (err) {
      res.status(400).send("Something went wrong!");
    }
    res.send(file);
  });
});

/* router.get("/users/searchfilesbytags", auth, async (req, res) => {
  // var name = req.query.name;
  var tag = req.query.tag;
  const file = await File.find({ tag }, (err, file) => {
    if (err) {
      res.status(400).send("Something went wrong!");
    }
    res.send(file);
  });
}); */

module.exports = router;
