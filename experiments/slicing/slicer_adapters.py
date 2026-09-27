#!/usr/bin/env python3
"""Small, allowlisted slicer adapters for the Stage 3 proof.

Callers must stage the STL first. This module accepts no slicer arguments or
settings from callers; each profile ID maps to fixed image, resource, and
settings choices below.
"""
from __future__ import annotations

import json
import math
import os
import re
import shutil
import subprocess
import tempfile
import time
from pathlib import Path
from typing import Protocol


ROOT = Path(__file__).resolve().parents[2]
CURA_IMAGE = "print-farm-cura-5.13.0:baseline"
ORCA_IMAGE = "print-farm-orca-2.4.2:baseline"
MAX_OUTPUT_BYTES = 1_048_576
TIMEOUT_SECONDS = 30

CURA_PROFILE_ID = "cura-ultimaker2plus-generic-pla-normal"
ORCA_PROFILE_ID = "orca-ender3-v3se-04-generic-pla-standard"
ORCA_MACHINE_PROFILE = ROOT / "experiments/slicing/profiles/orca-ender3-v3se-0.4-cli.json"


class SlicerAdapter(Protocol):
    slicer_id: str

    def validate_profile(self, profile_id: str) -> dict: ...

    def slice(self, staged_stl: Path, profile_id: str) -> dict: ...

    def inspect_result(self, raw_output: str, artifact_path: Path | None = None) -> dict: ...


def _validate_staged_stl(path: Path) -> Path:
    resolved = path.resolve(strict=True)
    info = resolved.stat()
    if not resolved.is_file() or info.st_size <= 0 or info.st_size > 25 * 1024 * 1024:
        raise ValueError("The staged STL must be a nonempty regular file within 25 MiB.")
    return resolved


def _run(command: list[str], timeout: int = TIMEOUT_SECONDS) -> subprocess.CompletedProcess[str]:
    result = subprocess.run(command, check=False, capture_output=True, text=True, timeout=timeout)
    raw = result.stdout + result.stderr
    if len(raw.encode("utf-8", errors="replace")) > MAX_OUTPUT_BYTES:
        raise ValueError("Slicer output exceeded the 1 MiB limit.")
    return result


def _diagnostics(result: subprocess.CompletedProcess[str]) -> tuple[list[str], list[str], str]:
    raw = result.stdout + result.stderr
    warnings = [line.strip()[:240] for line in raw.splitlines()
                if "[warning]" in line.lower() or "warning:" in line.lower()]
    errors = [line.strip()[:240] for line in raw.splitlines()
              if "[error]" in line.lower() or "error:" in line.lower()]
    return warnings, errors, raw


