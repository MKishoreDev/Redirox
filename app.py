import io
import os
import string
import random
import qrcode
import base64

from datetime import datetime
from flask import (
    Flask,
    request,
    jsonify,
    redirect,
    abort,
    render_template,
    send_from_directory,
)
from pymongo import MongoClient
from werkzeug.security import generate_password_hash, check_password_hash

app = Flask(__name__)
MONGO_URI = os.environ.get("MONGO_URI", "mongodb://localhost:27017")
client = MongoClient(MONGO_URI)
db = client["Redirox"]
try:
    db.links.create_index("code", unique=True)
except Exception as e:
    print("Could not create database index at startup:", e)

def generate_code():
    values = string.ascii_letters + string.digits
    while True:
        code = "".join(random.choices(values, k=6))
        exist = db.links.find_one({"code": code})
        if not exist:
            return code

def generate_qr(data):
    qr = qrcode.QRCode(
        version=1,
        box_size=10,
        border=5
    )
    qr.add_data(data)
    qr.make(fit=True)
    img = qr.make_image(
        fill_color="black",
        back_color="white"
    )
    buffer = io.BytesIO()
    img.save(buffer, format="PNG")
    img_str = base64.b64encode(
        buffer.getvalue()
    ).decode()
    return f"data:image/png;base64,{img_str}"

@app.route("/redirox.png")
def serve_logo():
    return send_from_directory("static", "redirox.png")

@app.route("/")
def home():
    return render_template("index.html")

@app.route("/shorten", methods=["POST"])
def shorten():
    data = request.get_json(silent=True) or {}
    url = (data.get("url") or "").strip()
    password = (data.get("password") or "").strip()
    expires_at = (data.get("expires_at") or "").strip()
    generate_qr_requested = data.get("generate_qr", False)

    if not url:
        return jsonify({
            "error": "URL is required"
        }), 400

    if not (
        url.startswith("http://")
        or
        url.startswith("https://")
    ):
        return jsonify({
            "error": "Please enter a valid URL starting with http:// or https://"
        }), 400

    try:
        code = generate_code()
        short_url = request.host_url + code
        expiration_date = None
        if expires_at:
            try:
                expiration_date = datetime.fromisoformat(expires_at.replace("Z", "+00:00")).replace(tzinfo=None)
            except:
                return jsonify({
                    "error": "Invalid expiration date format"
                }), 400

        link_data = {
            "url": url,
            "code": code,
            "created_at": datetime.utcnow(),
            "expires_at": expiration_date,
            "visits": 0,
            "password": generate_password_hash(password)
            if password else None,
        }

        db.links.insert_one(link_data)
        qr_code = generate_qr(short_url) if generate_qr_requested else None
        return jsonify({
            "code": code,
            "short_url": short_url,
            "url": url,
            "qr_code": qr_code,
            "expires_at": expiration_date.isoformat()
            if expiration_date else None,
            "has_password": bool(password),
        })

    except Exception as e:
        print(e)
        return jsonify({
            "error": "Could not generate a unique code, try again"
        }), 500

@app.route("/verify/<code>", methods=["POST"])
def verify_password(code):
    doc = db.links.find_one({
        "code": code
    })
    if not doc:
        return jsonify({
            "error": "Link not found"
        }), 404
    if not doc.get("password"):
        return jsonify({
            "success": True
        })

    data = request.get_json(silent=True) or {}
    password = data.get("password", "")
    if not check_password_hash(
        doc["password"],
        password
    ):
        return jsonify({
            "error": "Invalid password"
        }), 401

    return jsonify({
        "success": True
    })

@app.route("/info/<code>", methods=["GET"])
def get_link_info(code):
    doc = db.links.find_one({
        "code": code
    })
    if not doc:
        abort(404)
    return jsonify({
        "code": code,
        "url": doc.get("url"),
        "visits": doc.get("visits", 0),
        "created_at": doc.get("created_at").isoformat(),
        "expires_at":
            doc.get("expires_at").isoformat()
            if doc.get("expires_at")
            else None,
        "has_password": bool(doc.get("password")),
    })

@app.route("/<code>", methods=["GET"])
def redirect_url(code):
    doc = db.links.find_one({
        "code": code
    })
    if not doc:
        abort(404)
    if (
        doc.get("expires_at")
        and
        datetime.utcnow() > doc["expires_at"]
    ):
        db.links.delete_one({
            "code": code
        })
        return abort(404)
    if doc.get("password"):
        password = request.args.get("password")
        if not password:
            return render_template(
                "password.html",
                code=code
            )

        if not check_password_hash(
            doc["password"],
            password
        ):
            return render_template(
                "password.html",
                code=code
            )
    db.links.update_one(
        {"code": code},
        {"$inc": {"visits": 1}}
    )
    return redirect(doc["url"])

@app.errorhandler(404)
def not_found(error):
    return render_template("404.html"), 404

if __name__ == "__main__":
    app.run(
        debug=True,
        port=5000
    )
