#!/usr/bin/env bash
# Capture demo assets (video, CLI/test outputs, screenshots) from local sibling
# repositories into the committed public/ and src/data/captured/ directories.
#
# Designed to be safe to run from any checkout or linked worktree. Sibling
# repositories are expected next to the portfolio repo (e.g.
# /home/user/projects/{portfolio,transcribe-plus,...}). When a sibling is
# missing, committed placeholder assets are kept instead so the build and test
# suite never depend on sibling availability.
#
# Never run in production builds - capture once and commit the results.
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Resolve the checkout root. Prefer an explicit PORTFOLIO_ROOT (useful inside
# linked worktrees where the sibling repos are not adjacent), otherwise fall
# back to the git worktree top-level (works in the main checkout and in
# linked worktrees alike).
if [[ -n "${PORTFOLIO_ROOT:-}" ]]; then
  REPO_ROOT="$PORTFOLIO_ROOT"
elif git rev-parse --show-toplevel >/dev/null 2>&1; then
  REPO_ROOT="$(git rev-parse --show-toplevel)"
else
  REPO_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
fi

# Sibling repos live beside the portfolio repo. Overridable (CI, sandbox).
SIBLING_BASE="${PORTFOLIO_SIBLINGS:-$(dirname "$REPO_ROOT")}"

ASSET_DIR="$REPO_ROOT/public/assets"
SCREENSHOT_DIR="$ASSET_DIR/screenshots"
CAPTURED_DIR="$REPO_ROOT/src/data/captured"

mkdir -p "$ASSET_DIR" "$SCREENSHOT_DIR" "$CAPTURED_DIR"

echo "repo root:      $REPO_ROOT"
echo "sibling base:   $SIBLING_BASE"

# ---------------------------------------------------------------------------
# 1. Video demo (clip.mp4) from transcribe-plus
# ---------------------------------------------------------------------------
CLIP_SRC="$SIBLING_BASE/transcribe-plus/frontend/public/clip.mp4"
if [[ -f "$CLIP_SRC" ]]; then
  cp "$CLIP_SRC" "$ASSET_DIR/clip.mp4"
  echo "clip.mp4: copied $(stat -c%s "$CLIP_SRC") bytes from transcribe-plus"
elif command -v ffmpeg >/dev/null 2>&1; then
  echo "clip.mp4: sibling missing; generating placeholder"
  ffmpeg -y \
    -f lavfi -i "color=c=0x111111:s=640x360:d=4:r=24" \
    -f lavfi -i "sine=frequency=440:duration=4" \
    -shortest -c:v libx264 -pix_fmt yuv420p -movflags +faststart \
    -c:a aac -b:a 96k "$ASSET_DIR/clip.mp4" >/dev/null 2>&1
else
  echo "clip.mp4: sibling missing and ffmpeg unavailable; keeping committed asset"
fi

# ---------------------------------------------------------------------------
# 2. Real CLI / test-suite output captures
# ---------------------------------------------------------------------------
# Each block runs the real command in the sibling repo and rewrites
# src/data/captured/<id>.json with the verbatim stdout when the command
# succeeds (exit 0). Non-zero exits (missing toolchain, failing suite) and
# missing siblings keep the committed template so the catalog never shows a
# broken terminal.
capture_run() {
  local id="$1" label="$2" workdir="$3"
  shift 3
  if [[ ! -d "$workdir" ]]; then
    echo "capture/$id: sibling $workdir missing; keeping committed template"
    return 0
  fi
  local tmp
  tmp="$(mktemp)"
  local code=0
  (cd "$workdir" && CI=1 timeout 120 "$@") >"$tmp" 2>&1 || code=$?
  if [[ "$code" -eq 0 ]]; then
    node "$SCRIPT_DIR/capture-to-json.mjs" "$id" "$label" "$code" "$tmp"
    echo "capture/$id: captured '${label}' (exit 0)"
  else
    echo "capture/$id: command exited ${code}; keeping committed template"
  fi
  rm -f "$tmp"
}

capture_run open-dungeon "npm run test:unit" \
  "$SIBLING_BASE/open-dungeon" npm run test:unit || true

capture_run agentic-resume-builder "python3 build_resume.py --help" \
  "$SIBLING_BASE/agentic-resume-builder" python3 build_resume.py --help || true

capture_run pict-climate-risk-viz-chatbot "pytest -q" \
  "$SIBLING_BASE/pict-climate-risk-viz-chatbot" pytest -q || true

capture_run transcribe-plus "npm test" \
  "$SIBLING_BASE/transcribe-plus" npm test || true

capture_run sandwave-sim "npm test" \
  "$SIBLING_BASE/sandwave-sim" npm test || true

capture_run attention-max "npm test" \
  "$SIBLING_BASE/attention-max" npm test || true

# ---------------------------------------------------------------------------
# 3. Project screenshot cards
# ---------------------------------------------------------------------------
echo "screenshots: generating branded preview cards"
timeout 90 node "$SCRIPT_DIR/generate-screenshots.mjs" || echo "screenshots: generator timed out; keeping committed images"

echo "capture-demos complete."