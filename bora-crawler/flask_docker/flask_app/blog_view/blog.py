from flask import Blueprint, request, render_template, redirect, url_for, flash
from pathlib import Path
from werkzeug.utils import secure_filename

from blog_control.session_mgmt import BlogSession


blog_abtest = Blueprint("blog", __name__, url_prefix="/")


def _flash_result(result):
    ok, message = result
    flash(message, "success" if ok else "danger")


@blog_abtest.route("/create", methods=["POST"])
def create():
    submit_button = request.form.get("submit_button", "")

    if submit_button == "submit_web_link":
        web_link = request.form.get("web_link", "").strip()
        if not web_link:
            flash("web_link 가 비어 있습니다.", "warning")
        else:
            _flash_result(BlogSession.create(web_link=web_link))

    elif submit_button == "submit_file":
        f = request.files.get("file")
        if not f or not f.filename:
            flash("업로드할 파일이 없습니다.", "warning")
        else:
            save_path = Path("static", secure_filename(f.filename))
            save_path.parent.mkdir(exist_ok=True, parents=True)
            f.save(save_path)
            _flash_result(BlogSession.load_from_bookmark(save_path))

    elif submit_button == "delete_all":
        _flash_result(BlogSession.delete_all())

    elif submit_button == "reload":
        _flash_result(BlogSession.reload())

    else:
        flash(f"알 수 없는 작업: {submit_button!r}", "warning")

    return redirect(url_for("blog.default"))


@blog_abtest.route("/")
def default():
    posts = BlogSession.get_all()
    return render_template("index.html", posts=posts)
