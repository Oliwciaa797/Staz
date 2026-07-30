import os
import tempfile

import yt_dlp
from google import genai
from google.genai import types

client = genai.Client(api_key=os.environ["GEMINI_API_KEY"])


def download_audio(url):
    temp_dir = tempfile.mkdtemp()

    output = os.path.join(temp_dir, "%(id)s.%(ext)s")

    ydl_opts = {
        "format": "bestaudio/best",
        "outtmpl": output,
        "quiet": True,
        "noplaylist": True,
    }

    with yt_dlp.YoutubeDL(ydl_opts) as ydl:
        info = ydl.extract_info(url, download=True)
        filename = ydl.prepare_filename(info)

    return filename


def get_transcript(url):
    audio_file = download_audio(url)

    with open(audio_file, "rb") as f:
        audio = f.read()

    response = client.models.generate_content(
        model="gemini-2.5-flash",
        contents=[
            "Transcribe this audio. Return only the transcript.",
            types.Part.from_bytes(
                data=audio,
                mime_type="audio/mp4",
            ),
        ],
    )

    return response.text