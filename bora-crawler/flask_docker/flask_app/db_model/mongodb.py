"""MongoDB 접속 헬퍼.

config.json 의 자격증명/호스트를 읽어 SRV 연결 문자열을 만들고,
현재 프로세스 단위로 클라이언트를 캐시한다.
"""

from __future__ import annotations

import json
from pathlib import Path
from typing import Any, Dict

import pymongo


_DEFAULT_CONFIG_PATH = "./db_model/config.json"
_client: pymongo.MongoClient | None = None
_collection = None
_database = None


def _load_config(config_path: str = _DEFAULT_CONFIG_PATH) -> Dict[str, Any]:
    with open(config_path, "r", encoding="utf-8") as f:
        return json.load(f)


def _build_connection_string(config: Dict[str, Any]) -> str:
    host = config.get("host")
    if not host:
        cluster = config["cluster"]
        host = f"{cluster}.mongodb.net"
    return (
        f"mongodb+srv://{config['user_id']}:{config['user_pw']}@{host}"
        f"/{config['db']}?retryWrites=true&w=majority"
    )


def get_config(config_path: str = _DEFAULT_CONFIG_PATH) -> Dict[str, Any]:
    return _load_config(config_path)


def conn_mongodb():
    """프로세스 전역으로 캐시된 collection 핸들을 반환한다."""
    global _client, _collection, _database

    if _collection is not None:
        return _collection

    config = _load_config()
    uri = _build_connection_string(config)
    _client = pymongo.MongoClient(uri, serverSelectionTimeoutMS=10000)

    _client.admin.command("ping")

    _database = _client[config["db"]]
    _collection = _database[config["collection"]]
    return _collection


def conn_database():
    """프로세스 전역으로 캐시된 database 핸들을 반환한다."""
    global _database
    if _database is not None:
        return _database
    conn_mongodb()
    return _database