class CuraEngineAdapter:
    slicer_id = "curaengine"
    profile = {
        "id": CURA_PROFILE_ID,
        "printer": "Ultimaker 2+ (official Cura 5.13.0 machine/extruder definitions)",
        "process": "Normal 0.1 mm simplified project CLI map",
        "material": "Generic PLA; 2.85 mm; density 1.24 g/cm3",
        "definition": "/opt/cura/resources/definitions/ultimaker2_plus.def.json",
        "extruder_definition": "/opt/cura/resources/extruders/ultimaker2_plus_extruder_0.def.json",
        "settings": {
            "layer_height": "0.1", "infill_sparse_density": "20",
            "top_bottom_thickness": "0.8", "cool_min_layer_time": "5",
            "cool_min_speed": "10", "speed_print": "50", "speed_layer_0": "30",
            "speed_topbottom": "20", "material_diameter": "2.85",
            "material_print_temperature": "200", "material_print_temperature_layer_0": "200",
            "material_bed_temperature": "60", "material_bed_temperature_layer_0": "60",
            "cool_fan_speed": "100", "roofing_layer_count": "0", "flooring_layer_count": "0",
        },
    }

    def validate_profile(self, profile_id: str) -> dict:
        if profile_id != self.profile["id"]:
            raise ValueError("The selected Cura profile is not approved.")
        return self.profile

    def inspect_result(self, raw_output: str, artifact_path: Path | None = None) -> dict:
        time_match = re.search(r"Print time \(s\):\s*(\d+)", raw_output)
        volume_match = re.search(r"Filament \(mm\^3\):\s*([\d.]+)", raw_output)
        if not time_match or not volume_match:
            raise RuntimeError("CuraEngine did not return both print time and filament volume.")
        seconds, volume = int(time_match.group(1)), float(volume_match.group(1))
        if seconds <= 0 or not math.isfinite(volume) or volume <= 0:
            raise RuntimeError("CuraEngine returned invalid time or filament volume.")
        warnings = [line.strip()[:240] for line in raw_output.splitlines() if "[warning]" in line.lower()]
        errors = [line.strip()[:240] for line in raw_output.splitlines() if "[error]" in line.lower()]
        if errors:
            raise RuntimeError("CuraEngine emitted error diagnostics: " + " ".join(errors[:2]))
        return {
            "schema_version": 1,
            "slicer_id": self.slicer_id,
            "slicer_version": "5.13.0",
            "profile": {k: self.profile[k] for k in ("id", "printer", "process", "material")},
            "print_time_seconds": seconds,
            "material_consumption": {
                "volume_mm3": volume,
            },
            "warnings": warnings[:5] + ([f"{len(warnings)-5} additional warnings omitted."] if len(warnings) > 5 else []),
            "errors": [],
        }

    def slice(self, staged_stl: Path, profile_id: str) -> dict:
        profile = self.validate_profile(profile_id)
        staged_stl = _validate_staged_stl(staged_stl)
        with tempfile.TemporaryDirectory(prefix="slicer-cura-") as private:
            root = Path(private)
            os.chmod(root, 0o700)
            staged_copy = root / "input.stl"
            shutil.copyfile(staged_stl, staged_copy)
            os.chmod(staged_copy, 0o600)
            cmd = ["docker", "run", "--rm", "--network", "none", "--user", f"{os.getuid()}:{os.getgid()}",
                   "--env", "HOME=/tmp", "--env", "CURA_ENGINE_SEARCH_PATH=/opt/cura/resources/definitions:/opt/cura/resources/extruders",
                   "--memory=1g", "--cpus=2", "--pids-limit=64", "--read-only", "--tmpfs", "/tmp:rw,nosuid,nodev,size=64m",
                   "--mount", f"type=bind,src={root},dst=/input,readonly", "--entrypoint", "/opt/cura/CuraEngine",
                   CURA_IMAGE, "slice", "-v", "-j", profile["definition"], "-e0", "-j", profile["extruder_definition"]]
            for key, value in profile["settings"].items():
                cmd.extend(["-s", f"{key}={value}"])
            cmd.extend(["-l", "/input/input.stl", "-o", "/dev/null"])
            start = time.perf_counter()
            result = _run(cmd)
            elapsed = time.perf_counter() - start
        if result.returncode:
            warnings, errors, raw = _diagnostics(result)
            raise RuntimeError(" ".join(errors[:2]) or raw.splitlines()[-1])
        normalized = self.inspect_result(result.stdout + result.stderr)
        normalized["execution_wall_seconds"] = round(elapsed, 3)
        return normalized


