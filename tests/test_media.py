"""Lesson media checks.

The frontend has no test runner, so these read public/data/lessons.js as text.
Only active lines count: a commented-out `// audioUrl: …` is a lesson that
hasn't been switched on yet.

Before merging to main, run with RELEASE_CHECK=1 so a scratch (robot-voice)
narration track can't ship to athletes.
"""

import os
import re
from pathlib import Path

import pytest

PUBLIC_DIR = Path(__file__).resolve().parent.parent / "public"
LESSONS_JS = PUBLIC_DIR / "data" / "lessons.js"

# Same patterns as youTubeId() and vimeoId() in public/utils/lessonMedia.js.
YOUTUBE = re.compile(
    r"(?:youtube(?:-nocookie)?\.com/(?:watch\?(?:.*&)?v=|embed/|shorts/|live/)|youtu\.be/)[A-Za-z0-9_-]{11}"
)
VIMEO = re.compile(r"vimeo\.com/(?:video/)?\d+")


def active_values(field):
    """Values of `field: "…"` on lines that aren't commented out."""
    pattern = re.compile(rf'^\s*{field}:\s*"([^"]*)"')
    return [
        m.group(1)
        for line in LESSONS_JS.read_text().splitlines()
        if (m := pattern.match(line))
    ]


async def test_static_files_support_range_requests(client):
    # iOS Safari won't seek or show a duration for audio without 206 responses.
    response = await client.get(
        "/assets/lesson-artwork.png", headers={"Range": "bytes=0-99"}
    )
    assert response.status_code == 206
    assert response.headers["content-range"].startswith("bytes 0-99/")
    assert len(response.content) == 100


async def test_lesson_audio_is_served_with_a_playable_type(client):
    # macOS's own mime table says audio/mp4a-latm for .m4a; app/main.py pins it.
    for url in active_values("audioUrl"):
        response = await client.head(f"/{url}")
        assert response.status_code == 200, url
        assert response.headers["content-type"] in ("audio/mpeg", "audio/mp4"), url


@pytest.mark.parametrize("field", ["audioUrl", "ambientUrl"])
def test_active_audio_files_exist(field):
    missing = [url for url in active_values(field) if not (PUBLIC_DIR / url).is_file()]
    assert not missing, f"{field} points at files that aren't in public/: {missing}"


def test_video_embeds_are_youtube_or_vimeo():
    bad = [
        url
        for url in active_values("embedUrl")
        if url and not (YOUTUBE.search(url) or VIMEO.search(url))
    ]
    assert not bad, f"Only YouTube or Vimeo embeds render: {bad}"


@pytest.mark.skipif(
    os.environ.get("RELEASE_CHECK") != "1", reason="set RELEASE_CHECK=1 before merging to main"
)
def test_no_scratch_audio_in_release():
    scratch = [url for url in active_values("audioUrl") if ".scratch." in url]
    assert not scratch, f"Replace scratch narration with the real recording: {scratch}"
