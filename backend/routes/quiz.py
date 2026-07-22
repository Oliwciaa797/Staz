from flask import Blueprint, request, jsonify
from services.youtube_service import get_transcript
from services.openai_service import generate_quiz

quiz = Blueprint("quiz", __name__)

@quiz.route("/quiz", methods=["POST"])
def create_quiz():
    data = request.get_json()

    transcript = get_transcript(data["url"])

    quiz = generate_quiz(transcript)

    return jsonify({
        "success": True,
        "quiz": quiz
        
    })