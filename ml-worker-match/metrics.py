"""Pure metric functions: raw per-frame records in, numbers out. No I/O, no models.

This module also owns the raw-record schema, so it stays importable (and testable)
without torch, ultralytics or any weights.
"""

from __future__ import annotations

from dataclasses import dataclass
from typing import Iterable, Sequence

import numpy as np

from config import (
    DOMINANCE_GRID_STEP_M,
    HEATMAP_COLS,
    HEATMAP_ROWS,
    MAX_PLAYER_SPEED_MS,
    MAX_TRACK_GAP_SECONDS,
    MIN_DOMINANCE_PLAYERS_PER_TEAM,
    MIN_TRACK_SECONDS,
    POSSESSION_RADIUS_M,
    SPEED_WINDOW_SECONDS,
)

MS_TO_KMH = 3.6
ON_PITCH_ROLES = ("player", "goalkeeper")


@dataclass(frozen=True)
class PlayerSample:
    """One tracked person on the pitch in one analysed frame, in pitch metres."""

    track_id: int
    role: str  # "player" | "goalkeeper" | "referee"
    team: int | None  # 0 | 1, or None for referees and unresolved goalkeepers
    x_m: float
    y_m: float


@dataclass(frozen=True)
class FrameSample:
    """One analysed frame that had a valid pitch homography."""

    t: float  # seconds from the start of the source video
    players: tuple[PlayerSample, ...]
    ball_xy_m: tuple[float, float] | None


@dataclass(frozen=True)
class TrackSummary:
    track_id: int
    team: int | None
    role: str
    mapped_seconds: float
    distance_m: float
    avg_speed_kmh: float
    top_speed_kmh: float


def _majority(values: Sequence) -> object:
    """Most frequent value; ties broken by first appearance."""
    counts: dict = {}
    for value in values:
        counts[value] = counts.get(value, 0) + 1
    return max(counts, key=lambda key: (counts[key], -list(counts).index(key)))


def _split_runs(
    samples: Sequence[tuple[float, float, float]], max_gap_s: float
) -> list[list[tuple[float, float, float]]]:
    """Split (t, x, y) samples into stretches with no gap longer than max_gap_s."""
    runs: list[list[tuple[float, float, float]]] = []
    current = [samples[0]]
    for previous, sample in zip(samples, samples[1:]):
        if sample[0] - previous[0] > max_gap_s:
            runs.append(current)
            current = [sample]
        else:
            current.append(sample)
    runs.append(current)
    return runs


def _run_distance(
    run: Sequence[tuple[float, float, float]], max_speed_ms: float
) -> tuple[list[float], list[float]]:
    """Cumulative distance along one run, rejecting implausible jumps.

    A step implying more than max_speed_ms is a track switch or a homography
    glitch, so it contributes no distance. The time it spans is still real, so it
    is kept in the timeline.
    """
    times = [run[0][0]]
    cumulative = [0.0]
    for (t0, x0, y0), (t1, x1, y1) in zip(run, run[1:]):
        dt = t1 - t0
        step = float(np.hypot(x1 - x0, y1 - y0))
        if dt > 0 and step / dt > max_speed_ms:
            step = 0.0
        times.append(t1)
        cumulative.append(cumulative[-1] + step)
    return times, cumulative


def _windowed_top_speed(
    times: Sequence[float], cumulative: Sequence[float], window_s: float
) -> float | None:
    """Fastest speed averaged over a window_s sliding window, in m/s."""
    best: float | None = None
    start = 0
    for end in range(len(times)):
        while times[end] - times[start] > window_s:
            start += 1
        # step back onto the closest sample that is still a full window away
        left = start - 1 if start > 0 else 0
        span = times[end] - times[left]
        if span < window_s:
            continue
        speed = (cumulative[end] - cumulative[left]) / span
        if best is None or speed > best:
            best = speed
    return best


def track_summaries(
    frames: Iterable[FrameSample],
    *,
    max_speed_ms: float = MAX_PLAYER_SPEED_MS,
    max_gap_s: float = MAX_TRACK_GAP_SECONDS,
    speed_window_s: float = SPEED_WINDOW_SECONDS,
    min_track_seconds: float = MIN_TRACK_SECONDS,
) -> list[TrackSummary]:
    """Per-track distance and speed, for tracks observed long enough to mean anything."""
    positions: dict[int, list[tuple[float, float, float]]] = {}
    teams: dict[int, list[int | None]] = {}
    roles: dict[int, list[str]] = {}
    for frame in frames:
        for player in frame.players:
            positions.setdefault(player.track_id, []).append(
                (frame.t, player.x_m, player.y_m)
            )
            teams.setdefault(player.track_id, []).append(player.team)
            roles.setdefault(player.track_id, []).append(player.role)

    summaries: list[TrackSummary] = []
    for track_id, samples in positions.items():
        samples.sort(key=lambda sample: sample[0])
        distance = 0.0
        mapped = 0.0
        top_speed: float | None = None
        for run in _split_runs(samples, max_gap_s):
            if len(run) < 2:
                continue
            times, cumulative = _run_distance(run, max_speed_ms)
            distance += cumulative[-1]
            mapped += times[-1] - times[0]
            run_top = _windowed_top_speed(times, cumulative, speed_window_s)
            if run_top is not None and (top_speed is None or run_top > top_speed):
                top_speed = run_top

        if mapped < min_track_seconds or top_speed is None:
            continue
        summaries.append(
            TrackSummary(
                track_id=track_id,
                team=_majority(teams[track_id]),
                role=str(_majority(roles[track_id])),
                mapped_seconds=round(mapped, 2),
                distance_m=round(distance, 2),
                avg_speed_kmh=round(distance / mapped * MS_TO_KMH, 2),
                top_speed_kmh=round(top_speed * MS_TO_KMH, 2),
            )
        )
    summaries.sort(key=lambda summary: summary.distance_m, reverse=True)
    return summaries


