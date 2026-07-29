from flask import Blueprint, request, jsonify

from services.youtube_service import get_transcript
from services.openai_service import generate_notes

youtube = Blueprint("youtube", __name__)


@youtube.route("/study", methods=["POST"])
def study():

    data = request.get_json()

    from requests.exceptions import RetryError

    try:
        transcript = get_transcript(data["url"])
    except RetryError:
        return {
            "error": "YouTube temporarily blocked transcript requests (HTTP 429). Please try again later."
        }, 429
    except Exception as e:
        return {
            "error": str(e)
        }, 500

    notes = generate_notes(transcript)

    return jsonify({
        "notes": notes
    })
