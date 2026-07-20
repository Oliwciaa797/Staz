from pathlib import Path
import os
import time

from dotenv import load_dotenv
from google import genai

load_dotenv(Path(__file__).resolve().parent.parent / ".env")

client = genai.Client(api_key=os.getenv("GEMINI_API_KEY"))


def generate_notes(transcript):
    prompt = f"""
Jesteś ekspertem tworzącym materiały do nauki.

Na podstawie poniższego transkryptu przygotuj odpowiedź w języku polskim.

Zwróć WYŁĄCZNIE poprawny HTML.

Używaj tylko tych tagów:
<h2>, <h3>, <p>, <ul>, <li>, <strong>

Struktura:

<h2>Krótka notatka</h2>

<h2>Najważniejsze definicje</h2>

<h2>Podsumowanie</h2>

Transkrypt:

{transcript[:25000]}
"""

    last_error = None

    for attempt in range(3):
        try:
            response = client.models.generate_content(
                model="gemini-flash-lite-latest",
                contents=prompt,
            )

            if response.text:
                return response.text

            return "<p>Model nie zwrócił odpowiedzi.</p>"

        except Exception as e:
            last_error = e
            print(f"Attempt {attempt + 1} failed: {e}")
            time.sleep(2)

    return f"<p>Błąd Gemini:<br>{last_error}</p>"