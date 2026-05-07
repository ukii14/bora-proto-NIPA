import time
import uuid

import requests
from selenium import webdriver
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from pathlib import Path


_DEFAULT_USER_AGENT = (
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
    "AppleWebKit/537.36 (KHTML, like Gecko) "
    "Chrome/120.0.0.0 Safari/537.36"
)


def _build_options() -> Options:
    options = Options()
    options.add_argument("--headless=new")
    options.add_argument("--lang=ko_KR")
    options.add_argument("--no-sandbox")
    options.add_argument("--disable-dev-shm-usage")
    options.add_argument("--window-size=1280,800")
    options.add_argument(f"--user-agent={_DEFAULT_USER_AGENT}")
    return options

def capture_screenshot(web_link: str, static_path: str = "./static") -> dict | None:
    try:
        req = requests.get(
            web_link,
            timeout=10,
            headers={"User-Agent": _DEFAULT_USER_AGENT},
        )
        if req.status_code != requests.codes["ok"]:
            print(f"Request code is not ok: {req.status_code}")
            return None
    except Exception as e:
        print(e)
        return None

    driver = webdriver.Chrome(options=_build_options())

    try:
        driver.get(web_link)
        WebDriverWait(driver, 15).until(
            lambda d: d.execute_script("return document.readyState") == "complete"
        )

        title = driver.title
        text = driver.find_element(By.XPATH, "/html/body").text

        key = f"{uuid.uuid4()}.png"
        save_path = Path(static_path, "assets", key)

        if not save_path.parent.exists():
            save_path.parent.mkdir(parents=True, exist_ok=True)

        time.sleep(2)
        driver.save_screenshot(str(save_path))
    finally:
        driver.quit()

    return {
        "title": title,
        "text": text,
        "key": key,
    }


def parse_bookmark(filepath, max_to_load: int = 3):
    driver = webdriver.Chrome(options=_build_options())

    try:
        filepath = (Path.cwd() / filepath).as_uri()
        driver.get(filepath)

        bookmark_content = driver.find_elements(By.TAG_NAME, "a")
        bookmark_jsonl = [
            {
                "web_link": content.get_attribute("href"),
                "title": content.text,
                "timestamp": int(content.get_attribute("add_date")),
            }
            for content in bookmark_content
        ]
    finally:
        driver.quit()

    return bookmark_jsonl[:max_to_load]
