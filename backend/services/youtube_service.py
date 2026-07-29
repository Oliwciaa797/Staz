from urllib.parse import urlparse, parse_qs
from youtube_transcript_api import YouTubeTranscriptApi
from youtube_transcript_api.proxies import WebshareProxyConfig

api = YouTubeTranscriptApi(
    proxy_config=WebshareProxyConfig(
        proxy_username="hwolfcgd",
        proxy_password="7ijb3ggn1t6z",
    )
)

def get_video_id(url):
    parsed = urlparse(url)

    if parsed.hostname == "youtu.be":
        return parsed.path[1:]

    if parsed.hostname in ("youtube.com", "www.youtube.com"):
        return parse_qs(parsed.query)["v"][0]

    raise ValueError("Invalid YouTube URL")


def get_transcript(url):
    video_id = get_video_id(url)

    transcript_list = api.list(video_id)

    transcript = transcript_list.find_transcript(["pl", "en"])

    data = transcript.fetch()

    return " ".join(item.text for item in data)