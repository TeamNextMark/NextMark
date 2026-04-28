# NextMark Manual Profiling

This folder contains a **manual-only** system observation tool for Jetson Nano.

The tool does not run automatically. An admin starts it on demand, lets users interact with the system normally, and receives a summary report when the observation window ends.

## What It Collects

- `tegrastats` (Jetson CPU/GPU/RAM/temp)
- `vmstat` (CPU and memory pressure)
- `iostat` (disk activity), if installed
- `docker stats` snapshots, if Docker is available

## Quick Start

1. Open a shell on the Jetson host.
2. Change into this folder.
3. Run a timed observation session:

```bash
./run_observation.sh --duration 600 --interval 2 --label normal-usage
```

When the timer ends, the script writes files under `profiling/runs/<timestamp>_<label>/` and creates:

- `summary.md`
- `summary.csv`

## Requirements

- Linux on Jetson (L4T)
- `bash`
- `python3`
- `tegrastats` (normally present on Jetson)
- Optional: `sysstat` package for `iostat`

## Notes

- This is for manual execution only; there is no scheduler or service setup.
- Start it only when an admin wants to observe a fixed time window.
- If needed, run `chmod +x run_observation.sh` once.
