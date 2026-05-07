"use strict";

const path = require("path");
const fs = require("fs");

// Cursor 통합 터미널 등에서 PLAYWRIGHT_BROWSERS_PATH 가 샌드박스 tmp 를 가리키며
// 브라우저 바이너리와 어긋나는 경우가 있음 → 유효하지 않으면 해제해 ~/.cache/ms-playwright 사용
(function fixPlaywrightBrowsersPath() {
  const p = process.env.PLAYWRIGHT_BROWSERS_PATH;
  if (!p) return;
  const exe = path.join(
    p,
    "chromium_headless_shell-1217",
    "chrome-headless-shell-linux64",
    "chrome-headless-shell"
  );
  if (!fs.existsSync(exe)) {
    delete process.env.PLAYWRIGHT_BROWSERS_PATH;
  }
})();

const { chromium } = require("playwright");

const FE = process.env.FRONTEND_URL || "http://localhost:4200";
const OUT_DIR = path.resolve(__dirname, "../../docs/screenshots");
const DEMO = { username: "demo", password: "demo1234" };

/** 상세·댓글·태그 캡쳐에 쓸 기사: 연합뉴스 에이전틱 AI 얼라이언스 */
const DETAIL_SCREENSHOT_MATCH =
  process.env.SHOOT_DETAIL_MATCH || /에이전틱\s*AI\s*얼라이언스|이젠\s*AI\s*생태계\s*전쟁/;

fs.mkdirSync(OUT_DIR, { recursive: true });

const VIEWPORT_DESKTOP = { width: 1440, height: 900 };

async function shot(page, name) {
  const file = path.join(OUT_DIR, `${name}.png`);
  await page.screenshot({ path: file, fullPage: true });
  console.log(`  saved ${path.relative(process.cwd(), file)}`);
}

async function gotoIdle(page, url) {
  await page.goto(url, { waitUntil: "domcontentloaded" });
  await page.waitForLoadState("networkidle").catch(() => {});
  await page.waitForTimeout(400);
}

async function clearToasts(page) {
  await page
    .evaluate(() => {
      document
        .querySelectorAll(
          ".Toastify__toast, .Toastify__toast-container, [class*='Toastify']"
        )
        .forEach((el) => el.remove());
    })
    .catch(() => {});
}

async function fillCredentials(page) {
  await page.getByRole("textbox", { name: "회원 ID" }).fill(DEMO.username);
  await page.locator('input[type="password"]').fill(DEMO.password);
}

async function login(page) {
  await gotoIdle(page, `${FE}/auth/login`);
  await fillCredentials(page);
  await page.locator('form button[type="submit"]').click();
  await page.waitForURL(`${FE}/`, { timeout: 10000 }).catch(() => {});
  await page.waitForLoadState("networkidle").catch(() => {});
  await page.waitForTimeout(800);
}

(async () => {
  const browser = await chromium.launch();
  const context = await browser.newContext({ viewport: VIEWPORT_DESKTOP });
  const page = await context.newPage();

  try {
    console.log("[shoot] 01. 회원가입 페이지");
    await gotoIdle(page, `${FE}/auth/register`);
    await shot(page, "01-register");

    console.log("[shoot] 02. 로그인 페이지");
    await gotoIdle(page, `${FE}/auth/login`);
    await fillCredentials(page);
    await shot(page, "02-login");

    console.log("[shoot] 03. 메인 - 리스트 뷰");
    await login(page);
    await clearToasts(page);
    await page.waitForTimeout(200);
    await clearToasts(page);
    await shot(page, "03-main-list");

    console.log("[shoot] 04. 메인 - 그리드 뷰");
    const moduleBtn = page.getByRole("button", { name: "module" });
    if ((await moduleBtn.count()) > 0) {
      await moduleBtn.first().click();
      await page.waitForTimeout(500);
    }
    await clearToasts(page);
    await shot(page, "04-main-grid");

    await page.getByRole("button", { name: "list" }).first().click();
    await page.waitForTimeout(400);
    await clearToasts(page);

    console.log("[shoot] 05. 업로드 모달");
    const uploadBtn = page.getByRole("button", { name: "업로드" });
    if ((await uploadBtn.count()) > 0) {
      await uploadBtn.first().click();
      await page.waitForTimeout(500);
      await shot(page, "05-upload-modal");
      await page.keyboard.press("Escape");
      await page.waitForTimeout(300);
    } else {
      console.log("  업로드 버튼을 찾지 못함, skip");
    }

    console.log("[shoot] 06. 상세 페이지");
    const picked = page
      .locator("a[href^='/mainContents/']")
      .filter({ hasText: DETAIL_SCREENSHOT_MATCH })
      .first();
    if ((await picked.count()) > 0) {
      await picked.click();
    } else {
      console.log("  연합뉴스 기사 카드 없음 → 첫 카드로 대체");
      await page.locator("a[href^='/mainContents/']").first().click();
    }
    await page.waitForLoadState("networkidle").catch(() => {});
    await page.waitForTimeout(800);
    await shot(page, "06-detail");

    console.log("[shoot] 07. 상세 - 본인 글 편집 UI");
    const editBtn = page.getByRole("button", { name: "게시글 수정" });
    if ((await editBtn.count()) > 0) {
      await editBtn.first().click();
      await page.waitForTimeout(400);
      await shot(page, "07-detail-edit");
      const cancel = page.getByRole("button", { name: "취소" });
      if ((await cancel.count()) > 0) await cancel.first().click();
      await page.waitForTimeout(300);
    } else {
      console.log("  게시글 수정 버튼을 찾지 못함, skip");
    }

    console.log("[shoot] 08. 상세 - 댓글 영역");
    const commentInput = page.getByPlaceholder("댓글을 입력하세요...");
    if ((await commentInput.count()) > 0) {
      await commentInput.scrollIntoViewIfNeeded();
      await page.waitForTimeout(400);
      await shot(page, "08-detail-comments");

      console.log("[shoot] 09. 상세 - 댓글 입력 중");
      await commentInput.fill("정리 잘 봤습니다. 도입 부분 깔끔해서 인상 깊었어요.");
      await page.waitForTimeout(300);
      await shot(page, "09-comment-input");
      await commentInput.fill("");
      await page.waitForTimeout(200);
    } else {
      console.log("  댓글 입력칸을 찾지 못함, skip");
    }

    console.log("[shoot] 10. 상세 - 태그 추가 패널");
    const tagToggle = page.getByRole("button", { name: "태그 추가" });
    if ((await tagToggle.count()) > 0) {
      await tagToggle.first().scrollIntoViewIfNeeded();
      await tagToggle.first().click();
      await page.waitForTimeout(400);
      const tagInput = page.getByPlaceholder("태그를 입력하세요");
      if ((await tagInput.count()) > 0) {
        await tagInput.fill("agentic-ai");
        await page.waitForTimeout(300);
      }
      await shot(page, "10-tag-add");
    } else {
      console.log("  태그 추가 버튼을 찾지 못함, skip");
    }

    console.log("[shoot] 11. 검색 결과");
    await gotoIdle(page, `${FE}/`);
    const search = page.getByPlaceholder("제목, 링크, 태그로 검색...");
    await search.fill("클라우드");
    await page.waitForTimeout(900);
    await shot(page, "11-search");

    console.log("[shoot] 완료. 결과: docs/screenshots/");
  } catch (err) {
    console.error("[shoot] 실패:", err);
    await page.screenshot({ path: path.join(OUT_DIR, "_error.png") }).catch(() => {});
    process.exitCode = 1;
  } finally {
    await context.close();
    await browser.close();
  }
})();
