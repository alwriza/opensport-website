"""Constants for the research pipeline. No logic, no I/O."""

import os


def env(name: str) -> str:
    value = os.environ.get(name)
    if not value:
        raise RuntimeError(f"environment variable {name} is not set (see README)")
    return value


# --- T-DEED (github.com/arturxe2/T-DEED, GPL-3.0) -----------------------------
TDEED_SHA = "d953b4de8a2ad941c565e1683c5b07255cbe644e"
TDEED_MODEL = "SoccerNetBall_challenge1"
# Authors' public checkpoint folder (README "Trained models").
TDEED_CHECKPOINT_FOLDER = "https://drive.google.com/drive/folders/1sxZalU_hCwL8ITZCU9VqSWE8dB94lJty"
TDEED_FPS = 25
TDEED_FRAME_WH = (796, 448)
# Every prediction at or above this confidence is stored; review and evaluation
# can raise the bar later, they can never lower it.
TDEED_THRESHOLD = 0.2

# T-DEED's 12 SoccerNet Ball classes -> our 8. None: kept as raw_class only, not reviewed.
CLASS_MAP: dict[str, str | None] = {
    "PASS": "pass",
    "HIGH PASS": "pass",
    "FREE KICK": "pass",
    "DRIVE": "drive",
    "CROSS": "cross",
    "SHOT": "shot",
    "HEADER": "header",
    "PLAYER SUCCESSFUL TACKLE": "tackle",
    "BALL PLAYER BLOCK": "block",
    "THROW IN": "throw_in",
    "GOAL": None,
    "OUT": None,
}

# Seconds of video kept on each side of the segment, so events at its edges still
# get full temporal context. Predictions outside the segment are dropped.
CLIP_PAD_S = 4.0

# --- Roboflow sports (same weights as ml-worker-match) ------------------------
ROBOFLOW_SPORTS_SHA = "42c80c06b6b65a7f89455b89fe31cdf4c38ba227"
WEIGHT_DRIVE_IDS = {
    "football-player-detection.pt": "17PXFNlx-jI7VjVo_vQnB1sONjRyvoB-q",
    "football-ball-detection.pt": "1isw4wx-MK9h9LMr36VvIWlJD6ppUvw7V",
}
PLAYER_CLASS_ID = 2
PLAYER_IMGSZ = 1280
BALL_SLICE_WH = (640, 640)
BALL_IMGSZ = 640
BALL_NMS_THRESHOLD = 0.1
# Team fit: one frame every 2 s of the clip (~300 frames), like ml-worker-match's
# TEAM_FIT_STRIDE. Every second doubled the CPU time (~10 min detection + ~12 min SigLIP).
TEAM_FIT_STRIDE_FRAMES = 50
# Ball search around an event: the event frame first, then up to this many frames each side.
BALL_SEARCH_FRAMES = 3

# --- download ----------------------------------------------------------------
# Video only, at most 1080p: the models never use audio.
YTDLP_FORMAT = "bv*[height<=1080][ext=mp4]/b[height<=1080][ext=mp4]"