def team_totals(tracks: Sequence[TrackSummary], team: int) -> dict:
    """Distance and speed for one team, aggregated over its on-pitch tracks."""
    members = [
        track
        for track in tracks
        if track.team == team and track.role in ON_PITCH_ROLES
    ]
    if not members:
        return {"distance_m": 0.0, "avg_speed_kmh": 0.0, "top_speed_kmh": 0.0}
    distance = sum(track.distance_m for track in members)
    mapped = sum(track.mapped_seconds for track in members)
    return {
        "distance_m": round(distance, 2),
        "avg_speed_kmh": round(distance / mapped * MS_TO_KMH, 2),
        "top_speed_kmh": round(max(track.top_speed_kmh for track in members), 2),
    }


def _on_pitch(frame: FrameSample) -> list[PlayerSample]:
    return [
        player
        for player in frame.players
        if player.role in ON_PITCH_ROLES and player.team is not None
    ]


def possession(
    frames: Sequence[FrameSample], *, radius_m: float = POSSESSION_RADIUS_M
) -> tuple[float, float] | None:
    """Share of ball frames in which each team's nearest player holds the ball.

    Returns None when no frame ever put a player within radius_m of the ball.
    """
    held = [0, 0]
    for frame in frames:
        if frame.ball_xy_m is None:
            continue
        players = _on_pitch(frame)
        if not players:
            continue
        ball = np.array(frame.ball_xy_m, dtype=float)
        xy = np.array([(player.x_m, player.y_m) for player in players], dtype=float)
        distances = np.linalg.norm(xy - ball, axis=1)
        nearest = int(np.argmin(distances))
        if distances[nearest] <= radius_m:
            held[players[nearest].team] += 1

    total = held[0] + held[1]
    if total == 0:
        return None
    return round(held[0] / total * 100, 1), round(held[1] / total * 100, 1)


def _dominance_grid(length_m: float, width_m: float, step_m: float) -> np.ndarray:
    xs = np.arange(step_m / 2, length_m, step_m)
    ys = np.arange(step_m / 2, width_m, step_m)
    grid_x, grid_y = np.meshgrid(xs, ys)
    return np.column_stack((grid_x.ravel(), grid_y.ravel()))


def dominance_series(
    frames: Sequence[FrameSample],
    *,
    length_m: float,
    width_m: float,
    step_m: float = DOMINANCE_GRID_STEP_M,
    min_players_per_team: int = MIN_DOMINANCE_PLAYERS_PER_TEAM,
) -> list[dict]:
    """Team A's share of pitch area, per frame, as a Voronoi area share.

    Frames without enough mapped players on both teams are left out rather than
    guessed at.
    """
    grid = _dominance_grid(length_m, width_m, step_m)
    series: list[dict] = []
    for frame in frames:
        players = _on_pitch(frame)
        teams = np.array([player.team for player in players])
        if min(int((teams == 0).sum()), int((teams == 1).sum())) < min_players_per_team:
            continue
        xy = np.array([(player.x_m, player.y_m) for player in players], dtype=float)
        # grid cells x players -> the team owning the nearest player to each cell
        distances = np.linalg.norm(grid[:, None, :] - xy[None, :, :], axis=2)
        owner = teams[np.argmin(distances, axis=1)]
        series.append(
            {"t": round(frame.t, 2), "a_pct": round(float((owner == 0).mean()) * 100, 1)}
        )
    return series


def dominance_share(series: Sequence[dict]) -> tuple[float, float] | None:
    """Mean area share over the whole clip. None when no frame qualified."""
    if not series:
        return None
    a_pct = float(np.mean([point["a_pct"] for point in series]))
    return round(a_pct, 1), round(100.0 - a_pct, 1)


def heatmap(
    frames: Sequence[FrameSample],
    team: int,
    *,
    length_m: float,
    width_m: float,
    cols: int = HEATMAP_COLS,
    rows: int = HEATMAP_ROWS,
) -> list[list[float]]:
    """Occupancy grid for one team, row-major (rows x cols), normalised to a 0..1 peak."""
    counts = np.zeros((rows, cols), dtype=float)
    for frame in frames:
        for player in _on_pitch(frame):
            if player.team != team:
                continue
            col = int(player.x_m / length_m * cols)
            row = int(player.y_m / width_m * rows)
            if 0 <= col < cols and 0 <= row < rows:
                counts[row, col] += 1
    peak = counts.max()
    if peak > 0:
        counts /= peak
    return [[round(value, 4) for value in row] for row in counts]
