from pathlib import Path
import os

from dotenv import load_dotenv
from google import genai

# Load .env
load_dotenv(Path(__file__).resolve().parent.parent / ".env")

api_key = os.getenv("GEMINI_API_KEY")

if not api_key:
    raise RuntimeError("GEMINI_API_KEY not found in backend/.env")

client = genai.Client(api_key=api_key)


def generate_notes(transcript):

    prompt = f"""
You are an expert university professor.

Analyze this YouTube transcript.

Return your response in Markdown.

Create these sections:

# Summary

# Detailed Notes

# Key Concepts

# Important Definitions

# Important Facts

# Study Tips

# Flashcards

Create 10 flashcards.

Format:

Q:
A:

# Quiz

Create 10 multiple choice questions.

Each question should have:

Question

A)

B)

C)

D)

Correct Answer

Transcript:

{transcript}
"""

    response = client.models.generate_content(
        model="gemini-2.5-flash",
        contents=prompt,
    )

    return response.text