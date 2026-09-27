# Stage 3 — Multi-slicer Proof Report

**Date:** 2026-09-27  
**Assessment:** **PASSED (two-adapter prototype scope)**

## Assessment

Two real engines were executed against the same staged STL: CuraEngine 5.13.0 and OrcaSlicer 2.4.2. Their outputs were normalized into the same quote input and consumed by the existing quote calculator through `quote_slicer_result`, with no slicer-specific business branch. This proves an adapter boundary is technically practical.

Bambu Studio and Creality Print were investigated but not executed. A PrusaSlicer Debian CLI build was probed during earlier research, but no slice completed. Only Cura and Orca are claimed as executed. The Orca profile required a fixed extrusion-mode compatibility value, and its reported mass metadata was zero; the proof therefore normalizes filament volume and derives grams from a configured PLA density. These are estimator proofs, not profile-equivalence or print-accuracy comparisons.

The OpenClaw plugin still exposes only its existing fixed Cura profile. The prototype adapters are code-backed and allowlisted, but Stage 3 did not widen the model-facing tool schema or integrate Orca into OpenClaw.

## Common contract derived from output evidence

The following fields appeared in both engines' real results or could be derived from their tested output:

```text
SlicerAdapter
  validate_profile(approved_profile_id) -> fixed profile metadata
  slice(private_staged_stl, approved_profile_id) -> normalized result
  inspect_result(raw diagnostics, optional artifact) -> normalized result

Normalized result
  schema_version
  slicer_id, slicer_version
  profile.id, profile.printer, profile.process, profile.material
  print_time_seconds
  material_consumption.volume_mm3
  warnings[], errors[]
  output_artifact? { media_type, size_bytes }
```

The common material quantity is **filament volume in mm³**: Cura prints it as `Filament (mm^3)` in verbose output; Orca writes `filament used [cm3]` in its G-code footer. Both print times were available from real outputs (Cura's post-slice console metric and Orca's G-code `;TIME` header, cross-checked against its human-readable footer). Grams are not part of the normalized slicer result. The generic quote function receives an explicit density (the proof uses 1.24 g/cm³) and derives estimated grams from volume; this is not a native result guaranteed by both engines. Orca's tested G-code declared `filament_density: 0` and `total filament used [g] = 0.00`.

The quote function reads only `print_time_seconds` and `material_consumption.volume_mm3`, converts seconds to hours, derives grams from an explicit density argument, and calls the existing generic quote function. It does not inspect `slicer_id` or profile names. Quote input records include both volume and density so the derivation remains reviewable.

## Same-fixture proof

Fixture: `experiments/stl-analysis/samples/small-box-20mm.stl`  
SHA-256 of the shared staged copy: `4ca3d19d01e11ee608d81218670db3547d320cbc7bef4e36b64339cf4285ad70`.

| Slicer | Profile | Time | Filament volume | Estimated PLA mass | Warnings | Artifact | Same quote function |
|---|---|---:|---:|---:|---:|---|---|
| CuraEngine 5.13.0 | Official Ultimaker 2+ definitions; project's simplified Normal 0.1 mm map; Generic PLA, 2.85 mm | 2,035 s | 2,968 mm³ | 3.680 g | 130 (five samples plus omitted-count note) | G-code discarded to `/dev/null` | R$2.54 order estimate |
| OrcaSlicer 2.4.2 | Bundled Creality Ender-3 V3 SE 0.4 mm; 0.20 mm Standard; Generic PLA @System; fixed absolute-E compatibility setting | 1,062 s | 2,020 mm³ | 2.505 g, volume × configured 1.24 g/cm³ | 0 | G-code generated, 203,885 B | R$1.42 order estimate |

The different results must not be read as a slicer accuracy comparison. The process heights, printer profiles, filament profile resolution, and other settings are not equivalent. The Cura simplified settings map still differs from the full Cura GUI-resolved settings; its material parity remains unresolved.

Detailed machine-readable output is in [`stage3-proof-results.json`](../experiments/slicing/stage3-proof-results.json). The Orca runtime recipe is checked in; the same-host proof was rebuilt from it and rerun successfully. Build Orca and rerun both slices/quotes with:

