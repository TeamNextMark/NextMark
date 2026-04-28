#!/usr/bin/env bash
set -euo pipefail

usage() {
  cat <<'EOF'
Usage:
  ./run_observation.sh [--duration SECONDS] [--interval SECONDS] [--label NAME]

Options:
  --duration   Observation window in seconds (default: 300)
  --interval   Sampling interval in seconds (default: 2)
  --label      Label used in output folder name (default: manual)
  -h, --help   Show this help
EOF
}

DURATION_SECONDS=300
INTERVAL_SECONDS=2
LABEL="manual"

while [[ $# -gt 0 ]]; do
  case "$1" in
    --duration)
      DURATION_SECONDS="$2"
      shift 2
      ;;
    --interval)
      INTERVAL_SECONDS="$2"
      shift 2
      ;;
    --label)
      LABEL="$2"
      shift 2
      ;;
    -h|--help)
      usage
      exit 0
      ;;
    *)
      echo "Unknown argument: $1"
      usage
      exit 1
      ;;
  esac
done

if ! [[ "$DURATION_SECONDS" =~ ^[0-9]+$ ]] || [[ "$DURATION_SECONDS" -le 0 ]]; then
  echo "--duration must be a positive integer"
  exit 1
fi

if ! [[ "$INTERVAL_SECONDS" =~ ^[0-9]+$ ]] || [[ "$INTERVAL_SECONDS" -le 0 ]]; then
  echo "--interval must be a positive integer"
  exit 1
fi

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
RUNS_DIR="$ROOT_DIR/runs"
SAFE_LABEL="${LABEL// /_}"
RUN_ID="$(date +%Y%m%d_%H%M%S)_${SAFE_LABEL}"
RUN_DIR="$RUNS_DIR/$RUN_ID"

mkdir -p "$RUN_DIR"

METADATA_FILE="$RUN_DIR/metadata.env"
{
  echo "RUN_ID=$RUN_ID"
  echo "LABEL=$LABEL"
  echo "DURATION_SECONDS=$DURATION_SECONDS"
  echo "INTERVAL_SECONDS=$INTERVAL_SECONDS"
  echo "START_UTC=$(date -u +%Y-%m-%dT%H:%M:%SZ)"
  echo "HOSTNAME=$(hostname)"
} > "$METADATA_FILE"

echo "Starting manual observation run: $RUN_ID"
echo "Duration: ${DURATION_SECONDS}s, Interval: ${INTERVAL_SECONDS}s"
echo "Output directory: $RUN_DIR"

declare -a PIDS=()

start_collector() {
  local name="$1"
  local command="$2"
  local output_file="$RUN_DIR/$3"

  echo "[collector] $name -> $output_file"
  bash -lc "$command" > "$output_file" 2>&1 &
  PIDS+=("$!")
}

# Jetson primary telemetry
if command -v tegrastats >/dev/null 2>&1; then
  TEGRA_INTERVAL_MS=$((INTERVAL_SECONDS * 1000))
  start_collector "tegrastats" "timeout ${DURATION_SECONDS}s tegrastats --interval ${TEGRA_INTERVAL_MS}"
else
  echo "tegrastats not found; skipping Jetson-specific metrics" | tee "$RUN_DIR/warnings.log"
fi

# Linux vmstat telemetry
if command -v vmstat >/dev/null 2>&1; then
  start_collector "vmstat" "timeout ${DURATION_SECONDS}s vmstat ${INTERVAL_SECONDS}"
else
  echo "vmstat not found" >> "$RUN_DIR/warnings.log"
fi

# Disk telemetry (optional)
if command -v iostat >/dev/null 2>&1; then
  start_collector "iostat" "timeout ${DURATION_SECONDS}s iostat -dx ${INTERVAL_SECONDS}"
else
  echo "iostat not found (install sysstat for disk metrics)" >> "$RUN_DIR/warnings.log"
fi

# Lightweight docker snapshots (optional)
if command -v docker >/dev/null 2>&1; then
  start_collector "docker-stats" "END=\$(($(date +%s)+${DURATION_SECONDS})); while [ \$(date +%s) -lt \$END ]; do date -u +%Y-%m-%dT%H:%M:%SZ; docker stats --no-stream --format 'table {{.Name}}\t{{.CPUPerc}}\t{{.MemUsage}}\t{{.NetIO}}\t{{.BlockIO}}'; sleep ${INTERVAL_SECONDS}; done" "docker_stats.log"
else
  echo "docker not found; skipping container snapshots" >> "$RUN_DIR/warnings.log"
fi

# Wait for all collectors
for pid in "${PIDS[@]}"; do
  wait "$pid" || true
done

{
  echo "END_UTC=$(date -u +%Y-%m-%dT%H:%M:%SZ)"
} >> "$METADATA_FILE"

echo "Collection complete. Generating summary..."
python3 "$ROOT_DIR/analyze_observation.py" --run-dir "$RUN_DIR"

echo "Done. See: $RUN_DIR/summary.md"
