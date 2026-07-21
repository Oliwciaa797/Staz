from flask import Flask
from flask_cors import CORS

from routes.youtube import youtube
from routes.quiz import quiz

app = Flask(__name__)

CORS(app)

app.register_blueprint(youtube)
app.register_blueprint(quiz)

if __name__ == "__main__":
    app.run(debug=True)