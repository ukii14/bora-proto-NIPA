"use strict";

/**
 * 시드 흐름:
 *   1) 기존 게시글 / 댓글 / 썸네일 자산 모두 정리
 *   2) reviewer → demo 순서로 사용자 보장 (_id 큰 demo 가 owner 로 매핑됨)
 *   3) Flask /create 로 외부 URL 5건 등록 (크롤링 + 요약 + 썸네일 캡쳐)
 *   4) 각 글에 hashArr 부여 + reviewer 명의 댓글 삽입
 *
 * 외부 URL 을 실제로 크롤링하므로 컨테이너(proxy/web/flask)가 떠 있어야 한다.
 */

const path = require("path");
const fs = require("fs");
const http = require("http");
const mongoose = require("mongoose");

const ENV_PATH = path.resolve(__dirname, "../../bora-web/backend/.env");
const ASSETS_DIR = path.resolve(
  __dirname,
  "../../bora-crawler/flask_docker/flask_app/static/assets"
);

const NODE_API = "http://localhost:5100";
const CRAWLER_API = "http://localhost:9000";
const REQUEST_TIMEOUT_MS = 10 * 60 * 1000;

const DEMO_USER = { name: "데모", username: "demo", password: "demo1234" };
const REVIEWER_USER = {
  name: "리뷰어",
  username: "reviewer",
  password: "reviewer1234",
};

const SOURCES = [
  {
    web_link: "https://www.yna.co.kr/view/AKR20260401049400017",
    title_hint: "[AI픽] 에이전틱 AI 얼라이언스 출범",
    hashArr: ["ai", "정부정책", "agentic-ai"],
    comments: [
      "에이전틱 AI 라는 개념 정리가 잘 되어 있어 도움이 됐습니다.",
      "산학연관 협력 모델이 실제로 어떻게 굴러갈지 후속 기사가 기다려지네요.",
    ],
  },
  {
    web_link: "https://www.etnews.com/20260318000242",
    title_hint: "삼성·SK, 반도체 전주기에 AI 적용",
    hashArr: ["반도체", "ai", "디지털트윈"],
    comments: [
      "전공정·후공정 전반에 디지털 트윈을 깔아 자동화하는 흐름이 인상적이네요.",
      "유지보수·결함 분석 시간 절반 단축이라는 수치가 눈에 띕니다.",
    ],
  },
  {
    web_link: "https://zdnet.co.kr/view/?no=20260421094136",
    title_hint: "KT클라우드, 공공 AI 파운드리 확장",
    hashArr: ["클라우드", "ai", "공공"],
    comments: [
      "CSAP 중등급 확보로 공공 도입 장벽을 낮춘 점이 핵심이네요.",
    ],
  },
  {
    web_link: "https://www.hankyung.com/article/202604267047i",
    title_hint: "22살에 창업한 AI 기업 CEO 인터뷰",
    hashArr: ["스타트업", "ai", "창업"],
    comments: [
      "초기 단계 창업가의 시각이 잘 담긴 인터뷰입니다.",
      "고객사 확장 속도가 빨라서 후속 보도가 기다려지네요.",
    ],
  },
  {
    web_link: "https://www.dt.co.kr/article/12059042",
    title_hint: "기업용 AI 시장 장악 나선 구글",
    hashArr: ["구글", "ai", "엔터프라이즈"],
    comments: [
      "8세대 TPU 성능 수치와 모델 가든 전략 정리가 깔끔합니다.",
    ],
  },
];

