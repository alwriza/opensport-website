"""Constants for the match-analysis worker. No logic, no I/O."""

# --- pinned upstream pipeline -------------------------------------------------
# github.com/roboflow/sports, verified by reading examples/soccer at this commit.
ROBOFLOW_SPORTS_SHA = "42c80c06b6b65a7f89455b89fe31cdf4c38ba227"

# Weights are published as plain Google Drive files by examples/soccer/setup.sh.
# There is no Roboflow API in the path: nothing is ever sent off-machine.
MODEL_IDS = {
    "player": "football-player-detection.pt",
    "pitch": "football-pitch-detection.pt",
    "ball": "football-ball-detection.pt",
}
MODEL_DRIVE_IDS = {
    "player": "17PXFNlx-jI7VjVo_vQnB1sONjRyvoB-q",
    "pitch": "1Ma5Kt86tgpdjCTKfum79YMgNnSjcoOyf",
    "ball": "1isw4wx-MK9h9LMr36VvIWlJD6ppUvw7V",
}
SIGLIP_MODEL_PATH = "google/siglip-base-patch16-224"

# --- detection class ids (examples/soccer/main.py) ----------------------------
BALL_CLASS_ID = 0
GOALKEEPER_CLASS_ID = 1
PLAYER_CLASS_ID = 2
REFEREE_CLASS_ID = 3

ROLE_BY_CLASS_ID = {
    GOALKEEPER_CLASS_ID: "goalkeeper",
    PLAYER_CLASS_ID: "player",
    REFEREE_CLASS_ID: "referee",
}

# --- inference ----------------------------------------------------------------
PLAYER_IMGSZ = 1280
BALL_SLICE_WH = (640, 640)
BALL_IMGSZ = 640
BALL_NMS_THRESHOLD = 0.1
BALL_TRACKER_BUFFER = 20
BYTETRACK_MIN_CONSECUTIVE_FRAMES = 3
# Frames sampled for the SigLIP/UMAP/KMeans team fit, in source frames.
TEAM_FIT_STRIDE = 60
# The pitch model is trained with a two-value kpt_shape, so ultralytics reports no
# per-keypoint confidence and sv.KeyPoints.keypoint_confidence comes back None. A
# keypoint the model did not place is left at the origin, so that is what we filter on.
MIN_KEYPOINT_PIXEL = 1.0
# cv2.findHomography needs four correspondences.
MIN_PITCH_KEYPOINTS = 4

# --- analysis (section 6 of the spec) -----------------------------------------
ANALYSIS_FPS = 10
MAX_ANALYZE_SECONDS = 300
MAX_PLAYER_SPEED_MS = 12.0
SPEED_WINDOW_SECONDS = 1.0
MIN_TRACK_SECONDS = 3.0
POSSESSION_RADIUS_M = 3.0
MIN_BALL_COVERAGE = 0.30
MIN_DOMINANCE_PLAYERS_PER_TEAM = 5
MIN_HOMOGRAPHY_COVERAGE = 0.30
# A track that vanishes for longer than this is not joined across the hole:
# the straight line over the gap is not real distance travelled.
MAX_TRACK_GAP_SECONDS = 1.0

# Heatmap grid, aspect-matched to the pitch config (120 m x 70 m -> 24 x 14).
HEATMAP_COLS = 24
HEATMAP_ROWS = 14
# Pitch dominance is a Voronoi area share, sampled on this grid.
DOMINANCE_GRID_STEP_M = 2.0

# --- supabase -----------------------------------------------------------------
TABLE = "match_analyses"
VIDEO_BUCKET = "match-videos"
RESULTS_BUCKET = "match-results"
CLAIM_RPC = "claim_next_match_analysis"
POLL_INTERVAL_SECONDS = 10

# --- failure codes ------------------------------------------------------------
ERROR_PITCH_CALIBRATION = "pitch_calibration_insufficient"
