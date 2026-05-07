import os

from flask import Flask
from flask_cors import CORS
from werkzeug.middleware.proxy_fix import ProxyFix

from blog_view import blog


os.environ["OAUTHLIB_INSECURE_TRANSPORT"] = "1"

app = Flask(__name__, static_url_path="/static")
CORS(app)
app.secret_key = os.environ.get("FLASK_SECRET_KEY", "bora-dev-secret-key")

# nginx(proxy:9000) -> nginx(web:8080) -> flask 의 2단 프록시 구조이므로
# X-Forwarded-* 헤더를 신뢰하여 redirect 시 외부 host/port 가 보존되도록 한다.
app.wsgi_app = ProxyFix(
    app.wsgi_app,
    x_for=2,
    x_proto=2,
    x_host=2,
    x_port=2,
)

app.register_blueprint(blog.blog_abtest)
