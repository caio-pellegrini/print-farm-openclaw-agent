#!/usr/bin/env python3
"""Run the fixed Cura POC profile and quote engine for a staged STL."""

import argparse
import json
import math
import os
import re
import shutil
import stat
import subprocess
import sys
import tempfile
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
MAX_FILE_BYTES = 25 * 1024 * 1024
MAX_OUTPUT_BYTES = 1_048_576
TIMEOUT_SECONDS = 30
MAX_QUANTITY = 20
CURA_IMAGE = "print-farm-cura-5.13.0:baseline"
PROFILE_MAP = {
    "cura-ultimaker2plus-generic-pla-normal": {
        "label": "Official Ultimaker 2+ / Generic PLA / Normal quality / 0.4 mm nozzle",
        "definition": "/opt/cura/resources/definitions/ultimaker2_plus.def.json",
        "extruder_definition": "/opt/cura/resources/extruders/ultimaker2_plus_extruder_0.def.json",
        "material": "PLA",
        "filament_density_g_cm3": 1.24,
        "filament_diameter_mm": 2.85,
        # Values from Cura's bundled generic_pla material and
        # quality/ultimaker2_plus/{um2p_global_Normal_Quality,
        # pla_0.4_normal}.inst.cfg. The expression values in the official
        # quality profile are evaluated here for its bundled speed_print=50.
        "settings": {
            "layer_height": "0.1",
            "infill_sparse_density": "20",
            "top_bottom_thickness": "0.8",
            "cool_min_layer_time": "5",
            "cool_min_speed": "10",
            "speed_print": "50",
            "speed_layer_0": "30",
            "speed_topbottom": "20",
            "material_diameter": "2.85",
            "material_print_temperature": "200",
            "material_print_temperature_layer_0": "200",
            "material_bed_temperature": "60",
            "material_bed_temperature_layer_0": "60",
            "cool_fan_speed": "100",
            # Explicit values required by CuraEngine's command-line mode.
            "roofing_layer_count": "0",
            "flooring_layer_count": "0",
        },
    }
}
BUSINESS_CONFIG = {
    "material_brl_per_kg": 90.0,
    "machine_brl_per_hour": 2.0,
    "energy_kwh_per_hour": 0.12,
    "energy_brl_per_kwh": 0.95,
    "gross_margin_fraction": 0.40,
    "setup_brl": 0.0,
    "currency": "BRL",
    "source": "Existing quote-engine example defaults; farm must configure before real offers.",
}


def fail(message: str, *, code: int = 2) -> int:
    json.dump({"success": False, "error": message}, sys.stdout, ensure_ascii=False)
    sys.stdout.write("\n")
    return code


def copy_stl_without_following_links(source: Path, destination: Path) -> None:
    descriptor = os.open(source, os.O_RDONLY | getattr(os, "O_NOFOLLOW", 0))
    try:
        metadata = os.fstat(descriptor)
        if not stat.S_ISREG(metadata.st_mode) or metadata.st_size <= 0 or metadata.st_size > MAX_FILE_BYTES:
            raise ValueError("The opened STL is not a nonempty regular file within the 25 MiB limit.")
        total = 0
        with os.fdopen(descriptor, "rb", closefd=False) as source_stream, destination.open("xb") as target_stream:
            os.chmod(destination, 0o600)
            for chunk in iter(lambda: source_stream.read(1024 * 1024), b""):
                total += len(chunk)
                if total > MAX_FILE_BYTES:
                    raise ValueError("The STL exceeded the 25 MiB limit while being copied.")
                target_stream.write(chunk)
        if total != metadata.st_size:
            raise ValueError("The STL changed while it was copied for slicing.")
    finally:
        os.close(descriptor)


