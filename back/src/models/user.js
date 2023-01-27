const mongoose = require("mongoose");
const validator = require("validator");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const File = require("./file");

const userSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      unique: true,
      required: true,
      trim: true,
      lowercase: true,
      validate(value) {
        if (!validator.isEmail(value)) {
          throw new Error("Email address is invalid");
        }
      },
    },
    googleId: {
      type:String,
      unique: true
    },
    password: {
      type: String,
      required: true,
      minlength: 7,
      trim: true,
      // validate(value) {
      //   if (value.toLowerCase().includes("password")) {
      //     throw new Error('Password cannot contain "password"');
      //   }
      // },
    },
    name: {
      type: String,
      required: true,
    },
    /* colleagues: [
      {
        colleague: {
          type: String,
          trim: true,
          unique: true,
          lowercase: true,
          required: true,
          validate(value) {
            if (!validator.isEmail(value)) {
              throw new Error("Email is invalid");
            }
          },
        },
      },
    ], */
    tokens: [
      {
        token: {
          type: String,
          required: true,
        },
      },
    ],
  },
  {
    timestamps: true,
  }
);

userSchema.virtual("file", {
  ref: "File",
  localField: "_id",
  foreignField: "user",
});

userSchema.methods.toJSON = function () {
  const user = this;
  const userObject = user.toObject();

  delete userObject.password;
  delete userObject.tokens;

  return userObject;
};

userSchema.methods.generateAuthToken = async function () {
  const user = this;
  const token = jwt.sign({ _id: user._id.toString() }, process.env.JWT_SECRET);

  user.tokens = user.tokens.concat({ token });
  await user.save();

  return token;
};

userSchema.statics.findByCredentials = async (email, password) => {
  const user = await user.findOne({ email });

  if (!user) {
    throw new Error("Unable to login");
  }

  const isMatch = await bcrypt.compare(password, user.password);

  if (!isMatch) {
    throw new Error("Unable to login");
  }

  return user;
};

userSchema.pre("save", async function (next) {
  const user = this;

  if (user.isModified("password")) {
    user.password = await bcrypt.hash(user.password, 8);
  }
  next();
});

userSchema.pre("remove", async function (next) {
  const user = this;
  await File.deleteMany({ owner: user._id });
  next();
});

const user = mongoose.model("user", userSchema);

module.exports = user;
