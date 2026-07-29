from flask import Flask
from flask_cors import CORS

from routes.youtube import youtube

app = Flask(__name__)

# Allow requests from your frontend
CORS(app)

app.register_blueprint(youtube)

if __name__ == "__main__":
    app.run(debug=True)