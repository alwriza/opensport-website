"""Poll -> claim -> download -> run -> upload -> update. Nothing else.

Runs anywhere with outbound HTTPS: no inbound networking, no queue service.
"""

from __future__ import annotations

import json
import os
import tempfile
import time
from datetime import datetime, timezone

import results
from config import (
    CLAIM_RPC,
    ERROR_PITCH_CALIBRATION,
    MIN_HOMOGRAPHY_COVERAGE,
    POLL_INTERVAL_SECONDS,
    RESULTS_BUCKET,
    TABLE,
    VIDEO_BUCKET,
)
from supabase import Client, create_client


class PitchCalibrationError(RuntimeError):
    """The clip never showed enough pitch to map anybody onto it."""


def _require_env(name: str) -> str:
    value = os.environ.get(name)
    if not value:
        raise RuntimeError(f"{name} is not set")
    return value


def _now() -> str:
    return datetime.now(timezone.utc).isoformat()


def _process(client: Client, job: dict, weights_dir: str, device: str) -> None:
    from pipeline import analyze  # imported here so a bad job fails before torch loads

    job_id = job["id"]
    with tempfile.TemporaryDirectory() as workdir:
        source = os.path.join(workdir, "source.mp4")
        annotated = os.path.join(workdir, "annotated.mp4")
        with open(source, "wb") as handle:
            handle.write(client.storage.from_(VIDEO_BUCKET).download(job["video_path"]))

        output = analyze(source, annotated, weights_dir, device)
        coverage = output.mapped_frames / output.analyzed_frames
        if coverage < MIN_HOMOGRAPHY_COVERAGE:
            raise PitchCalibrationError(
                f"{ERROR_PITCH_CALIBRATION}: pitch mapped in only {coverage * 100:.0f}% of frames"
            )

        document = results.build(output, source_video=job["video_path"])
        annotated_path = f"{job_id}/annotated.mp4"
        results_path = f"{job_id}/results.json"
        bucket = client.storage.from_(RESULTS_BUCKET)
        with open(output.annotated_video_path, "rb") as handle:
            bucket.upload(annotated_path, handle.read(), {"content-type": "video/mp4"})
        bucket.upload(
            results_path,
            json.dumps(document).encode("utf-8"),
            {"content-type": "application/json"},
        )

    client.table(TABLE).update(
        {
            "status": "done",
            "annotated_video_path": annotated_path,
            "results_path": results_path,
            "summary": results.summary(document),
            "finished_at": _now(),
        }
    ).eq("id", job_id).execute()
    print(f"[{job_id}] done: {results.summary(document)}", flush=True)


def main() -> None:
    client = create_client(
        _require_env("SUPABASE_URL"), _require_env("SUPABASE_SERVICE_ROLE_KEY")
    )
    weights_dir = _require_env("WEIGHTS_DIR")
    device = _require_env("DEVICE")
    print(f"worker up: device={device} weights={weights_dir}", flush=True)

    while True:
        claimed = client.rpc(CLAIM_RPC).execute().data
        if not claimed:
            time.sleep(POLL_INTERVAL_SECONDS)
            continue

        job = claimed[0] if isinstance(claimed, list) else claimed
        print(f"[{job['id']}] claimed {job['video_path']}", flush=True)
        try:
            _process(client, job, weights_dir, device)
        except Exception as error:
            client.table(TABLE).update(
                {"status": "failed", "error": str(error), "finished_at": _now()}
            ).eq("id", job["id"]).execute()
            raise


if __name__ == "__main__":
    main()
