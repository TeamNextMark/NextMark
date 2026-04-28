#!/usr/bin/env python3
"""Analyze a manual observation run and produce simple summary outputs."""

from __future__ import annotations

import argparse
import csv
import re
from pathlib import Path
from statistics import mean


def percentile(values: list[float], p: float) -> float:
    if not values:
        return 0.0
    sorted_vals = sorted(values)
    idx = int(round((p / 100.0) * (len(sorted_vals) - 1)))
    return sorted_vals[max(0, min(idx, len(sorted_vals) - 1))]


def parse_metadata(path: Path) -> dict[str, str]:
    data: dict[str, str] = {}
    if not path.exists():
        return data
    for line in path.read_text(encoding="utf-8", errors="ignore").splitlines():
        if "=" in line:
            key, value = line.split("=", 1)
            data[key.strip()] = value.strip()
    return data


def parse_tegrastats(path: Path) -> dict[str, list[float]]:
    cpu_values: list[float] = []
    ram_pct_values: list[float] = []
    gpu_values: list[float] = []
    cpu_temp_values: list[float] = []
    gpu_temp_values: list[float] = []

    if not path.exists():
        return {
            "cpu": cpu_values,
            "ram_pct": ram_pct_values,
            "gpu": gpu_values,
            "cpu_temp": cpu_temp_values,
            "gpu_temp": gpu_temp_values,
        }

    ram_re = re.compile(r"RAM\s+(\d+)/(\d+)MB")
    cpu_block_re = re.compile(r"CPU\s*\[([^\]]+)\]")
    cpu_entry_re = re.compile(r"(\d+)%@")
    gpu_re = re.compile(r"GR3D_FREQ\s+(\d+)%")
    cpu_temp_re = re.compile(r"CPU@([0-9]+(?:\.[0-9]+)?)C")
    gpu_temp_re = re.compile(r"GPU@([0-9]+(?:\.[0-9]+)?)C")

    for line in path.read_text(encoding="utf-8", errors="ignore").splitlines():
        ram_match = ram_re.search(line)
        if ram_match:
            used = float(ram_match.group(1))
            total = float(ram_match.group(2))
            if total > 0:
                ram_pct_values.append((used / total) * 100.0)

        cpu_block_match = cpu_block_re.search(line)
        if cpu_block_match:
            entries = cpu_entry_re.findall(cpu_block_match.group(1))
            if entries:
                core_vals = [float(v) for v in entries]
                cpu_values.append(mean(core_vals))

        gpu_match = gpu_re.search(line)
        if gpu_match:
            gpu_values.append(float(gpu_match.group(1)))

        cpu_temp_match = cpu_temp_re.search(line)
        if cpu_temp_match:
            cpu_temp_values.append(float(cpu_temp_match.group(1)))

        gpu_temp_match = gpu_temp_re.search(line)
        if gpu_temp_match:
            gpu_temp_values.append(float(gpu_temp_match.group(1)))

    return {
        "cpu": cpu_values,
        "ram_pct": ram_pct_values,
        "gpu": gpu_values,
        "cpu_temp": cpu_temp_values,
        "gpu_temp": gpu_temp_values,
    }


def parse_vmstat(path: Path) -> dict[str, list[float]]:
    cpu_used_values: list[float] = []
    io_wait_values: list[float] = []

    if not path.exists():
        return {"vm_cpu_used": cpu_used_values, "vm_iowait": io_wait_values}

    for line in path.read_text(encoding="utf-8", errors="ignore").splitlines():
        line = line.strip()
        if not line or line.startswith("procs") or line.startswith("r  b"):
            continue

        parts = line.split()
        # vmstat data lines usually have 17 columns.
        if len(parts) < 17:
            continue

        try:
            us = float(parts[12])
            sy = float(parts[13])
            wa = float(parts[15])
        except ValueError:
            continue

        cpu_used_values.append(us + sy)
        io_wait_values.append(wa)

    return {"vm_cpu_used": cpu_used_values, "vm_iowait": io_wait_values}


def summarize(values: list[float]) -> dict[str, float]:
    if not values:
        return {"avg": 0.0, "p95": 0.0, "max": 0.0, "high_pct": 0.0}

    return {
        "avg": mean(values),
        "p95": percentile(values, 95),
        "max": max(values),
        "high_pct": 0.0,
    }


