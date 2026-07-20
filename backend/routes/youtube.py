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

@youtube.route("/youtube-info", methods=["POST"])
def youtube_info():
    import requests
    data = request.json
    video_id = data.get("video_id")

    API_KEY = "AIzaSyCTX8K53tIFW1_vUY828xfjYkvuGygnX_w"
    url = f"https://www.googleapis.com/youtube/v3/videos?part=snippet&id={video_id}&key={API_KEY}"

    r = requests.get(url)
    info = r.json()

    snippet = info["items"][0]["snippet"]

    return {
        "title": snippet["title"],
        "description": snippet["description"],
        "channel": snippet["channelTitle"]
    }
