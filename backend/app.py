import os
from flask import Flask, send_from_directory
from flask_cors import CORS

from routes.youtube import youtube
from routes.quiz import quiz

FRONTEND_DIR = os.path.join(os.path.dirname(__file__), "..", "frontend")

app = Flask(__name__)
CORS(app)

app.register_blueprint(youtube)
app.register_blueprint(quiz)

@app.route("/")
def serve_start():
    return send_from_directory(os.path.join(FRONTEND_DIR, "strona startowa"), "start.html")

@app.route("/<path:filename>")
def serve_frontend(filename):
    return send_from_directory(FRONTEND_DIR, filename)

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=int(os.environ.get("PORT", 5000)))