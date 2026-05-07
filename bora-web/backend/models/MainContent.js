const { Schema, model, Types } = require("mongoose");
const { CommentSchema } = require("./Comment");

const MainContentSchema = new Schema(
  {
    user: {
      _id: { type: Types.ObjectId, required: true, index: true },
      name: { type: String, required: true },
      username: { type: String, required: true },
    },
    likes: [{ type: Types.ObjectId, default: 0 }],
    public: { type: Boolean, default: true },
    key: { type: String, required: true },
    originalFileName: { type: String, required: true },
    web_link: { type: String },
    title: { type: String },
    text: { type: String },
    cTime: { type: String },
    category: { type: String },
    hashArr: { type: Array },
    tagArr: { type: Array },
    summary: { type: String },
    commentsCount: { type: Number, default: 0, required: true },
    comments: [CommentSchema],
  }
  // { timestamps: true }
);

MainContentSchema.index({ "user._id": 1, updatedAt: 1 });
MainContentSchema.index(
  { title: "text", hashArr: "text", summary: "text", text: "text" },
  {
    name: "MainContentTextIndex",
    weights: { title: 10, hashArr: 5, summary: 3, text: 1 },
    default_language: "none",
  }
);

const MainContent = model("maincontent", MainContentSchema, "blog_posts");

module.exports = { MainContent };