function loadEnv() {
  const raw = fs.readFileSync(ENV_PATH, "utf8");
  raw.split(/\r?\n/).forEach((line) => {
    const m = line.match(/^([^#=]+)=(.*)$/);
    if (m) process.env[m[1].trim()] = m[2].trim();
  });
}

function httpJson(method, base, urlPath, body, headers = {}) {
  return new Promise((resolve, reject) => {
    const url = new URL(base + urlPath);
    const payload = body ? JSON.stringify(body) : undefined;
    const req = http.request(
      {
        method,
        hostname: url.hostname,
        port: url.port,
        path: url.pathname,
        headers: {
          "Content-Type": "application/json",
          ...(payload ? { "Content-Length": Buffer.byteLength(payload) } : {}),
          ...headers,
        },
      },
      (res) => {
        let chunks = "";
        res.on("data", (c) => (chunks += c));
        res.on("end", () => {
          let parsed = null;
          try {
            parsed = JSON.parse(chunks || "null");
          } catch (e) {
            parsed = chunks;
          }
          resolve({ status: res.statusCode, body: parsed });
        });
      }
    );
    req.setTimeout(REQUEST_TIMEOUT_MS, () => req.destroy(new Error("timeout")));
    req.on("error", reject);
    if (payload) req.write(payload);
    req.end();
  });
}

function postForm(base, urlPath, fields) {
  return new Promise((resolve, reject) => {
    const url = new URL(base + urlPath);
    const payload = Object.entries(fields)
      .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`)
      .join("&");
    const req = http.request(
      {
        method: "POST",
        hostname: url.hostname,
        port: url.port,
        path: url.pathname,
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          "Content-Length": Buffer.byteLength(payload),
          Accept: "text/html,application/xhtml+xml",
        },
      },
      (res) => {
        let chunks = "";
        res.on("data", (c) => (chunks += c));
        res.on("end", () => {
          resolve({
            status: res.statusCode,
            location: res.headers.location || null,
            body: chunks,
          });
        });
      }
    );
    req.setTimeout(REQUEST_TIMEOUT_MS, () => req.destroy(new Error("timeout")));
    req.on("error", reject);
    req.write(payload);
    req.end();
  });
}

async function ensureUser(profile) {
  const reg = await httpJson("POST", NODE_API, "/users/register", profile);
  if (reg.status >= 200 && reg.status < 300) {
    return { sessionId: reg.body.sessionId, userId: reg.body.userId };
  }
  const login = await httpJson("PATCH", NODE_API, "/users/login", {
    username: profile.username,
    password: profile.password,
  });
  if (login.status >= 200 && login.status < 300) {
    return { sessionId: login.body.sessionId, userId: login.body.userId };
  }
  throw new Error(
    `사용자 ${profile.username} 준비 실패. register=${reg.status} login=${login.status}`
  );
}

async function purgeAll(conn) {
  const Posts = conn.collection("blog_posts");
  const Comments = conn.collection("comments");

  const all = await Posts.find(
    {},
    { projection: { _id: 1, key: 1 } }
  ).toArray();

  if (all.length > 0) {
    await Comments.deleteMany({ postId: { $in: all.map((d) => d._id) } });
    await Posts.deleteMany({ _id: { $in: all.map((d) => d._id) } });
  }

  fs.readdirSync(ASSETS_DIR)
    .filter((f) => /\.(png|jpe?g)$/i.test(f))
    .forEach((f) => {
      try {
        fs.unlinkSync(path.join(ASSETS_DIR, f));
      } catch (_) {}
    });

  console.log(
    `[seed] 기존 게시글 ${all.length}건, 관련 댓글, assets 이미지 모두 정리`
  );
}

async function createViaCrawler(source, idx) {
  console.log(`[seed] (${idx + 1}/${SOURCES.length}) /create → ${source.web_link}`);
  const res = await postForm(CRAWLER_API, "/create", {
    submit_button: "submit_web_link",
    web_link: source.web_link,
  });
  if (!(res.status === 302 || (res.status >= 200 && res.status < 300))) {
    throw new Error(
      `crawler /create 실패 status=${res.status} body=${String(
        res.body
      ).slice(0, 200)}`
    );
  }
}

async function attachMetaAndComments(conn, demoOwner, reviewerUserId) {
  const Posts = conn.collection("blog_posts");
  const Comments = conn.collection("comments");

  const allPosts = await Posts.find({}).toArray();
  const byLink = new Map(allPosts.map((p) => [p.web_link, p]));

  for (const src of SOURCES) {
    const post = byLink.get(src.web_link);
    if (!post) {
      console.warn(`[seed] 등록 누락: ${src.web_link}`);
      continue;
    }

    await Posts.updateOne(
      { _id: post._id },
      {
        $set: {
          user: demoOwner,
          hashArr: src.hashArr,
          tagArr: post.tagArr || [],
          public: post.public !== false,
          likes: post.likes || [],
          commentsCount: src.comments.length,
        },
      }
    );

    await Comments.deleteMany({ postId: post._id });
    if (src.comments.length > 0) {
      await Comments.insertMany(
        src.comments.map((content) => ({
          content,
          writer: reviewerUserId,
          postId: post._id,
          createdAt: new Date(),
          updatedAt: new Date(),
        }))
      );
    }
    console.log(
      `[seed]   meta 갱신: "${post.title}"  tags=${src.hashArr.join(",")}  comments=${src.comments.length}`
    );
  }
}

(async () => {
  loadEnv();
  if (!process.env.MONGO_URI) throw new Error("MONGO_URI 미설정");

  // reviewer 를 먼저 만들고 demo 를 나중에 만들어
  // _id 가 큰 demo 가 크롤러 _resolve_owner 에서 owner 로 매핑되게 한다.
  const reviewer = await ensureUser(REVIEWER_USER);
  const demo = await ensureUser(DEMO_USER);
  console.log(`[seed] demo=${demo.userId}  reviewer=${reviewer.userId}`);

  await mongoose.connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });
  const conn = mongoose.connection.useDb("bora");

  try {
    await purgeAll(conn);

    for (let i = 0; i < SOURCES.length; i += 1) {
      try {
        await createViaCrawler(SOURCES[i], i);
      } catch (err) {
        console.error(
          `[seed] (${i + 1}) ${SOURCES[i].web_link} 등록 실패:`,
          err.message
        );
      }
    }

    const demoOwner = {
      _id: new mongoose.Types.ObjectId(demo.userId),
      name: DEMO_USER.name,
      username: DEMO_USER.username,
    };
    await attachMetaAndComments(
      conn,
      demoOwner,
      new mongoose.Types.ObjectId(reviewer.userId)
    );

    const total = await conn.collection("blog_posts").countDocuments({});
    console.log(`[seed] 완료. 현재 게시글 수=${total}`);
  } finally {
    await mongoose.disconnect();
  }
})().catch((err) => {
  console.error("[seed] 실패:", err);
  process.exit(1);
});
