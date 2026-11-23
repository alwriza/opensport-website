"""Download every match with status 'new' from YouTube and put it in the bucket.

    python3 download.py

new -> downloaded, or error with the reason. Each match is independent: one
failure is recorded on that match and the next one goes on.
"""

from __future__ import annotations

import os
import subprocess
import tempfile

import db
from config import YTDLP_FORMAT, env


def raw_uri(match_id: str) -> str:
    return f"{env('RESEARCH_BUCKET').rstrip('/')}/raw/{match_id}.mp4"


def download_one(job: db.Job, workdir: str) -> None:
    local = os.path.join(workdir, f"{job.match_id}.mp4")
    subprocess.run(
        ["yt-dlp", "--no-playlist", "-f", YTDLP_FORMAT, "-o", local, job.url],
        check=True,
    )
    if not os.path.isfile(local):
        raise RuntimeError(f"yt-dlp finished but {local} is missing")
    subprocess.run(["gcloud", "storage", "cp", local, raw_uri(job.match_id)], check=True)
    os.remove(local)


def main() -> None:
    client = db.client()
    jobs = db.matches_with_status(client, "new")
    print(f"{len(jobs)} match(es) to download")
    for job in jobs:
        print(f"--- {job.match_id} {job.url}")
        with tempfile.TemporaryDirectory() as workdir:
            try:
                download_one(job, workdir)
            except Exception as e:  # recorded on the match, then the next match goes on
                db.set_match_status(client, job.match_id, "error", f"download: {e}")
                print(f"!!! {job.match_id}: {e}")
                continue
        db.set_match_status(client, job.match_id, "downloaded")
        print(f"ok {job.match_id} -> {raw_uri(job.match_id)}")


if __name__ == "__main__":
    main()