class OrcaSlicerAdapter:
    slicer_id = "orcaslicer"
    resource_root = "/opt/orca/resources/profiles"
    profile = {
        "id": ORCA_PROFILE_ID,
        "printer": "Creality Ender-3 V3 SE 0.4 nozzle (bundled Orca preset)",
        "process": "0.20mm Standard @Creality Ender3V3SE 0.4",
        "material": "Generic PLA @System",
        "machine": f"{resource_root}/Creality/machine/Creality Ender-3 V3 SE 0.4 nozzle.json",
        "process_file": f"{resource_root}/Creality/process/0.20mm Standard @Creality Ender3V3SE 0.4.json",
        "filament": f"{resource_root}/OrcaFilamentLibrary/filament/Generic PLA @System.json",
    }

    def validate_profile(self, profile_id: str) -> dict:
        if profile_id != self.profile["id"]:
            raise ValueError("The selected OrcaSlicer profile is not approved.")
        machine = json.loads(ORCA_MACHINE_PROFILE.read_text(encoding="utf-8"))
        if (machine.get("printer_model") != "Creality Ender-3 V3 SE"
                or machine.get("nozzle_diameter") != ["0.4"]
                or machine.get("use_relative_e_distances") != "0"):
            raise ValueError("The approved OrcaSlicer machine profile failed validation.")
        return self.profile

    def inspect_result(self, raw_output: str, artifact_path: Path | None = None) -> dict:
        if artifact_path is None or not artifact_path.is_file():
            raise RuntimeError("OrcaSlicer did not produce the expected G-code artifact.")
        text = artifact_path.read_text(encoding="utf-8", errors="replace")
        time_match = re.search(r"^;TIME:([\d.]+)\s*$", text, re.M)
        volume_match = re.search(r"^; filament used \[cm3\] = ([\d.]+)\s*$", text, re.M | re.I)
        if not time_match or not volume_match:
            raise RuntimeError("OrcaSlicer G-code did not expose both computed time and filament volume.")
        seconds, volume = float(time_match.group(1)), float(volume_match.group(1)) * 1000
        if seconds <= 0 or not math.isfinite(volume) or volume <= 0:
            raise RuntimeError("OrcaSlicer returned invalid time or filament volume.")
        result_json_path = artifact_path.parent / "result.json"
        warnings: list[str] = []
        errors: list[str] = []
        if result_json_path.is_file():
            metadata = json.loads(result_json_path.read_text(encoding="utf-8"))
            for plate in metadata.get("sliced_plates", []):
                warning = str(plate.get("warning_message", "")).strip()
                if warning:
                    warnings.append(warning[:240])
            error = str(metadata.get("error_string", "")).strip()
            if error and error.lower() not in {"success", "success."}:
                errors.append(error[:240])
        if errors:
            raise RuntimeError("OrcaSlicer reported: " + " ".join(errors))
        return {
            "schema_version": 1,
            "slicer_id": self.slicer_id,
            "slicer_version": "2.4.2",
            "profile": {k: self.profile[k] for k in ("id", "printer", "process", "material")},
            "print_time_seconds": round(seconds),
            "material_consumption": {
                "volume_mm3": round(volume, 2),
            },
            "warnings": warnings,
            "errors": [],
            "output_artifact": {"media_type": "text/x-gcode", "size_bytes": artifact_path.stat().st_size},
        }

    def slice(self, staged_stl: Path, profile_id: str) -> dict:
        profile = self.validate_profile(profile_id)
        staged_stl = _validate_staged_stl(staged_stl)
        with tempfile.TemporaryDirectory(prefix="slicer-orca-") as private:
            root = Path(private)
            input_dir, output_dir = root / "input", root / "output"
            input_dir.mkdir(mode=0o700)
            output_dir.mkdir(mode=0o700)
            staged_copy = input_dir / "input.stl"
            shutil.copyfile(staged_stl, staged_copy)
            os.chmod(staged_copy, 0o600)
            # Orca's bundled Ender 3 V3 SE preset inherits relative E without a layer reset.
            # The CLI rejects it, so this fixed compatibility profile explicitly selects
            # absolute E mode. The model cannot change this setting.
            machine_path = root / "machine.json"
            shutil.copyfile(ORCA_MACHINE_PROFILE, machine_path)
            cmd = ["docker", "run", "--rm", "--network", "none", "--user", f"{os.getuid()}:{os.getgid()}",
                   "--env", "HOME=/tmp", "--memory=2g", "--cpus=2", "--pids-limit=128", "--read-only",
                   "--tmpfs", "/tmp:rw,nosuid,nodev,size=128m",
                   "--mount", f"type=bind,src={input_dir},dst=/input,readonly",
                   "--mount", f"type=bind,src={output_dir},dst=/output",
                   "--mount", f"type=bind,src={machine_path},dst=/machine.json,readonly",
                   "--entrypoint", "/opt/orca/bin/orca-slicer", ORCA_IMAGE,
                   "/input/input.stl", "--load-settings", f"/machine.json;{profile['process_file']}",
                   "--load-filaments", profile["filament"], "--slice", "0", "--debug", "2",
                   "--logfile", "/output/slicer.log", "--outputdir", "/output"]
            start = time.perf_counter()
            result = _run(cmd)
            elapsed = time.perf_counter() - start
            artifact = output_dir / "plate_1.gcode"
            if result.returncode:
                _, errors, raw = _diagnostics(result)
                detail = errors[:2] or raw.splitlines()[-8:]
                raise RuntimeError(" ".join(detail))
            normalized = self.inspect_result(result.stdout + result.stderr, artifact)
        normalized["execution_wall_seconds"] = round(elapsed, 3)
        return normalized


ADAPTERS: dict[str, SlicerAdapter] = {
    "curaengine": CuraEngineAdapter(),
    "orcaslicer": OrcaSlicerAdapter(),
}


def slice_with_adapter(slicer_id: str, staged_stl: Path, profile_id: str) -> dict:
    if slicer_id not in ADAPTERS:
        raise ValueError("The requested slicer is not approved.")
    return ADAPTERS[slicer_id].slice(staged_stl, profile_id)
