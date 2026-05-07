const { Router } = require("express");
const fs = require("fs");
const { promisify } = require("util");
const mongoose = require("mongoose");

const { MainContent, Comment } = require("../models");
const { mainContentUpload } = require("../middleware");
const { asyncHandler } = require("../utils/asyncHandler");
const { HttpError } = require("../utils/response");
const { commentRouter } = require("./commentRouter");

const fileUnlink = promisify(fs.unlink);
const mainContentRouter = Router();

mainContentRouter.use("/:mainContentId/comment", commentRouter);

const ensureValidObjectId = (id, label = "id") => {
  if (!mongoose.isValidObjectId(id)) {
    throw new HttpError(`올바르지 않은 ${label}입니다.`);
  }
};

// 업로드
mainContentRouter.post(
  "/",
  mainContentUpload.array("mainContent", 30),
  asyncHandler(async (req, res) => {
    if (!req.user) throw new HttpError("권한이 없습니다.", 401);

    const mainContents = await Promise.all(
      req.files.map((file) =>
        new MainContent({
          user: {
            _id: req.user.id,
            name: req.user.name,
            username: req.user.username,
          },
          public: req.body.public,
          key: file.filename,
          originalFileName: file.originalname,
          web_link: req.body.web_link,
          category: req.body.category,
        }).save()
      )
    );

    res.json(mainContents);
  })
);

// 목록
mainContentRouter.get(
  "/",
  asyncHandler(async (req, res) => {
    const { lastid } = req.query;
    if (lastid && !mongoose.isValidObjectId(lastid)) {
      throw new HttpError("invalid lastid");
    }

    const filter = lastid ? { _id: { $lt: lastid } } : {};
    const mainContents = await MainContent.find(filter)
      .sort({ _id: -1 })
      .limit(30);

    res.json(mainContents);
  })
);

// 검색 — MongoDB 텍스트 인덱스($text) 우선, 결과 없으면 정규식 fallback (한국어 토큰 한계 보완)
const SEARCH_LIMIT = 30;
const escapeRegex = (raw) => raw.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

mainContentRouter.post(
  "/search",
  asyncHandler(async (req, res) => {
    const value = (req.query.value ?? req.body.value ?? "").toString().trim();
    if (!value) {
      return res.json({ success: true, contentsInfo: [], postSize: 0 });
    }

    let contentsInfo = await MainContent.find(
      { $text: { $search: value } },
      { score: { $meta: "textScore" } }
    )
      .sort({ score: { $meta: "textScore" } })
      .limit(SEARCH_LIMIT)
      .lean();

    if (contentsInfo.length === 0) {
      const pattern = new RegExp(escapeRegex(value), "i");
      contentsInfo = await MainContent.find({
        $or: [
          { title: pattern },
          { summary: pattern },
          { text: pattern },
          { hashArr: pattern },
        ],
      })
        .sort({ _id: -1 })
        .limit(SEARCH_LIMIT)
        .lean();
    }

    res.json({
      success: true,
      contentsInfo,
      postSize: contentsInfo.length,
    });
  })
);

// 상세
mainContentRouter.get(
  "/:mainContentId",
  asyncHandler(async (req, res) => {
    const { mainContentId } = req.params;
    ensureValidObjectId(mainContentId, "이미지id");

    const mainContent = await MainContent.findOne({ _id: mainContentId });
    if (!mainContent) throw new HttpError("해당 이미지는 존재 하지 않습니다.", 404);

    res.json(mainContent);
  })
);

// 삭제 (작성자만)
mainContentRouter.delete(
  "/:mainContentId",
  asyncHandler(async (req, res) => {
    if (!req.user) throw new HttpError("권한이 없습니다.", 401);

    const { mainContentId } = req.params;
    ensureValidObjectId(mainContentId, "이미지id");

    const mainContent = await MainContent.findOne({ _id: mainContentId });
    if (!mainContent) {
      return res.json({ message: "요청하신 사진은 이미 삭제되었습니다." });
    }

    if (!mainContent.user?._id) {
      throw new HttpError("작성자 정보가 없는 게시글은 삭제할 수 없습니다.", 403);
    }
    if (String(mainContent.user._id) !== String(req.user.id)) {
      throw new HttpError("작성자만 삭제할 수 있습니다.", 403);
    }

    await MainContent.deleteOne({ _id: mainContentId });
    await Comment.deleteMany({ postId: mainContentId });

    try {
      await fileUnlink(`./uploads/${mainContent.key}`);
    } catch (fileErr) {
      if (fileErr.code !== "ENOENT") throw fileErr;
    }

    res.json({ message: "요청하신 이미지가 삭제되었습니다.", mainContent });
  })
);

