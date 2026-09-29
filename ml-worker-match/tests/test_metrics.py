"""Synthetic trajectories with answers worked out by hand."""

import math

import pytest

from metrics import (
    FrameSample,
    PlayerSample,
    TrackSummary,
    dominance_series,
    dominance_share,
    heatmap,
    possession,
    team_totals,
    track_summaries,
)

FPS = 10.0
STEP = 1.0 / FPS


def straight_line(track_id, team, speed_ms, seconds, y=35.0, x0=0.0, start_t=0.0):
    """Samples of one track walking along +x at a constant speed."""
    count = int(round(seconds * FPS)) + 1
    return [
        (
            start_t + index * STEP,
            PlayerSample(
                track_id=track_id,
                role="player",
                team=team,
                x_m=x0 + speed_ms * index * STEP,
                y_m=y,
            ),
        )
        for index in range(count)
    ]


def frames_from(*sample_lists, ball=None):
    """Merge per-track samples into FrameSamples keyed by timestamp."""
    by_time = {}
    for samples in sample_lists:
        for t, player in samples:
            by_time.setdefault(round(t, 6), []).append(player)
    return [
        FrameSample(t=t, players=tuple(players), ball_xy_m=ball)
        for t, players in sorted(by_time.items())
    ]


def test_ten_metres_in_two_seconds():
    """10 m in 2 s is 10.0 m of distance and 5.0 m/s, avg and top alike."""
    frames = frames_from(straight_line(1, 0, speed_ms=5.0, seconds=2.0))
    [track] = track_summaries(frames, min_track_seconds=2.0)

    assert track.track_id == 1
    assert track.mapped_seconds == pytest.approx(2.0)
    assert track.distance_m == pytest.approx(10.0)
    assert track.avg_speed_kmh == pytest.approx(5.0 * 3.6)
    assert track.top_speed_kmh == pytest.approx(5.0 * 3.6)


def test_teleport_is_rejected():
    """A 40 m jump in 0.1 s is a track switch, so it adds no distance."""
    samples = straight_line(1, 0, speed_ms=5.0, seconds=4.0)
    t, player = samples[20]
    samples[20] = (t, PlayerSample(1, "player", 0, player.x_m + 40.0, player.y_m))

    [track] = track_summaries(frames_from(samples))

    # the jump out and the jump back are both dropped; the rest of the walk stands
    assert track.distance_m == pytest.approx(20.0 - 2 * 0.5, abs=1e-6)
    assert track.top_speed_kmh < 12.0 * 3.6


def test_gap_longer_than_max_is_not_bridged():
    """A track that vanishes for 3 s does not earn the straight line across the hole."""
    first = straight_line(1, 0, speed_ms=5.0, seconds=2.0, start_t=0.0)
    second = straight_line(1, 0, speed_ms=5.0, seconds=2.0, start_t=5.0, x0=100.0)

    [track] = track_summaries(frames_from(first + second), min_track_seconds=2.0)

    assert track.distance_m == pytest.approx(20.0)
    assert track.mapped_seconds == pytest.approx(4.0)


def test_track_below_minimum_duration_is_dropped():
    frames = frames_from(straight_line(1, 0, speed_ms=5.0, seconds=2.0))
    assert track_summaries(frames, min_track_seconds=3.0) == []


def test_team_totals_aggregate_only_that_team():
    tracks = [
        TrackSummary(1, 0, "player", 10.0, 50.0, 18.0, 25.0),
        TrackSummary(2, 0, "player", 10.0, 30.0, 10.8, 20.0),
        TrackSummary(3, 1, "player", 10.0, 90.0, 32.4, 30.0),
        TrackSummary(4, None, "referee", 10.0, 70.0, 25.2, 40.0),
    ]
    totals = team_totals(tracks, 0)

    assert totals["distance_m"] == pytest.approx(80.0)
    assert totals["avg_speed_kmh"] == pytest.approx(80.0 / 20.0 * 3.6)
    assert totals["top_speed_kmh"] == pytest.approx(25.0)


def symmetric_teams(count=5):
    """count players per team, mirrored across the halfway line of a 120x70 pitch."""
    players = []
    for index in range(count):
        y = 10.0 + index * 12.0
        players.append(PlayerSample(index, "player", 0, 30.0, y))
        players.append(PlayerSample(100 + index, "player", 1, 90.0, y))
    return tuple(players)


def test_symmetric_teams_split_dominance_evenly():
    frames = [FrameSample(t=0.0, players=symmetric_teams(), ball_xy_m=None)]
    series = dominance_series(frames, length_m=120.0, width_m=70.0)

    assert len(series) == 1
    assert series[0]["a_pct"] == pytest.approx(50.0)
    assert dominance_share(series) == (50.0, 50.0)


def test_dominance_skips_frames_with_too_few_players():
    frames = [FrameSample(t=0.0, players=symmetric_teams(4), ball_xy_m=None)]

    assert dominance_series(frames, length_m=120.0, width_m=70.0) == []
    assert dominance_share([]) is None


def test_possession_goes_to_the_nearest_player_inside_the_radius():
    near_a = PlayerSample(1, "player", 0, 50.0, 35.0)
    far_b = PlayerSample(2, "player", 1, 80.0, 35.0)
    frames = [
        FrameSample(0.0, (near_a, far_b), (51.0, 35.0)),
        FrameSample(0.1, (near_a, far_b), (79.0, 35.0)),
        FrameSample(0.2, (near_a, far_b), (65.0, 35.0)),  # nobody within 3 m
        FrameSample(0.3, (near_a, far_b), None),  # ball not detected
    ]

    assert possession(frames) == (50.0, 50.0)


def test_possession_is_none_when_nobody_ever_holds_the_ball():
    lone = PlayerSample(1, "player", 0, 10.0, 10.0)
    frames = [FrameSample(0.0, (lone,), (110.0, 60.0))]

    assert possession(frames) is None


def test_heatmap_puts_the_player_in_the_right_cell():
    player = PlayerSample(1, "player", 0, 5.0, 5.0)
    frames = [FrameSample(0.0, (player,), None)]

    grid = heatmap(frames, 0, length_m=120.0, width_m=70.0)

    assert len(grid) == 14 and len(grid[0]) == 24
    assert grid[1][1] == pytest.approx(1.0)
    assert math.isclose(sum(sum(row) for row in grid), 1.0)


def test_heatmap_of_the_other_team_is_empty():
    player = PlayerSample(1, "player", 0, 5.0, 5.0)
    frames = [FrameSample(0.0, (player,), None)]

    assert all(value == 0.0 for row in heatmap(frames, 1, length_m=120.0, width_m=70.0) for value in row)
