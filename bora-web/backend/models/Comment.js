const { Schema, model, Types } = require("mongoose");
const CommentSchema = new Schema(
  {
    content: { type: String, required: true },
    writer: { type: Types.ObjectId, required: true, ref: "user", index: true },
    postId: { type: Types.ObjectId, required: true, ref: "maincontent", index: true },
  },
  { timestamps: true }
);

CommentSchema.index({ mainContent: 1, createdAt: -1 });

const Comment = model("comment", CommentSchema);

module.exports = { Comment, CommentSchema };
