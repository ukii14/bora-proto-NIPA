require("dotenv").config();
const express = require("express");
const helmet = require("helmet");
const mongoSanitize = require("express-mongo-sanitize");
const mongoose = require("mongoose");

const { userRouter, mainContentRouter } = require("./routes");
const { MONGO_URI, PORT } = process.env;
const { authenticate, errorHandler } = require("./middleware");
const { MainContent } = require("./models");
const app = express();

mongoose
  .connect(MONGO_URI, {
    useCreateIndex: true,
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(async () => {
    console.log("mongodb connected");

    try {
      await MainContent.syncIndexes();
      console.log("MainContent indexes synced");
    } catch (err) {
      console.warn("[index sync] failed:", err.message);
    }

    app.use(
      helmet({
        contentSecurityPolicy: false,
        crossOriginResourcePolicy: { policy: "cross-origin" },
      })
    );
    // 이미지 파일들 외부로 노출시켜주기
    app.use("/uploads", express.static("uploads"));
    app.use(express.json({ limit: "1mb" }));
    app.use(mongoSanitize());
    app.use(authenticate);
    // /images 로 시작하는 경로는 모두 imageRouter로!
    // app.use("/images", imageRouter);
    app.use("/users", userRouter);
    // app.use("/blogs", blogRouter);
    app.use("/mainContents", mainContentRouter);

    app.use(errorHandler);

    app.listen(PORT, () =>
      console.log("Express server listening on PORT " + PORT)
    );
  })
  .catch((err) => console.log(err));