def main() -> None:
    parser = argparse.ArgumentParser(description="Analyze manual observation run")
    parser.add_argument("--run-dir", required=True, help="Path to observation run directory")
    args = parser.parse_args()

    run_dir = Path(args.run_dir).resolve()
    metadata = parse_metadata(run_dir / "metadata.env")

    tegra = parse_tegrastats(run_dir / "tegrastats.log")
    vmstat = parse_vmstat(run_dir / "vmstat.log")

    metric_rows: list[tuple[str, str, dict[str, float], float]] = []

    threshold_map = {
        "cpu.util_pct": 85.0,
        "ram.util_pct": 90.0,
        "gpu.util_pct": 90.0,
        "cpu.temp_c": 80.0,
        "gpu.temp_c": 80.0,
        "vm.cpu_used_pct": 85.0,
        "vm.iowait_pct": 20.0,
    }

    source_data = {
        "cpu.util_pct": ("tegrastats", tegra.get("cpu", [])),
        "ram.util_pct": ("tegrastats", tegra.get("ram_pct", [])),
        "gpu.util_pct": ("tegrastats", tegra.get("gpu", [])),
        "cpu.temp_c": ("tegrastats", tegra.get("cpu_temp", [])),
        "gpu.temp_c": ("tegrastats", tegra.get("gpu_temp", [])),
        "vm.cpu_used_pct": ("vmstat", vmstat.get("vm_cpu_used", [])),
        "vm.iowait_pct": ("vmstat", vmstat.get("vm_iowait", [])),
    }

    for metric_name, (source, values) in source_data.items():
        stats = summarize(values)
        threshold = threshold_map.get(metric_name, 0.0)
        if values and threshold > 0:
            stats["high_pct"] = 100.0 * (sum(1 for v in values if v >= threshold) / len(values))
        metric_rows.append((metric_name, source, stats, threshold))

    summary_csv = run_dir / "summary.csv"
    with summary_csv.open("w", encoding="utf-8", newline="") as f:
        writer = csv.writer(f)
        writer.writerow([
            "metric",
            "source",
            "avg",
            "p95",
            "max",
            "threshold",
            "high_sample_pct",
        ])
        for metric, source, stats, threshold in metric_rows:
            writer.writerow(
                [
                    metric,
                    source,
                    f"{stats['avg']:.2f}",
                    f"{stats['p95']:.2f}",
                    f"{stats['max']:.2f}",
                    f"{threshold:.2f}",
                    f"{stats['high_pct']:.2f}",
                ]
            )

    summary_md = run_dir / "summary.md"
    lines: list[str] = []
    lines.append("# NextMark Observation Summary")
    lines.append("")
    lines.append("## Run")
    lines.append(f"- Run ID: {metadata.get('RUN_ID', run_dir.name)}")
    lines.append(f"- Label: {metadata.get('LABEL', 'manual')}")
    lines.append(f"- Host: {metadata.get('HOSTNAME', 'unknown')}")
    lines.append(f"- Start (UTC): {metadata.get('START_UTC', 'unknown')}")
    lines.append(f"- End (UTC): {metadata.get('END_UTC', 'unknown')}")
    lines.append(f"- Duration (s): {metadata.get('DURATION_SECONDS', 'unknown')}")
    lines.append(f"- Interval (s): {metadata.get('INTERVAL_SECONDS', 'unknown')}")
    lines.append("")
    lines.append("## Metrics")
    lines.append("")
    lines.append("| Metric | Source | Avg | P95 | Max | Threshold | % Samples >= Threshold |")
    lines.append("|---|---|---:|---:|---:|---:|---:|")

    for metric, source, stats, threshold in metric_rows:
        lines.append(
            "| "
            f"{metric} | {source} | {stats['avg']:.2f} | {stats['p95']:.2f} | {stats['max']:.2f} | "
            f"{threshold:.2f} | {stats['high_pct']:.2f}% |"
        )

    lines.append("")
    lines.append("## Notes")
    lines.append("- This run is manual and time-boxed.")
    lines.append("- Use `summary.csv` for trend comparisons across runs.")

    summary_md.write_text("\n".join(lines) + "\n", encoding="utf-8")


if __name__ == "__main__":
    main()
