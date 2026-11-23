"""Supabase access for the pipeline. Uses the service-role key, which bypasses RLS:
it lives only in the environment of the machine that runs the pipeline."""

from __future__ import annotations

from dataclasses import dataclass

from supabase import Client, create_client

from config import env


@dataclass
class Job:
    match_id: str
    youtube_id: str
    url: str
    segment_id: str
    segment_mode: str
    start_s: float
    end_s: float


def client() -> Client:
    return create_client(env("SUPABASE_URL"), env("SUPABASE_SERVICE_ROLE_KEY"))


def matches_with_status(db: Client, status: str) -> list[Job]:
    rows = (
        db.table("research_matches")
        .select("id, youtube_id, url, research_segments(id, mode, start_s, end_s)")
        .eq("status", status)
        .order("created_at")
        .execute()
        .data
    )
    jobs = []
    for row in rows:
        segment = row["research_segments"]
        if segment is None:
            raise RuntimeError(f"match {row['id']} has no segment")
        jobs.append(
            Job(
                match_id=row["id"],
                youtube_id=row["youtube_id"],
                url=row["url"],
                segment_id=segment["id"],
                segment_mode=segment["mode"],
                start_s=float(segment["start_s"]),
                end_s=float(segment["end_s"]),
            )
        )
    return jobs


def set_match_status(db: Client, match_id: str, status: str, error: str | None = None) -> None:
    db.table("research_matches").update({"status": status, "error": error}).eq("id", match_id).execute()


def replace_predictions(db: Client, job: Job, rows: list[dict]) -> None:
    """All predictions of one segment, replaced as a whole so a rerun never duplicates."""
    db.table("research_predictions").delete().eq("segment_id", job.segment_id).execute()
    if rows:
        db.table("research_predictions").insert(rows).execute()
    if job.segment_mode == "review":
        db.table("research_segments").update({"status": "ready"}).eq("id", job.segment_id).eq(
            "status", "waiting"
        ).execute()
