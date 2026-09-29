"""Builds and validates results.json. The contract in section 5 of the spec is law."""

from __future__ import annotations

from datetime import datetime, timezone
from typing import TYPE_CHECKING

import metrics
from config import (
    HEATMAP_COLS,
    HEATMAP_ROWS,
    MIN_BALL_COVERAGE,
    MODEL_IDS,
    ROBOFLOW_SPORTS_SHA,
)
if TYPE_CHECKING:  # importing pipeline pulls in torch, which validate() does not need
    from pipeline import PipelineOutput

TEAM_KEYS = {0: "A", 1: "B"}


def build(output: "PipelineOutput", source_video: str) -> dict:
    """Turn raw pipeline records into the results document served to the frontend."""
    homography_coverage = output.mapped_frames / output.analyzed_frames
    ball_coverage = output.ball_frames / output.analyzed_frames

    tracks = metrics.track_summaries(output.frames)
    series = metrics.dominance_series(
        output.frames, length_m=output.pitch_length_m, width_m=output.pitch_width_m
    )
    dominance = metrics.dominance_share(series)
    if ball_coverage < MIN_BALL_COVERAGE:
        held, reason = None, f"ball detected in only {ball_coverage * 100:.0f}% of analyzed frames"
    else:
        held = metrics.possession(output.frames)
        reason = None if held else "no player was ever within the possession radius of the ball"

    teams = {}
    for team, key in TEAM_KEYS.items():
        totals = metrics.team_totals(tracks, team)
        totals["dominance_pct"] = None if dominance is None else dominance[team]
        totals["possession_pct"] = None if held is None else held[team]
        totals["possession_unavailable_reason"] = None if held is not None else reason
        totals["heatmap"] = metrics.heatmap(
            output.frames, team, length_m=output.pitch_length_m, width_m=output.pitch_width_m
        )
        teams[key] = totals

    document = {
        "meta": {
            "source_video": source_video,
            "analyzed_seconds": output.analyzed_seconds,
            "analysis_fps": output.analysis_fps,
            "homography_coverage": round(homography_coverage, 4),
            "ball_coverage": round(ball_coverage, 4),
            "roboflow_sports_sha": ROBOFLOW_SPORTS_SHA,
            "model_ids": MODEL_IDS,
            "pitch_dims_m": [output.pitch_length_m, output.pitch_width_m],
            "generated_at": datetime.now(timezone.utc).isoformat(),
        },
        "teams": teams,
        "tracks": [
            {
                "track_id": track.track_id,
                "team": None if track.team is None else TEAM_KEYS.get(track.team),
                "role": track.role,
                "mapped_seconds": track.mapped_seconds,
                "distance_m": track.distance_m,
                "avg_speed_kmh": track.avg_speed_kmh,
                "top_speed_kmh": track.top_speed_kmh,
            }
            for track in tracks
        ],
        "dominance": series,
        "frames": [
            {
                "t": frame.t,
                "players": [
                    [player.track_id, TEAM_KEYS.get(player.team), round(player.x_m, 2), round(player.y_m, 2)]
                    for player in frame.players
                ],
                "ball": None
                if frame.ball_xy_m is None
                else [round(frame.ball_xy_m[0], 2), round(frame.ball_xy_m[1], 2)],
            }
            for frame in output.frames
        ],
    }
    validate(document)
    return document


def summary(document: dict) -> dict:
    """The small slice the analyses list renders without fetching the full document."""
    meta = document["meta"]
    return {
        "analyzed_seconds": meta["analyzed_seconds"],
        "homography_coverage": meta["homography_coverage"],
        "ball_coverage": meta["ball_coverage"],
        "teams": {
            key: {
                "distance_m": team["distance_m"],
                "possession_pct": team["possession_pct"],
                "dominance_pct": team["dominance_pct"],
            }
            for key, team in document["teams"].items()
        },
    }


def validate(document: dict) -> None:
    """Raise if the document would break the frontend's type contract."""
    meta = document["meta"]
    for key in (
        "source_video", "analyzed_seconds", "analysis_fps", "homography_coverage",
        "ball_coverage", "roboflow_sports_sha", "model_ids", "pitch_dims_m", "generated_at",
    ):
        if key not in meta:
            raise ValueError(f"meta.{key} is missing")
    for key in ("homography_coverage", "ball_coverage"):
        if not 0.0 <= meta[key] <= 1.0:
            raise ValueError(f"meta.{key} out of range: {meta[key]}")

    if set(document["teams"]) != {"A", "B"}:
        raise ValueError(f"teams must be exactly A and B, got {sorted(document['teams'])}")
    for key, team in document["teams"].items():
        for field in (
            "distance_m", "avg_speed_kmh", "top_speed_kmh", "dominance_pct",
            "possession_pct", "possession_unavailable_reason", "heatmap",
        ):
            if field not in team:
                raise ValueError(f"teams.{key}.{field} is missing")
        if (team["possession_pct"] is None) == (team["possession_unavailable_reason"] is None):
            raise ValueError(f"teams.{key} must carry either a possession or a reason")
        if len(team["heatmap"]) != HEATMAP_ROWS or any(
            len(row) != HEATMAP_COLS for row in team["heatmap"]
        ):
            raise ValueError(f"teams.{key}.heatmap must be {HEATMAP_ROWS}x{HEATMAP_COLS}")

    for point in document["dominance"]:
        if not 0.0 <= point["a_pct"] <= 100.0:
            raise ValueError(f"dominance a_pct out of range: {point['a_pct']}")
