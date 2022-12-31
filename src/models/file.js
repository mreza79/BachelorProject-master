const mongoose = require("mongoose");
const validator = require("validator");

const fileSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      trim: true,
      required: true,
      unique: true,
    },
    tags: [
      {
        tag: {
          type: String,
        },
      },
    ],
    menu: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: "User",
    },
  },
  {
    timestamps: true,
  }
);

const File = mongoose.model("File", fileSchema);

module.exports = File;