// 메타 수정 (작성자만, title / web_link 만 허용)
const URL_REGEX = /^https?:\/\/.+/i;

mainContentRouter.patch(
  "/:mainContentId/meta",
  asyncHandler(async (req, res) => {
    if (!req.user) throw new HttpError("권한이 없습니다.", 401);

    const { mainContentId } = req.params;
    ensureValidObjectId(mainContentId, "mainContentId");

    const target = await MainContent.findOne({ _id: mainContentId });
    if (!target) throw new HttpError("게시글을 찾을 수 없습니다.", 404);
    if (!target.user?._id) {
      throw new HttpError("작성자 정보가 없는 게시글은 수정할 수 없습니다.", 403);
    }
    if (String(target.user._id) !== String(req.user.id)) {
      throw new HttpError("작성자만 수정할 수 있습니다.", 403);
    }

    const updates = {};
    if (typeof req.body.title === "string") {
      const trimmed = req.body.title.trim();
      if (!trimmed) throw new HttpError("title 은 비어 있을 수 없습니다.");
      if (trimmed.length > 200) throw new HttpError("title 은 200자 이하여야 합니다.");
      updates.title = trimmed;
    }
    if (typeof req.body.web_link === "string") {
      const trimmed = req.body.web_link.trim();
      if (!trimmed) throw new HttpError("web_link 는 비어 있을 수 없습니다.");
      if (!URL_REGEX.test(trimmed)) {
        throw new HttpError("web_link 는 http(s) URL 이어야 합니다.");
      }
      updates.web_link = trimmed;
    }

    if (Object.keys(updates).length === 0) {
      throw new HttpError("수정할 항목이 없습니다.");
    }

    const mainContent = await MainContent.findOneAndUpdate(
      { _id: mainContentId },
      { $set: updates },
      { new: true }
    );

    res.json(mainContent);
  })
);

// 좋아요
mainContentRouter.patch(
  "/:mainContentId/like",
  asyncHandler(async (req, res) => {
    if (!req.user) throw new HttpError("권한이 없습니다.", 401);
    ensureValidObjectId(req.params.mainContentId, "mainContentId");

    const mainContent = await MainContent.findOneAndUpdate(
      { _id: req.params.mainContentId },
      { $addToSet: { likes: req.user.id } },
      { new: true }
    );
    res.json(mainContent);
  })
);

// 좋아요 취소
mainContentRouter.patch(
  "/:mainContentId/unlike",
  asyncHandler(async (req, res) => {
    if (!req.user) throw new HttpError("권한이 없습니다.", 401);
    ensureValidObjectId(req.params.mainContentId, "mainContentId");

    const mainContent = await MainContent.findOneAndUpdate(
      { _id: req.params.mainContentId },
      { $pull: { likes: req.user.id } },
      { new: true }
    );
    res.json(mainContent);
  })
);

// 태그 추가
mainContentRouter.patch(
  "/:mainContentId",
  asyncHandler(async (req, res) => {
    const { mainContentId } = req.params;
    ensureValidObjectId(mainContentId, "mainContentId");

    const { hashArr } = req.body;
    if (typeof hashArr !== "string" || !hashArr.trim()) {
      throw new HttpError("hashArr는 비어있지 않은 문자열이어야 합니다.");
    }

    const mainContent = await MainContent.findOneAndUpdate(
      { _id: mainContentId },
      { $addToSet: { hashArr: hashArr.trim() } },
      { new: true }
    );

    res.send({ mainContent });
  })
);

// 태그 삭제
mainContentRouter.patch(
  "/:mainContentId/delTag/:categoryValue",
  asyncHandler(async (req, res) => {
    if (!req.user) throw new HttpError("권한이 없습니다.", 401);
    ensureValidObjectId(req.params.mainContentId, "mainContentId");

    const mainContent = await MainContent.findOneAndUpdate(
      { _id: req.params.mainContentId },
      { $pull: { hashArr: req.params.categoryValue } },
      { new: true }
    );
    res.json(mainContent);
  })
);

module.exports = { mainContentRouter };
