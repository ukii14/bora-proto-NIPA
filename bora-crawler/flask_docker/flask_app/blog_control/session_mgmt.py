"""블로그 도메인 세션 관리.

요청별 결과를 (ok: bool, message: str) 형태로 반환하여 라우트 계층(blog_view)
에서 flash 메시지로 즉시 노출할 수 있게 한다. 결과 표현 형식은 응답 모듈
(여기서는 라우트)이 정한 단순 인터페이스이며, 도메인 객체 자체는 화면 표현
방식에 의존하지 않는다.
"""

from __future__ import annotations

import datetime
import traceback
from pathlib import Path
from typing import Tuple

import pymongo

from db_model.mongodb import conn_database, conn_mongodb
from utils.crawling import capture_screenshot, parse_bookmark
from blog_control.summarizer import get_summarizer


Result = Tuple[bool, str]


class BlogSession():

    initial_state = True

    @staticmethod
    def _resolve_owner():
        db = conn_database()
        users = db["users"]
        owner = users.find_one(
            {},
            {"_id": 1, "name": 1, "username": 1},
            sort=[("_id", pymongo.DESCENDING)],
        )
        if not owner:
            return None
        return {
            "_id": owner["_id"],
            "name": owner.get("name", "익명"),
            "username": owner.get("username", "anonymous"),
        }

    @staticmethod
    def _backfill_owner_if_missing(owner):
        if owner is None:
            return
        mongo_db = conn_mongodb()
        mongo_db.update_many({"user": {"$exists": False}}, {"$set": {"user": owner}})

    @staticmethod
    def get(title):
        if title is None:
            return None
        mongo_db = conn_mongodb()

        post = list(mongo_db.find({"title": title}, {"_id": 1, "title": 1, "web_link": 1}))
        if not post:
            return None

        return post[0]


    @staticmethod
    def get_all(max_allow: int = 100):
        try:
            owner = BlogSession._resolve_owner()
            BlogSession._backfill_owner_if_missing(owner)
            mongo_db = conn_mongodb()
            posts = list(mongo_db.find({}).sort("cTime", pymongo.DESCENDING).limit(max_allow))
            return posts or None
        except Exception as exc:
            print(f"[BlogSession.get_all] {exc}")
            return None


    @staticmethod
    def create(web_link: str, title: str = None, timestamp: int = None) -> Result:
        if not web_link:
            return False, "web_link 가 비어 있습니다."

        try:
            owner = BlogSession._resolve_owner()
            if owner is None:
                return False, "삭제 권한 연동을 위해 users 컬렉션에 계정이 필요합니다."

            existing = BlogSession.get(title)
            if existing is not None:
                return False, f"이미 등록된 글입니다: {existing.get('title')}"

            print(f"[BlogSession.create] capture_screenshot start: {web_link}")
            results = capture_screenshot(web_link)
            if results is None:
                return False, f"페이지 접근/렌더 실패: {web_link}"

            cTime = (
                datetime.datetime.fromtimestamp(timestamp).strftime("%Y-%m-%d %H:%M:%S")
                if timestamp
                else datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S")
            )

            print(f"[BlogSession.create] summarize start (text len={len(results.get('text', ''))})")
            summary = BlogSession.summarize(results["text"])

            mongo_db = conn_mongodb()
            mongo_db.insert_one({
                "user": owner,
                "web_link": web_link,
                "title": title if title is not None else results["title"],
                "cTime": cTime,
                "key": results["key"],
                "text": results["text"],
                "summary": summary,
            })
            print(f"[BlogSession.create] saved: {results['title']}")
            return True, f"등록 성공: {results['title']}"

        except Exception as exc:
            traceback.print_exc()
            return False, f"등록 중 예외: {exc}"


    @staticmethod
    def load_from_bookmark(bookmark_path: str) -> Result:
        try:
            bookmark_jsonl = parse_bookmark(bookmark_path)
        except Exception as exc:
            traceback.print_exc()
            return False, f"북마크 파싱 실패: {exc}"

        success_cnt = 0
        for bookmark in bookmark_jsonl:
            ok, _ = BlogSession.create(**bookmark)
            if ok:
                success_cnt += 1

        BlogSession.initial_state = False
        return True, f"북마크 처리 완료: {success_cnt}/{len(bookmark_jsonl)} 등록"


    @staticmethod
    def delete_all(asset_path: str = "./static/assets") -> Result:
        try:
            mongo_db = conn_mongodb()
            mongo_db.delete_many({})

            for img in Path(asset_path).glob("*.png"):
                img.unlink()
            return True, "전체 삭제 완료"
        except Exception as exc:
            traceback.print_exc()
            return False, f"전체 삭제 실패: {exc}"


    @staticmethod
    def reload(asset_path: str = "./static/assets") -> Result:
        try:
            posts = BlogSession.get_all()
            if not posts:
                return True, "재로딩할 글이 없습니다."

            web_links = [post["web_link"] for post in posts]
            images = [post.get("key") for post in posts]

            mongo_db = conn_mongodb()
            success_cnt = 0
            for web_link, image in zip(web_links, images):
                if image:
                    try:
                        Path(asset_path, image).unlink()
                    except Exception:
                        pass

                results = capture_screenshot(web_link)
                if results is None:
                    continue

                mongo_db.update_one(
                    {"web_link": web_link},
                    {"$set": {
                        "key": results["key"],
                        "text": results["text"],
                        "summary": BlogSession.summarize(results["text"]),
                    }}
                )
                success_cnt += 1

            return True, f"재로딩 완료: {success_cnt}/{len(web_links)}"
        except Exception as exc:
            traceback.print_exc()
            return False, f"재로딩 실패: {exc}"


    @staticmethod
    def summarize(text: str) -> str:
        try:
            return get_summarizer().summarize(text)
        except Exception as exc:
            traceback.print_exc()
            print(f"[BlogSession.summarize] {exc}")
            return ""
