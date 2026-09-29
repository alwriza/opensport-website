"""Wraps the pinned roboflow/sports soccer pipeline.

Video path in, raw per-frame records out. No metrics are computed here.

Privacy: every model is loaded from a local file or a local HuggingFace cache and
run in-process. No frame is ever sent to an inference API.
"""

from __future__ import annotations

import os
import subprocess
from dataclasses import dataclass

import numpy as np
import supervision as sv
from ultralytics import YOLO

from sports.common.ball import BallTracker
from sports.common.team import TeamClassifier
from sports.common.view import ViewTransformer
from sports.configs.soccer import SoccerPitchConfiguration

from config import (
    ANALYSIS_FPS,
    BALL_IMGSZ,
    BALL_NMS_THRESHOLD,
    BALL_SLICE_WH,
    BALL_TRACKER_BUFFER,
    BYTETRACK_MIN_CONSECUTIVE_FRAMES,
    GOALKEEPER_CLASS_ID,
    MAX_ANALYZE_SECONDS,
    MIN_KEYPOINT_PIXEL,
    MIN_PITCH_KEYPOINTS,
    MODEL_IDS,
    PLAYER_CLASS_ID,
    PLAYER_IMGSZ,
    REFEREE_CLASS_ID,
    ROLE_BY_CLASS_ID,
    TEAM_FIT_STRIDE,
)
from metrics import FrameSample, PlayerSample

CM_TO_M = 100.0

TEAM_COLORS = ["#FF1493", "#00BFFF", "#FFD700"]
ELLIPSE_ANNOTATOR = sv.EllipseAnnotator(
    color=sv.ColorPalette.from_hex(TEAM_COLORS), thickness=2
)
LABEL_ANNOTATOR = sv.LabelAnnotator(
    color=sv.ColorPalette.from_hex(TEAM_COLORS),
    text_color=sv.Color.from_hex("#FFFFFF"),
    text_padding=5,
    text_thickness=1,
    text_position=sv.Position.BOTTOM_CENTER,
)
REFEREE_COLOR_INDEX = 2


@dataclass
class PipelineOutput:
    frames: list[FrameSample]  # only frames that had a valid homography
    analyzed_frames: int
    mapped_frames: int
    ball_frames: int
    analyzed_seconds: float
    analysis_fps: float
    pitch_length_m: float
    pitch_width_m: float
    annotated_video_path: str


def _weights(weights_dir: str, key: str) -> str:
    path = os.path.join(weights_dir, MODEL_IDS[key])
    if not os.path.isfile(path):
        raise FileNotFoundError(f"missing {key} weights at {path}; run setup.sh")
    return path


def _sampling(video_info: sv.VideoInfo) -> tuple[int, float, int]:
    """Frame stride, the fps it actually yields, and the last source frame to read."""
    stride = max(1, round(video_info.fps / ANALYSIS_FPS))
    end = min(video_info.total_frames, int(MAX_ANALYZE_SECONDS * video_info.fps))
    return stride, video_info.fps / stride, end


def _collect_team_crops(model: YOLO, video_path: str, end: int) -> list[np.ndarray]:
    frames = sv.get_video_frames_generator(
        source_path=video_path, stride=TEAM_FIT_STRIDE, end=end
    )
    crops: list[np.ndarray] = []
    for frame in frames:
        result = model(frame, imgsz=PLAYER_IMGSZ, verbose=False)[0]
        detections = sv.Detections.from_ultralytics(result)
        players = detections[detections.class_id == PLAYER_CLASS_ID]
        crops += [sv.crop_image(frame, xyxy) for xyxy in players.xyxy]
    if not crops:
        raise RuntimeError("no player crops found; the clip does not show a match")
    return crops


