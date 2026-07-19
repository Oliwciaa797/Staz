from flask import Flask
from routes.youtube import youtube

app = Flask(__name__)

app.register_blueprint(youtube)

@app.route("/")
def home():
    return {
        "status": "Backend is running!"
    }

if __name__ == "__main__":
    app.run(debug=True, port=5000)