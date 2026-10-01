#!/usr/bin/env bash
# Capture demo assets (video, CLI/test outputs, authentic screenshots) from
# local sibling repositories into the committed src/assets/ and
# src/data/captured/ directories.
#
# Designed to be safe to run from any checkout or linked worktree. Sibling
# repositories are expected next to the portfolio repo (e.g.
# /home/user/projects/{portfolio,transcribe-plus,...}) or provided via
# PORTFOLIO_SIBLINGS.
#
# This script is a capture tool, not a build step: it requires the sibling
# repos to be present and every command to succeed, and it fails loudly if
# either is not true. There are no silent fallbacks - committed assets should
# always reflect a real, successful run of the sibling suites.
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

# Media lives in src/assets/ so Vite imports them through the bundler and
# emits content-hashed URLs under dist/assets/*-[hash].[ext].
ASSET_DIR="$REPO_ROOT/src/assets"
SCREENSHOT_DIR="$ASSET_DIR/screenshots"
CAPTURED_DIR="$REPO_ROOT/src/data/captured"

mkdir -p "$ASSET_DIR" "$SCREENSHOT_DIR" "$CAPTURED_DIR"

WORK_DIR="$(mktemp -d)"
trap 'rm -rf "$WORK_DIR"' EXIT

echo "repo root:      $REPO_ROOT"
echo "sibling base:   $SIBLING_BASE"

require_dir() {
  local dir="$1"
  if [[ ! -d "$dir" ]]; then
    echo "capture: required sibling directory missing: $dir" >&2
    exit 1
  fi
}

require_file() {
  local file="$1"
  if [[ ! -f "$file" ]]; then
    echo "capture: required sibling asset missing: $file" >&2
    exit 1
  fi
}

# Start a fresh captured demo file for a project, discarding any committed
# template. Called before the project's first command so a multi-command demo
# accumulates correctly.
reset_capture() {
  local id="$1"
  rm -f "$CAPTURED_DIR/$id.json"
}

# capture_cmd <id> <workdir> <label> [args...]
# Runs a real command in its sibling repo and appends its verbatim stdout to
# src/data/captured/<id>.json. A non-zero exit aborts the whole capture run.
capture_cmd() {
  local id="$1" workdir="$2" label="$3"
  shift 3
  require_dir "$workdir"
  local raw="$WORK_DIR/${id}-cmd-$RANDOM.txt"
  local start end durationMs code=0
  start=$(date +%s%3N)
  (cd "$workdir" && timeout 300 "$@") >"$raw" 2>&1 || code=$?
  end=$(date +%s%3N)
  durationMs=$((end - start))
  if [[ "$code" -ne 0 ]]; then
    echo "capture/$id: '${label}' exited ${code}" >&2
    cat "$raw" >&2
    return "$code"
  fi
  node "$SCRIPT_DIR/capture-to-json.mjs" "$id" "$label" "$code" "$durationMs" "$raw"
  echo "capture/$id: '${label}' (exit 0, ${durationMs}ms)"
}

# ---------------------------------------------------------------------------
# 1. Video demo (clip.mp4) from transcribe-plus
# ---------------------------------------------------------------------------
CLIP_SRC="$SIBLING_BASE/transcribe-plus/frontend/public/clip.mp4"
require_file "$CLIP_SRC"
cp "$CLIP_SRC" "$ASSET_DIR/clip.mp4"
echo "clip.mp4: copied $(stat -c%s "$CLIP_SRC") bytes from transcribe-plus"

# ---------------------------------------------------------------------------
# 2. Real CLI / test-suite output captures
# ---------------------------------------------------------------------------
# open-dungeon: Vercel entrypoint unit suite (node:test).
reset_capture open-dungeon
capture_cmd open-dungeon "$SIBLING_BASE/open-dungeon" \
  "node --test tests/unit/vercelEntry.test.mjs" \
  node --test tests/unit/vercelEntry.test.mjs

# agentic-resume-builder: argparse CLI inspection surface, run through the
# project virtualenv interpreter.
AGENTIC_DIR="$SIBLING_BASE/agentic-resume-builder"
AGENTIC_PY="$AGENTIC_DIR/.venv/bin/python"
require_dir "$AGENTIC_DIR"
if [[ ! -x "$AGENTIC_PY" ]]; then
  echo "capture/agentic-resume-builder: missing interpreter $AGENTIC_PY" >&2
  exit 1
fi
reset_capture agentic-resume-builder
capture_cmd agentic-resume-builder "$AGENTIC_DIR" \
  "python3 build_resume.py --help" "$AGENTIC_PY" build_resume.py --help
capture_cmd agentic-resume-builder "$AGENTIC_DIR" \
  "python3 build_resume.py --schema" "$AGENTIC_PY" build_resume.py --schema
capture_cmd agentic-resume-builder "$AGENTIC_DIR" \
  "python3 build_resume.py --list" "$AGENTIC_PY" build_resume.py --list
capture_cmd agentic-resume-builder "$AGENTIC_DIR" \
  "python3 build_resume.py --lint" "$AGENTIC_PY" build_resume.py --lint

# transcribe-plus, sandwave-sim, attention-max: real test suites.
reset_capture transcribe-plus
capture_cmd transcribe-plus "$SIBLING_BASE/transcribe-plus" \
  "npm test" \
  npm test

reset_capture sandwave-sim
capture_cmd sandwave-sim "$SIBLING_BASE/sandwave-sim" \
  "npm test" \
  npm test

reset_capture attention-max
capture_cmd attention-max "$SIBLING_BASE/attention-max" \
  "npm test" \
  npm test

# ---------------------------------------------------------------------------
# 3. Authentic project screenshot cards from sibling captures
# ---------------------------------------------------------------------------
# open-dungeon: real 1280x720 canvas capture from the Playwright MCP session.
OD_SHOT="$SIBLING_BASE/open-dungeon/.playwright-mcp/page-2026-09-16T13-50-27-307Z.png"
# pict-climate-risk-viz-chatbot: real 1920x1080 bivariate risk map from repo docs.
PICT_SHOT="$SIBLING_BASE/pict-climate-risk-viz-chatbot/docs/images/fiji_bivariate_map.png"
# attention-max: real Firefox MV3 extension popup UI screenshot.
ATTN_SHOT="$SIBLING_BASE/attention-max/.refs/image.png"

echo "screenshots: ingesting authentic sibling captures"
require_file "$OD_SHOT"
require_file "$PICT_SHOT"
require_file "$ATTN_SHOT"
cp "$OD_SHOT" "$SCREENSHOT_DIR/open-dungeon.png"
cp "$PICT_SHOT" "$SCREENSHOT_DIR/pict-climate-risk-viz-chatbot.png"
cp "$ATTN_SHOT" "$SCREENSHOT_DIR/attention-max.png"
echo "screenshots: copied open-dungeon, pict-climate-risk-viz-chatbot, attention-max"

# sandwave-sim: headless 1280x720 Playwright capture of the live Chladni app.
require_file "$SIBLING_BASE/sandwave-sim/index.html"
node "$SCRIPT_DIR/capture-sandwave.mjs" \
  "$SIBLING_BASE/sandwave-sim/index.html" \
  "$SCREENSHOT_DIR/sandwave-sim.png"

echo "capture-demos complete."