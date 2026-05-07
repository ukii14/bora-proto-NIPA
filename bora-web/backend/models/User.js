const { Schema, model } = require("mongoose");

const UserSchema = new Schema(
  {
    name: { type: String, required: true },
    username: { type: String, required: true, unique: true },
    hashedPassword: { type: String, required: true },
    sessions: [
      {
        createdAt: { type: Date, required: true },
      },
    ],
  },
  { timestamps: true }
);

const User = model("user", UserSchema);
module.exports = { User };