```sh
docker build -f experiments/slicing/Dockerfile.orca -t print-farm-orca-2.4.2:baseline experiments/slicing
python3 experiments/slicing/run_stage3_proof.py
```

The runner also requires the Stage 2 local image `print-farm-cura-5.13.0:baseline`. Its 5.13.0 Docker build recipe is not yet checked in, so a clean machine cannot reproduce both sides from the current checkout alone.

## Slicer findings

Evidence labels: `TESTED` means the binary actually ran here; `INVESTIGATED` means official docs/current release metadata were reviewed; `HYPOTHESIS` marks capability not established by execution.

| Slicer and evidence | Linux, CLI, inputs | Profiles and official presets | Time, material, artifact, diagnostics | Docker, size, runtime | License and project limits |
|---|---|---|---|---|---|
| **CuraEngine 5.13.0 — TESTED** | Linux Debian container; direct headless `CuraEngine slice`; STL input. | Bundled Ultimaker 2+ machine/extruder definitions plus a fixed project settings map. The CLI map is simplified and not equivalent to Cura's fully resolved GUI profile. | Print time from verbose post-slice output; filament volume from `Filament (mm^3)`. G-code was deliberately sent to `/dev/null`. Exit code and `[warning]` / `[error]` lines were captured. 130 setting-default warnings, no errors. | Existing pinned-version image: 417,407,354 bytes (~398 MiB); this fixture took about 0.37 s wall time including Docker startup. Deterministic execution is practical with pinned engine/resources; base/package digests still need pinning. | CuraEngine is AGPL-3.0 ([official repository](https://github.com/Ultimaker/CuraEngine)). Existing Cura material parity issue remains; selected Ultimaker profile is only a controlled baseline, not the farm printer. |
| **OrcaSlicer 2.4.2 — TESTED** | Linux Ubuntu 24.04 AppImage ran headlessly through `orca-slicer`; accepts STL and 3MF per CLI help. | Bundled printer, process, and filament JSON profiles were used. The bundled Ender-3 V3 SE profile combination was rejected until the fixed adapter machine profile set `use_relative_e_distances=0`. `Generic PLA @System` did not provide usable density output. | Time from G-code `;TIME` (1,062 s), corroborated by footer `17m 42s`; volume from `filament used [cm3]`; G-code `plate_1.gcode` (203,885 B); CLI `result.json` supplied `error_string` and per-plate `warning_message`. Zero warnings/errors in this run. G-code mass was zero and not used. | Ubuntu 24.04 image: 1,385,311,220 bytes (~1.29 GiB), including AppImage runtime dependencies. Repo-built image fixture took about 0.35 s wall time including Docker startup. Docker execution worked with no network, read-only root, bounded CPU/memory/PIDs, read-only input, and temporary writable output. The checked-in Dockerfile pins base digest and official AppImage checksum; apt package versions are not locked. | AGPL-3.0 ([official project](https://www.orcaslicer.com/), [official release](https://github.com/OrcaSlicer/OrcaSlicer/releases/tag/v2.4.2)). Requires a maintained large runtime image and profile import/validation. Fixed E-mode compatibility edit and farm-supplied density must be visible in quote provenance. |
| **Bambu Studio v02.08.02.61 — INVESTIGATED** | Official Linux Ubuntu 22.04/24.04 AppImages are published; official CLI guide documents headless `--slice` and STL/3MF input. Not run here. | CLI guide accepts full machine/process and filament JSON files with `--load-settings` and `--load-filaments`; it specifically expects full configs rather than resource preset snippets. Bundled profiles exist. | Official CLI reference documents slice/export actions, but not a stable structured estimate schema. **HYPOTHESIS:** parse time/material from generated G-code or exported project; not verified. Error reporting is debug/log output per docs. | Linux AppImage asset is ~219 MiB; no container/image or runtime measured. **HYPOTHESIS:** containerization is practical but will carry a large GUI/runtime dependency set. | AGPL-3.0 core ([official repo](https://github.com/bambulab/BambuStudio)); network/printer features are out of scope. The CLI's full-config requirement and unverified metric source make it a weaker immediate second adapter. |
| **Creality Print 7.2.1 — INVESTIGATED** | Official Ubuntu Linux AppImage and Flatpak are published. Official CLI docs show `--slice`, but examples use `CrealityPrint.exe`; Linux headless behavior was not executed. STL/OBJ and 3MF input are documented. | CLI docs take JSON printer/process settings using `--load_settings` and filament settings with `--load_filaments`; 3MF projects can carry their own settings. Official presets are included. | CLI docs describe G-code and CLI result files plus log/debug options, but a reliable time/material field contract was not established. **HYPOTHESIS:** parse output G-code. | AppImage ~173 MiB and Flatpak ~178 MiB downloads; no runtime/image measured. Linux headless execution and a deterministic minimal container remain hypotheses. | Official repo identifies AGPL-3.0 ([repository](https://github.com/CrealityOfficial/CrealityPrint), [releases](https://github.com/CrealityOfficial/CrealityPrint/releases)). Linux packaging exists, while the documented command syntax is Windows-centered; test before selecting. |
| **PrusaSlicer — INVESTIGATED; limited CLI probe** | Current official release is 2.9.6; vendor Linux path is Flatpak/Drivers. No 2.9.6 slice run. A prior Debian package CLI reported `2.9.2+UNKNOWN`; `--help` showed CLI export/preset options, but a no-config run failed “Configuration wasn't found.” | CLI supports printer/print/filament preset selection and configuration directories. A default profile set must be initialized for headless slicing; none was available in the earlier isolated data directory. | No G-code/time/material result was produced in the CLI probe. **HYPOTHESIS:** generated G-code comments can be parsed after a correctly configured run. | The earlier Debian install attempt indicated roughly 475 package dependencies and was stopped before a slice; no image/runtime measured. Flatpak/app bundle offers a route to isolate dependencies, but this project has not proved it. | AGPL-3.0 ([official source](https://github.com/prusa3d/PrusaSlicer/blob/master/LICENSE)). Technically useful as a reference slicer, but offers less advantage than Orca for this stage after its incomplete preset setup and the successful Orca proof. |

### Official/current documentation reviewed

- [CuraEngine repository and CLI](https://github.com/Ultimaker/CuraEngine)
- [OrcaSlicer 2.4.2 release](https://github.com/OrcaSlicer/OrcaSlicer/releases/tag/v2.4.2), [CLI mode](https://github.com/OrcaSlicer/OrcaSlicer/wiki/CLI-mode), and [CLI actions](https://github.com/OrcaSlicer/OrcaSlicer/wiki/cli_actions)
- [Bambu Studio CLI guide](https://github.com/bambulab/BambuStudio/wiki/Command-Line-Usage), [Linux release assets](https://github.com/bambulab/BambuStudio/releases)
- [Creality Print CLI/repository](https://github.com/CrealityOfficial/CrealityPrint), [Linux release assets](https://github.com/CrealityOfficial/CrealityPrint/releases)
- [PrusaSlicer CLI guide](https://help.prusa3d.com/article/command-line-interface_177484), [Linux installation](https://help.prusa3d.com/article/install-prusaslicer_1903), [current releases](https://github.com/prusa3d/PrusaSlicer/releases)

## Recommendation and blockers

**Selected second slicer: OrcaSlicer.** It has current Linux AppImage distribution, explicit headless CLI support, bundled printer/process/filament profiles, machine-readable per-plate warning/error metadata, measurable G-code time and filament volume, and completed the same-fixture adapter proof. Bambu Studio has a comparable documented CLI, but Orca was actually executed and has a usable tested output path here.

Remaining blockers before OpenClaw exposes Orca or quotes are production-facing:

- import/version/hash full slicer profiles and validate machine, nozzle, material, and process compatibility;
- source PLA density from farm configuration, since Orca emitted zero density/grams in this run;
- resolve Cura simplified-map versus GUI-resolved material parity before presenting its mass estimate as production-equivalent;
- pin the complete Orca package set and profile resources; check in a clean-build recipe for the Cura 5.13.0 baseline image;
- review AGPL notices/source obligations for any redistributed slicer images.

**Stage 4 recommendation:** continue with the roadmap's Persistent Domain Model and Farm Configuration stage. Put slicer ID, exact slicer version, imported profile identifiers/digests, and configured material density in farm configuration. Keep the OpenClaw slice tool Cura-only until the profile registry and density validation are implemented. Do not begin printer control in Stage 4.