def _pitch_transformer(
    model: YOLO, frame: np.ndarray, targets_m: np.ndarray
) -> ViewTransformer | None:
    """Homography from image pixels to pitch metres, or None if the frame is unusable."""
    result = model(frame, verbose=False)[0]
    keypoints = sv.KeyPoints.from_ultralytics(result)
    if len(keypoints.xy) == 0:
        return None
    xy = keypoints.xy[0]
    mask = (xy[:, 0] > MIN_KEYPOINT_PIXEL) & (xy[:, 1] > MIN_KEYPOINT_PIXEL)
    if int(mask.sum()) < MIN_PITCH_KEYPOINTS:
        return None
    return ViewTransformer(
        source=xy[mask].astype(np.float32),
        target=targets_m[mask].astype(np.float32),
    )


def _resolve_goalkeeper_teams(
    players_xy: np.ndarray, players_team: np.ndarray, goalkeepers_xy: np.ndarray
) -> list[int | None]:
    """Assign each goalkeeper to the nearer team centroid.

    Unlike the upstream example, a frame where one team has no outfield player
    leaves the goalkeepers unassigned instead of silently producing NaN centroids.
    """
    if len(goalkeepers_xy) == 0:
        return []
    if not ((players_team == 0).any() and (players_team == 1).any()):
        return [None] * len(goalkeepers_xy)
    centroids = np.array(
        [players_xy[players_team == 0].mean(axis=0), players_xy[players_team == 1].mean(axis=0)]
    )
    distances = np.linalg.norm(goalkeepers_xy[:, None, :] - centroids[None, :, :], axis=2)
    return [int(index) for index in np.argmin(distances, axis=1)]


def _encode_for_web(raw_path: str, out_path: str) -> str:
    """Re-encode to H.264/yuv420p so browsers can play it. VideoSink writes mp4v."""
    subprocess.run(
        [
            "ffmpeg", "-y", "-loglevel", "error", "-i", raw_path,
            "-c:v", "libx264", "-preset", "veryfast", "-crf", "23",
            "-pix_fmt", "yuv420p", "-movflags", "+faststart", out_path,
        ],
        check=True,
    )
    os.remove(raw_path)
    return out_path


