# Slicer Comparison

**Updated:** 2026-09-27. The detailed evidence table, settings, metrics, licensing notes, container sizing, and exact limitations are in the [Stage 3 Multi-slicer Proof Report](stage-3-multi-slicer-proof-report.md).

## Current findings

| Engine | Evidence | Linux/headless status | Profiles and outputs | Stage decision |
|---|---|---|---|---|
| CuraEngine 5.13.0 | **TESTED** | Real headless Docker execution | Official Ultimaker 2+ resources plus simplified fixed settings; time/volume from verbose output; G-code discarded | Existing OpenClaw baseline; full-profile/material parity still unresolved |
| OrcaSlicer 2.4.2 | **TESTED** | Real Linux AppImage CLI execution inside Docker | Bundled Ender-3 V3 SE machine, Standard 0.20 mm process, Generic PLA; time/volume/G-code and warning metadata extracted | Selected second adapter; fixed absolute-E compatibility value and external density are disclosed |
| Bambu Studio v02.08.02.61 | **INVESTIGATED** | Official Linux AppImages and documented CLI; not executed | CLI requires full machine/process/filament JSON; stable metric schema not established | Revisit after profile import work or if Bambu-specific profile coverage is needed |
| Creality Print 7.2.1 | **INVESTIGATED** | Linux AppImage/Flatpak; CLI documented with Windows-style examples; not executed | CLI accepts printer/process and filament JSON; output metric parsing unverified | Revisit if farm printer profile compatibility warrants it |
| PrusaSlicer | **INVESTIGATED**, limited CLI probe | Current official Linux install is Flatpak/Drivers; prior Debian `2.9.2+UNKNOWN` CLI help worked, but no slice completed | CLI preset options exist; isolated configuration was missing | Useful reference, but not selected for this proof |

## Proof and comparability

CuraEngine and OrcaSlicer sliced the same staged 20 mm box fixture and returned the common normalized fields. The quote engine consumed either result through one generic function. This proves adapter independence at prototype scope.

The estimates are not comparable for accuracy: the Cura run used a 0.1 mm simplified Cura profile and 2.85 mm Generic PLA configuration; Orca used a Creality Ender-3 V3 SE 0.4 mm profile and a 0.20 mm process. Orca returned filament volume but declared density and grams as zero. The generic quote function derived grams from the proof's explicit PLA density input (1.24 g/cm³).

The old Cura 5.0.0 / legacy Ender-3 results in `experiments/slicing/cura-results.json` are historical only. They are superseded by the Stage 2 Cura 5.13.0 baseline and Stage 3 report.

Reproduce the two-engine proof with:

```sh
python3 experiments/slicing/run_stage3_proof.py
```
