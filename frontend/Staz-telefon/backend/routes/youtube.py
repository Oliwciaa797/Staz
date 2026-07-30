from flask import Blueprint, request, jsonify

from services.youtube_service import get_transcript
from services.openai_service import generate_notes

youtube = Blueprint("youtube", __name__)


@youtube.route("/study", methods=["POST"])
def study():

    data = request.get_json()

    transcript = get_transcript(data["url"])

    notes = generate_notes(transcript)

    return jsonify({
        "notes": notes
    })