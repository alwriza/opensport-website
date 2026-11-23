"""Which team (model cluster 0/1) played the ball at a given frame.

The cluster of the outfield player whose feet are nearest the ball. Clusters are
anonymous: the review page maps them to team A/B with one click per segment.
"""

from __future__ import annotations

import os

import cv2
import numpy as np
import supervision as sv
from ultralytics import YOLO

from sports.common.team import TeamClassifier

from config import (
    BALL_IMGSZ,
    BALL_NMS_THRESHOLD,
    BALL_SEARCH_FRAMES,
    BALL_SLICE_WH,
    PLAYER_CLASS_ID,
    PLAYER_IMGSZ,
    TEAM_FIT_STRIDE_FRAMES,
)


class TeamAssigner:
    def __init__(self, weights_dir: str, device: str):
        self._players = YOLO(os.path.join(weights_dir, "football-player-detection.pt")).to(device=device)
        ball_model = YOLO(os.path.join(weights_dir, "football-ball-detection.pt")).to(device=device)

        def ball_slice(image_slice: np.ndarray) -> sv.Detections:
            return sv.Detections.from_ultralytics(ball_model(image_slice, imgsz=BALL_IMGSZ, verbose=False)[0])

        self._slicer = sv.InferenceSlicer(
            callback=ball_slice, overlap_filter=sv.OverlapFilter.NONE, slice_wh=BALL_SLICE_WH
        )
        self._classifier = TeamClassifier(device=device)
        self._video: cv2.VideoCapture | None = None
        self._frame_count = 0

    def fit(self, clip_path: str) -> None:
        crops: list[np.ndarray] = []
        for frame in sv.get_video_frames_generator(source_path=clip_path, stride=TEAM_FIT_STRIDE_FRAMES):
            crops += [sv.crop_image(frame, xyxy) for xyxy in self._detect_players(frame).xyxy]
        if len(crops) < 20:
            raise RuntimeError(f"only {len(crops)} player crops in the clip; it does not show a match")
        self._classifier.fit(crops)
        self._video = cv2.VideoCapture(clip_path)
        self._frame_count = int(self._video.get(cv2.CAP_PROP_FRAME_COUNT))

    def cluster_at(self, frame_index: int) -> int | None:
        """Cluster of the player nearest the ball, or None when no ball is found nearby."""
        for offset in _search_order(BALL_SEARCH_FRAMES):
            index = frame_index + offset
            if not 0 <= index < self._frame_count:
                continue
            frame = self._read(index)
            ball = self._slicer(frame).with_nms(threshold=BALL_NMS_THRESHOLD)
            if len(ball) == 0:
                continue
            ball_xy = ball.get_anchors_coordinates(sv.Position.CENTER)[int(np.argmax(ball.confidence))]
            players = self._detect_players(frame)
            if len(players) == 0:
                return None
            feet = players.get_anchors_coordinates(sv.Position.BOTTOM_CENTER)
            nearest = int(np.argmin(np.linalg.norm(feet - ball_xy, axis=1)))
            return int(self._classifier.predict([sv.crop_image(frame, players.xyxy[nearest])])[0])
        return None

    def _detect_players(self, frame: np.ndarray) -> sv.Detections:
        detections = sv.Detections.from_ultralytics(self._players(frame, imgsz=PLAYER_IMGSZ, verbose=False)[0])
        return detections[detections.class_id == PLAYER_CLASS_ID]

    def _read(self, index: int) -> np.ndarray:
        if self._video is None:
            raise RuntimeError("fit() must run before cluster_at()")
        self._video.set(cv2.CAP_PROP_POS_FRAMES, index)
        ok, frame = self._video.read()
        if not ok:
            raise RuntimeError(f"cannot read frame {index}")
        return frame


def _search_order(radius: int) -> list[int]:
    order = [0]
    for d in range(1, radius + 1):
        order += [-d, d]
    return order