def run_cura(docker: str, profile_id: str, source: Path, profile_info: dict) -> dict:
    docker_path = shutil.which(docker)
    if not docker_path:
        raise FileNotFoundError("Docker CLI was not found.")
    with tempfile.TemporaryDirectory(prefix="cura-job-") as private_directory:
        private_root = Path(private_directory)
        private_stl = private_root / "input.stl"
        copy_stl_without_following_links(source, private_stl)
        os.chmod(private_root, 0o700)
        os.chmod(private_stl, 0o600)
        command = [
            docker_path, "run", "--rm", "--network", "none",
            "--user", f"{os.getuid()}:{os.getgid()}", "--env", "HOME=/tmp",
            "--env", "CURA_ENGINE_SEARCH_PATH=/opt/cura/resources/definitions:/opt/cura/resources/extruders",
            "--memory=1g", "--cpus=2", "--pids-limit=64", "--read-only",
            "--tmpfs", "/tmp:rw,nosuid,nodev,size=64m",
            "--mount", f"type=bind,src={private_root},dst=/input,readonly",
            "--entrypoint", "/opt/cura/CuraEngine", CURA_IMAGE,
            "slice", "-v", "-j", profile_info["definition"],
            "-e0", "-j", profile_info["extruder_definition"],
        ]
        for setting, value in profile_info["settings"].items():
            command.extend(["-s", f"{setting}={value}"])
        command.extend([
            "-l", "/input/input.stl", "-o", "/dev/null",
        ])
        result = subprocess.run(
            command,
            check=False,
            capture_output=True,
            text=True,
            timeout=TIMEOUT_SECONDS,
        )
    raw = result.stdout + result.stderr
    if len(raw.encode("utf-8", errors="replace")) > MAX_OUTPUT_BYTES:
        raise ValueError("CuraEngine output exceeded the 1 MiB limit.")
    time_match = re.search(r"Print time \(s\):\s*(\d+)", raw)
    volume_match = re.search(r"Filament \(mm\^3\):\s*([\d.]+)", raw)
    length_match = re.search(r";Filament used:\s*([\d.]+)m", raw)
    warning_lines = [line.strip()[:240] for line in raw.splitlines() if "[warning]" in line.lower()]
    error_lines = [line.strip()[:240] for line in raw.splitlines() if "[error]" in line.lower()]
    if result.returncode != 0:
        detail = error_lines[:2] or ["CuraEngine exited unsuccessfully."]
        raise RuntimeError(" ".join(detail))
    if error_lines:
        raise RuntimeError("CuraEngine emitted error diagnostics: " + " ".join(error_lines[:2]))
    if not time_match or not volume_match:
        tail = " | ".join(raw.splitlines()[-6:])[:800]
        diagnostics = "; ".join(error_lines[:4])[:800]
        raise RuntimeError(
            f"CuraEngine did not return its print-time and filament-volume metrics "
            f"(exit {result.returncode}; errors: {diagnostics}; output tail: {tail})."
        )

    print_time = int(time_match.group(1))
    volume_mm3 = float(volume_match.group(1))
    length_m = float(length_match.group(1)) if length_match else None
    if print_time <= 0 or not math.isfinite(volume_mm3) or volume_mm3 <= 0:
        raise RuntimeError("CuraEngine returned invalid time or filament metrics.")
    grams = volume_mm3 / 1000 * profile_info["filament_density_g_cm3"]
    warnings = warning_lines[:5]
    if len(warning_lines) > len(warnings):
        warnings.append(f"{len(warning_lines) - len(warnings)} additional Cura warning diagnostics omitted.")
    return {
        "slicer": "cura",
        "cura_engine_version": "5.13.0",
        "profile": profile_id,
        "profile_label": profile_info["label"],
        "print_time_seconds": print_time,
        "filament_volume_mm3": volume_mm3,
        "filament_length_m": length_m,
        "filament_grams_per_unit_estimated": round(grams, 3),
        "filament_density_g_cm3_configured": profile_info["filament_density_g_cm3"],
        "warning_count": len(warning_lines),
        "error_diagnostic_count": len(error_lines),
        "warnings": warnings,
    }


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--filename", required=True)
    parser.add_argument("--analysis-id", required=True)
    parser.add_argument("--profile", required=True)
    parser.add_argument("--quantity", type=int, default=1)
    parser.add_argument("--jobs-directory", type=Path, required=True)
    parser.add_argument("--persistence-script", type=Path, required=True)
    parser.add_argument("--database-path", type=Path, required=True)
    parser.add_argument("--quote-engine", type=Path, required=True)
    parser.add_argument("--python-executable", default="python3")
    parser.add_argument("--docker-executable", default="docker")
    args = parser.parse_args()

    if args.profile not in PROFILE_MAP:
        return fail("The selected Cura profile is not in the approved profile list.")
    if not 1 <= args.quantity <= MAX_QUANTITY:
        return fail(f"Quantity must be between 1 and {MAX_QUANTITY}.")
    if (
        not args.filename
        or args.filename != Path(args.filename).name
        or "/" in args.filename
        or "\\" in args.filename
        or not re.fullmatch(r"[A-Za-z0-9][A-Za-z0-9._-]{0,119}\.stl", args.filename, re.IGNORECASE)
    ):
        return fail("Pass an STL filename only; directory paths and unsupported filename characters are rejected.")
    trusted_paths = (args.jobs_directory, args.persistence_script,
                     args.database_path, args.quote_engine)
    if any(not path.is_absolute() for path in trusted_paths):
        return fail("Configured jobs, scripts, and database paths must be absolute.")
    jobs_root = args.jobs_directory.resolve(strict=True)
    candidate = jobs_root / args.filename
    if candidate.is_symlink():
        return fail("Symbolic links are not accepted as STL inputs.")
    try:
        candidate.resolve(strict=True).relative_to(jobs_root)
        metadata = candidate.stat()
    except (OSError, ValueError):
        return fail("The requested STL does not exist inside the approved jobs directory.")
    if not candidate.is_file() or metadata.st_size <= 0:
        return fail("The requested path is not a nonempty regular STL file.")
    if metadata.st_size > MAX_FILE_BYTES:
        return fail(f"The STL exceeds the {MAX_FILE_BYTES} byte limit.")

    profile_info = PROFILE_MAP[args.profile]
    if not args.persistence_script.is_file() or not args.quote_engine.is_file():
        return fail("A configured analysis, persistence, or quote file is missing.")

    try:
        analysis_process = subprocess.run(
            [args.python_executable, str(args.persistence_script), "get",
             "--database", str(args.database_path), "--analysis-id", args.analysis_id,
             "--filename", args.filename],
            check=True, capture_output=True, text=True, timeout=TIMEOUT_SECONDS,
        )
        stored_analysis = json.loads(analysis_process.stdout)
        if not stored_analysis.get("found"):
            return fail("Run analyze_stl first and provide its matching analysis_id.")
        analysis = stored_analysis["analysis"]
        slicing = run_cura(args.docker_executable, args.profile, candidate, profile_info)

        sys.path.insert(0, str(args.quote_engine.parent))
        from quote import quote

        grams_per_unit = slicing["filament_grams_per_unit_estimated"]
        hours_per_unit = slicing["print_time_seconds"] / 3600
        copy_label = "copy" if args.quantity == 1 else "copies"
        quote_result = quote(
            grams_per_unit,
            hours_per_unit,
            material_brl_kg=BUSINESS_CONFIG["material_brl_per_kg"],
            machine_brl_h=BUSINESS_CONFIG["machine_brl_per_hour"],
            energy_kwh=BUSINESS_CONFIG["energy_kwh_per_hour"],
            energy_brl_kwh=BUSINESS_CONFIG["energy_brl_per_kwh"],
            margin=BUSINESS_CONFIG["gross_margin_fraction"],
            quantity=args.quantity,
            setup_brl=BUSINESS_CONFIG["setup_brl"],
        )
        with tempfile.TemporaryDirectory(prefix="production-estimate-") as temporary:
            estimate_record = {
                "analysis_id": args.analysis_id,
                "filename": args.filename,
                "profile": args.profile,
                "request_summary": (
                    f"Cura production estimate for {args.quantity} {copy_label} "
                    f"of {args.filename} using {args.profile}."
                ),
                "slicing": slicing,
                "estimated_material_g": round(grams_per_unit * args.quantity, 3),
                "estimated_print_time_seconds": slicing["print_time_seconds"] * args.quantity,
                "quote": quote_result,
                "business_config": BUSINESS_CONFIG,
            }
            estimate_path = Path(temporary) / "estimate.json"
            estimate_path.write_text(json.dumps(estimate_record), encoding="utf-8")
            stored_estimate_process = subprocess.run(
                [args.python_executable, str(args.persistence_script), "store-estimate",
                 "--database", str(args.database_path), "--estimate-file", str(estimate_path)],
                check=True, capture_output=True, text=True, timeout=TIMEOUT_SECONDS,
            )
            stored_estimate = json.loads(stored_estimate_process.stdout)

        result = {
            "success": True,
            "analysis_id": args.analysis_id,
            "estimate_id": stored_estimate["estimate_id"],
            "filename": args.filename,
            "profile": args.profile,
            "mesh_analysis": analysis,
            "slicing": slicing,
            "quantity": args.quantity,
            "estimated_material_g": round(grams_per_unit * args.quantity, 3),
            "estimated_print_time_seconds": slicing["print_time_seconds"] * args.quantity,
            "quote": quote_result,
            "business_config": BUSINESS_CONFIG,
            "request_summary": estimate_record["request_summary"],
            "created_at": stored_estimate["created_at"],
            "status": stored_estimate["status"],
            "estimate_scope": "Estimated values based on the selected Cura profile and example business configuration.",
        }
        json.dump(result, sys.stdout, ensure_ascii=False)
        sys.stdout.write("\n")
        return 0
    except subprocess.TimeoutExpired:
        return fail("Analysis, slicing, or persistence exceeded the 30 second execution limit.", code=1)
    except FileNotFoundError as error:
        return fail(str(error), code=1)
    except (subprocess.CalledProcessError, json.JSONDecodeError, ValueError, RuntimeError, OSError) as error:
        return fail(f"Production estimate failed safely: {error}", code=1)


if __name__ == "__main__":
    raise SystemExit(main())