def analyze(
    video_path: str, annotated_out_path: str, weights_dir: str, device: str
) -> PipelineOutput:
    """Run detection, tracking, team classification and homography over one clip."""
    pitch_config = SoccerPitchConfiguration()
    targets_m = np.array(pitch_config.vertices, dtype=np.float32) / CM_TO_M

    player_model = YOLO(_weights(weights_dir, "player")).to(device=device)
    pitch_model = YOLO(_weights(weights_dir, "pitch")).to(device=device)
    ball_model = YOLO(_weights(weights_dir, "ball")).to(device=device)

    video_info = sv.VideoInfo.from_video_path(video_path)
    stride, analysis_fps, end = _sampling(video_info)

    team_classifier = TeamClassifier(device=device)
    team_classifier.fit(_collect_team_crops(player_model, video_path, end))

    def ball_slice(image_slice: np.ndarray) -> sv.Detections:
        result = ball_model(image_slice, imgsz=BALL_IMGSZ, verbose=False)[0]
        return sv.Detections.from_ultralytics(result)

    slicer = sv.InferenceSlicer(
        callback=ball_slice,
        overlap_filter=sv.OverlapFilter.NONE,
        slice_wh=BALL_SLICE_WH,
    )
    ball_tracker = BallTracker(buffer_size=BALL_TRACKER_BUFFER)
    tracker = sv.ByteTrack(
        minimum_consecutive_frames=BYTETRACK_MIN_CONSECUTIVE_FRAMES,
        frame_rate=max(1, round(analysis_fps)),
    )

    records: list[FrameSample] = []
    analyzed = mapped = ball_seen = 0
    raw_path = annotated_out_path + ".raw.mp4"
    sink_info = sv.VideoInfo(
        width=video_info.width, height=video_info.height, fps=max(1, round(analysis_fps))
    )

    with sv.VideoSink(raw_path, sink_info) as sink:
        frames = sv.get_video_frames_generator(
            source_path=video_path, stride=stride, end=end
        )
        for index, frame in enumerate(frames):
            t = index * stride / video_info.fps
            analyzed += 1

            result = player_model(frame, imgsz=PLAYER_IMGSZ, verbose=False)[0]
            detections = tracker.update_with_detections(
                sv.Detections.from_ultralytics(result)
            )
            players = detections[detections.class_id == PLAYER_CLASS_ID]
            goalkeepers = detections[detections.class_id == GOALKEEPER_CLASS_ID]
            referees = detections[detections.class_id == REFEREE_CLASS_ID]

            players_team = team_classifier.predict(
                [sv.crop_image(frame, xyxy) for xyxy in players.xyxy]
            )
            players_xy = players.get_anchors_coordinates(sv.Position.BOTTOM_CENTER)
            goalkeepers_xy = goalkeepers.get_anchors_coordinates(sv.Position.BOTTOM_CENTER)
            goalkeepers_team = _resolve_goalkeeper_teams(
                players_xy, np.asarray(players_team), goalkeepers_xy
            )

            ball = ball_tracker.update(slicer(frame).with_nms(threshold=BALL_NMS_THRESHOLD))
            if len(ball) > 0:
                ball_seen += 1

            annotated = frame.copy()
            people = sv.Detections.merge([players, goalkeepers, referees])
            if len(people) > 0:
                colors = np.array(
                    [int(team) for team in players_team]
                    + [REFEREE_COLOR_INDEX if team is None else team for team in goalkeepers_team]
                    + [REFEREE_COLOR_INDEX] * len(referees)
                )
                labels = [f"#{tracker_id}" for tracker_id in people.tracker_id]
                annotated = ELLIPSE_ANNOTATOR.annotate(annotated, people, custom_color_lookup=colors)
                annotated = LABEL_ANNOTATOR.annotate(
                    annotated, people, labels, custom_color_lookup=colors
                )
            sink.write_frame(annotated)

            transformer = _pitch_transformer(pitch_model, frame, targets_m)
            if transformer is None:
                continue
            mapped += 1

            samples: list[PlayerSample] = []
            groups = (
                (players, [int(team) for team in players_team]),
                (goalkeepers, goalkeepers_team),
                (referees, [None] * len(referees)),
            )
            for group, group_teams in groups:
                if len(group) == 0:
                    continue
                xy_m = transformer.transform_points(
                    group.get_anchors_coordinates(sv.Position.BOTTOM_CENTER).astype(np.float32)
                )
                for tracker_id, class_id, team, (x_m, y_m) in zip(
                    group.tracker_id, group.class_id, group_teams, xy_m
                ):
                    samples.append(
                        PlayerSample(
                            track_id=int(tracker_id),
                            role=ROLE_BY_CLASS_ID[int(class_id)],
                            team=team,
                            x_m=float(x_m),
                            y_m=float(y_m),
                        )
                    )

            ball_xy_m = None
            if len(ball) > 0:
                ball_point = transformer.transform_points(
                    ball.get_anchors_coordinates(sv.Position.CENTER).astype(np.float32)
                )[0]
                ball_xy_m = (float(ball_point[0]), float(ball_point[1]))

            records.append(FrameSample(t=round(t, 3), players=tuple(samples), ball_xy_m=ball_xy_m))

    return PipelineOutput(
        frames=records,
        analyzed_frames=analyzed,
        mapped_frames=mapped,
        ball_frames=ball_seen,
        analyzed_seconds=round(analyzed * stride / video_info.fps, 2),
        analysis_fps=round(analysis_fps, 3),
        pitch_length_m=pitch_config.length / CM_TO_M,
        pitch_width_m=pitch_config.width / CM_TO_M,
        annotated_video_path=_encode_for_web(raw_path, annotated_out_path),
    )
