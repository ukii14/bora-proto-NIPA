const { Router } = require("express");
const { isValidObjectId } = require("mongoose");

const { MainContent, Comment } = require("../models");
const { asyncHandler } = require("../utils/asyncHandler");
const { HttpError } = require("../utils/response");

const commentRouter = Router({ mergeParams: true });

const MAX_COMMENT_LENGTH = 8000;

commentRouter.post(
  "/saveComment",
  asyncHandler(async (req, res) => {
    if (!req.user) throw new HttpError("권한이 없습니다.", 401);

    const { mainContentId } = req.params;
    if (!isValidObjectId(mainContentId)) {
      throw new HttpError("올바르지 않은 mainContentId입니다.");
    }

    if (typeof req.body.content !== "string" || !req.body.content.trim()) {
      throw new HttpError("content가 비어 있습니다.");
    }
    const text = req.body.content.trim();
    if (text.length > MAX_COMMENT_LENGTH) {
      throw new HttpError(`댓글은 ${MAX_COMMENT_LENGTH}자 이하여야 합니다.`);
    }

    const saved = await new Comment({
      content: text,
      writer: req.user.id,
      postId: mainContentId,
    }).save();

    const [populated] = await Promise.all([
      Comment.findById(saved._id).populate("writer"),
      MainContent.updateOne(
        { _id: mainContentId },
        { $inc: { commentsCount: 1 } }
      ),
    ]);

    res.status(200).json({ success: true, result: [populated] });
  })
);

commentRouter.get(
  "/",
  asyncHandler(async (req, res) => {
    const { mainContentId } = req.params;
    if (!isValidObjectId(mainContentId)) {
      throw new HttpError("mainContentId is invalid");
    }
    const comments = await Comment.find({ postId: mainContentId })
      .sort({ createdAt: 1 })
      .populate("writer");
    res.send({ comments });
  })
);

commentRouter.patch(
  "/:commentId",
  asyncHandler(async (req, res) => {
    if (!req.user) throw new HttpError("권한이 없습니다.", 401);

    const { commentId } = req.params;
    if (!isValidObjectId(commentId)) {
      throw new HttpError("올바르지 않은 commentId입니다.");
    }

    const { content } = req.body;
    if (typeof content !== "string" || !content.trim()) {
      throw new HttpError("content is required");
    }
    const text = content.trim();
    if (text.length > MAX_COMMENT_LENGTH) {
      throw new HttpError(`댓글은 ${MAX_COMMENT_LENGTH}자 이하여야 합니다.`);
    }

    const original = await Comment.findById(commentId);
    if (!original) throw new HttpError("댓글을 찾을 수 없습니다.", 404);

    if (String(original.writer) !== String(req.user.id)) {
      throw new HttpError("작성자만 수정할 수 있습니다.", 403);
    }

    const comment = await Comment.findOneAndUpdate(
      { _id: commentId },
      { content: text },
      { new: true }
    ).populate("writer");

    res.send({ success: true, comment });
  })
);

commentRouter.delete(
  "/:commentId",
  asyncHandler(async (req, res) => {
    if (!req.user) throw new HttpError("권한이 없습니다.", 401);

    const { mainContentId, commentId } = req.params;
    if (!isValidObjectId(commentId)) {
      throw new HttpError("올바르지 않은 commentId입니다.");
    }

    const original = await Comment.findById(commentId);
    if (!original) {
      return res.send({ comment: null });
    }
    if (String(original.writer) !== String(req.user.id)) {
      throw new HttpError("작성자만 삭제할 수 있습니다.", 403);
    }

    const comment = await Comment.findOneAndDelete({ _id: commentId });

    await MainContent.updateOne(
      { _id: mainContentId },
      { $inc: { commentsCount: -1 } }
    );

    res.send({ comment });
  })
);

module.exports = { commentRouter };
