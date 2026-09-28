# Stage 3 — Multi-slicer Proof Report

**Date:** 2026-09-27  
**Assessment:** **PASSED (four-adapter prototype scope)**

## Assessment

Four real engines were executed against the same staged STL: CuraEngine 5.13.0, OrcaSlicer 2.4.2, Bambu Studio 02.08.02.61, and Creality Print 7.2.1.5476. Each result was normalized into the same quote input and consumed by the existing quote calculator through `quote_slicer_result`, with no slicer-specific business branch. This expands the prototype proof that an adapter boundary is technically practical.

Bambu Studio's historical Stage 3 profile snapshot retained user-preset inheritance/identity metadata and sliced, but its G-code produced a conspicuously high 43,487.39 mm³ for this 20 × 20 × 12 mm fixture. That result must not be treated as a business estimate until independently investigated. The newer identity-preserving full config returns a much smaller material result; GUI parity is still pending. Creality Print sliced successfully from bundled leaf profiles and exposed time/material comments in G-code, although `result.json` left its time fields at zero. Its first optional 3MF export attempt failed after G-code generation because the output path was joined twice; the G-code-only invocation exited 0. Orca still required a fixed extrusion-mode compatibility value, and its reported mass metadata was zero. The profiles are not equivalent and no cross-slicer estimate accuracy is claimed.

The OpenClaw plugin still exposes only its existing fixed Cura profile. The prototype adapters are code-backed and allowlisted, but Stage 3 did not widen the model-facing tool schema or integrate Orca into OpenClaw.

## Common contract derived from output evidence

The following fields appeared in the four engines' real results or could be derived from their tested output:

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

The common material quantity is **filament volume in mm³**. Cura prints it as `Filament (mm^3)` in verbose output; Orca and Creality Print write `filament used [cm3]` in G-code; Bambu Studio writes `total filament volume [cm^3]` but emits a value in mm³, confirmed by its G-code weight and density fields. Print time came from Cura's post-slice output, Orca/Creality G-code `;TIME` headers, and Bambu `result.json` `total_predication` (also represented by the G-code estimated-time header). Grams are not part of the normalized slicer result. The generic quote function receives an explicit application density (1.24 g/cm³ here) and derives estimated grams from volume. Bambu's G-code reported 54.79 g at its 1.26 g/cm³ profile density; Orca reported density and grams as zero.

The quote function reads only `print_time_seconds` and `material_consumption.volume_mm3`, converts seconds to hours, derives grams from an explicit density argument, and calls the existing generic quote function. It does not inspect `slicer_id` or profile names. Quote input records include both volume and density so the derivation remains reviewable.

## Same-fixture proof

Fixture: `experiments/stl-analysis/samples/small-box-20mm.stl`  
SHA-256 of the shared staged copy: `4ca3d19d01e11ee608d81218670db3547d320cbc7bef4e36b64339cf4285ad70`.

| Slicer | Profile | Time | Filament volume | Estimated PLA mass | Warnings | Artifact | Same quote function |
|---|---|---:|---:|---:|---:|---|---|
| CuraEngine 5.13.0 | Official Ultimaker 2+ definitions; project's simplified Normal 0.1 mm map; Generic PLA, 2.85 mm | 2,035 s | 2,968 mm³ | 3.680 g | 130 (five samples plus omitted-count note) | G-code discarded to `/dev/null` | R$2.54 order estimate |
| OrcaSlicer 2.4.2 | Bundled Creality Ender-3 V3 SE 0.4 mm; 0.20 mm Standard; Generic PLA @System; fixed absolute-E compatibility setting | 1,062 s | 2,020 mm³ | 2.505 g, volume × configured 1.24 g/cm³ | 0 | G-code generated, 203,885 B | R$1.42 order estimate |
| Bambu Studio 02.08.02.61 | Bundled Bambu Lab A1 0.4 mm; historical inherited Stage 3 process/material profile | 1,272 s | 43,487.39 mm³* | 53.924 g, volume × configured 1.24 g/cm³ | 0 | G-code generated, 246,984 B | R$9.33 order estimate |
| Creality Print 7.2.1.5476 | Bundled Creality Ender-3 V3 SE 0.4 mm; 0.20 mm Standard; CR-PLA | 507 s | 1,940 mm³ | 2.406 g, volume × configured 1.24 g/cm³ | 0 | G-code generated, 137,746 B | R$0.86 order estimate |

\* Bambu's G-code labels the value `[cm^3]`, but 43,487.39 cm³ would imply an impossible 54.79 kg at its reported density. It separately reports 54.79 g at 1.26 g/cm³, so the value is normalized as 43,487.39 mm³ (43.48739 cm³). These fields agree internally, but their magnitude remains anomalous for this fixture and is untrusted for business quotes.

The Bambu CLI invocation loaded `profiles/bambu-a1-0.4/{machine,process,filament}.json`, then passed `--ensure-on-bed --orient 1 --arrange 1 --slice 0 --debug 2 --outputdir /output /input/input.stl`. The machine/process/material selections were Bambu Lab A1 0.4 nozzle, `0.20mm Standard @BBL A1`, and `Bambu PLA Basic @BBL A1`. The Creality invocation loaded `profiles/creality-ender3-v3se-0.4/{machine,process,filament}.json` with the same orientation, arrange, and slice options and `/input/input.stl`; selected profiles were Ender-3 V3 SE 0.4 nozzle, `0.20mm Standard @Creality Ender-3 V3 SE 0.4 nozzle`, and `CR-PLA @Creality Ender-3 V3 SE 0.4 nozzle`. The exact fixed command vectors and Docker boundaries are implemented in [`slicer_adapters.py`](../experiments/slicing/slicer_adapters.py).

The different results must not be read as a slicer accuracy comparison. The process heights, printer profiles, filament profile resolution, and other settings are not equivalent. The Cura simplified settings map still differs from the full Cura GUI-resolved settings; its material parity remains unresolved.

Detailed machine-readable output is in [`stage3-proof-results.json`](../experiments/slicing/stage3-proof-results.json). Bambu and Creality CLI excerpts and raw slicer result JSON are preserved in [`experiments/slicing/evidence`](../experiments/slicing/evidence). Runtime recipes for Orca, Bambu Studio, and Creality Print are checked in. Build the three images and rerun all slices/quotes with:

```sh
docker build -f experiments/slicing/Dockerfile.orca -t print-farm-orca-2.4.2:baseline experiments/slicing
docker build -f experiments/slicing/Dockerfile.bambu -t print-farm-bambu-studio-2.8.2.61:baseline experiments/slicing
docker build -f experiments/slicing/Dockerfile.creality -t print-farm-creality-print-7.2.1:baseline experiments/slicing
python3 experiments/slicing/run_stage3_proof.py
```

The runner also requires the Stage 2 local image `print-farm-cura-5.13.0:baseline`. Its 5.13.0 Docker build recipe is not yet checked in, so a clean machine cannot reproduce all four adapters from the current checkout alone. The three checked-in AppImage recipes pin the Ubuntu base digest and official binary checksum; apt package versions remain unlocked.

## Slicer findings

Evidence labels: `TESTED` means the binary actually ran here; `INVESTIGATED` means official docs/current release metadata were reviewed; `HYPOTHESIS` marks capability not established by execution.

| Slicer and evidence | Linux, CLI, inputs | Profiles and official presets | Time, material, artifact, diagnostics | Docker, size, runtime | License and project limits |
|---|---|---|---|---|---|
| **CuraEngine 5.13.0 — TESTED** | Linux Debian container; direct headless `CuraEngine slice`; STL input. | Bundled Ultimaker 2+ machine/extruder definitions plus a fixed project settings map. The CLI map is simplified and not equivalent to Cura's fully resolved GUI profile. | Print time from verbose post-slice output; filament volume from `Filament (mm^3)`. G-code was deliberately sent to `/dev/null`. Exit code and `[warning]` / `[error]` lines were captured. 130 setting-default warnings, no errors. | Existing pinned-version image: 417,407,354 bytes (~398 MiB); this fixture took about 0.37 s wall time including Docker startup. Deterministic execution is practical with pinned engine/resources; base/package digests still need pinning. | CuraEngine is AGPL-3.0 ([official repository](https://github.com/Ultimaker/CuraEngine)). Existing Cura material parity issue remains; selected Ultimaker profile is only a controlled baseline, not the farm printer. |
| **OrcaSlicer 2.4.2 — TESTED** | Linux Ubuntu 24.04 AppImage ran headlessly through `orca-slicer`; accepts STL and 3MF per CLI help. | Bundled printer, process, and filament JSON profiles were used. The bundled Ender-3 V3 SE profile combination was rejected until the fixed adapter machine profile set `use_relative_e_distances=0`. `Generic PLA @System` did not provide usable density output. | Time from G-code `;TIME` (1,062 s), corroborated by footer `17m 42s`; volume from `filament used [cm3]`; G-code `plate_1.gcode` (203,885 B); CLI `result.json` supplied `error_string` and per-plate `warning_message`. Zero warnings/errors in this run. G-code mass was zero and not used. | Ubuntu 24.04 image: 1,385,311,220 bytes (~1.29 GiB), including AppImage runtime dependencies. Repo-built image fixture took about 0.35 s wall time including Docker startup. Docker execution worked with no network, read-only root, bounded CPU/memory/PIDs, read-only input, and temporary writable output. The checked-in Dockerfile pins base digest and official AppImage checksum; apt package versions are not locked. | AGPL-3.0 ([official project](https://www.orcaslicer.com/), [official release](https://github.com/OrcaSlicer/OrcaSlicer/releases/tag/v2.4.2)). Requires a maintained large runtime image and profile import/validation. Fixed E-mode compatibility edit and farm-supplied density must be visible in quote provenance. |
| **Bambu Studio 02.08.02.61 — TESTED** | Official Ubuntu 24.04 AppImage 230,025,720 B (SHA-256 `d501b103…`); headless `AppRun` sliced STL input. | Historical Stage 3 user profile retained `inherits` metadata and sliced, but yielded anomalous material. First inheritance-free full bundle failed `-17` compatibility. Current parent-to-child-complete bundle retains Bambu system identity (`from`, `setting_id`, preset name, ancestry) and passes `compatible 1`. | Historical result: `total_predication=1271.9 s`, 43,487.39 mm³, 54.79 g at 1.26. Current CLI result: 481.49 s, 825.51 mm filament, 1,985.58 mm³, 2.50 g at 1.26; one object/filament, 60 layers. Effective values are in CLI-exported 3MF `Metadata/project_settings.config`. GUI parity remains pending. | Ubuntu 24.04 image 1,662,664,926 B (~1.55 GiB); current repeated-slice runner takes about 0.34 s per fixture including Docker startup. Succeeded with no network, read-only root, bounded CPU/memory/PIDs, and private input/output. Dockerfile pins base digest and AppImage checksum; apt package versions remain unlocked. | AGPL-3.0 ([official repo/license](https://github.com/bambulab/BambuStudio/blob/master/LICENSE), [release](https://github.com/bambulab/BambuStudio/releases/tag/v02.08.02.61)). Full-profile preprocessing is version-specific and must be revalidated on upgrades; no OpenClaw exposure. |
| **Creality Print 7.2.1.5476 — TESTED** | Official Linux AppImage 181,815,800 B (SHA-256 `b28f66c2…`); headless CLI sliced STL input. Args: `--ensure-on-bed --orient 1 --arrange 1 --slice 0 --debug 2 --logfile --outputdir`. | Bundled Creality Ender-3 V3 SE 0.4 mm, 0.20 Standard, CR-PLA leaf JSON loaded directly. | `result.json`: return 0/“Success.” but its slice-time fields are 0; G-code was authoritative: `;TIME:506.61`, `filament used [cm3] = 1.94`, normalized to 1,940 mm³. G-code 137,746 B; no per-plate warning. First optional `--export-3mf` attempt failed after G-code generation because the path was joined twice; its thumbnail export also skipped because OSMesa was unavailable. G-code-only rerun exited 0. Startup prints `[error] main ...` lines despite the successful result; these are not slice errors. | Ubuntu 24.04 image 1,567,448,355 B (~1.46 GiB); about 0.63 s per fixture including container startup. No-network/read-only/bounded Docker run succeeded. Dockerfile pins base digest and AppImage checksum; apt package versions remain unlocked. | AGPL-3.0 ([official repository](https://github.com/CrealityOfficial/CrealityPrint), [release](https://github.com/CrealityOfficial/CrealityPrint/releases/tag/v7.2.1)). Optional 3MF export/rendering needs OpenGL support; G-code-only slicing works headlessly. |
| **PrusaSlicer — INVESTIGATED; limited CLI probe** | Current official release is 2.9.6; vendor Linux path is Flatpak/Drivers. No 2.9.6 slice run. A prior Debian package CLI reported `2.9.2+UNKNOWN`; `--help` showed CLI export/preset options, but a no-config run failed “Configuration wasn't found.” | CLI supports printer/print/filament preset selection and configuration directories. A default profile set must be initialized for headless slicing; none was available in the earlier isolated data directory. | No G-code/time/material result was produced in the CLI probe. **HYPOTHESIS:** generated G-code comments can be parsed after a correctly configured run. | The earlier Debian install attempt indicated roughly 475 package dependencies and was stopped before a slice; no image/runtime measured. Flatpak/app bundle offers a route to isolate dependencies, but this project has not proved it. | AGPL-3.0 ([official source](https://github.com/prusa3d/PrusaSlicer/blob/master/LICENSE)). Technically useful as a reference slicer, but offers less advantage than Orca for this stage after its incomplete preset setup and the successful Orca proof. |

### Official/current documentation reviewed

- [CuraEngine repository and CLI](https://github.com/Ultimaker/CuraEngine)
- [OrcaSlicer 2.4.2 release](https://github.com/OrcaSlicer/OrcaSlicer/releases/tag/v2.4.2), [CLI mode](https://github.com/OrcaSlicer/OrcaSlicer/wiki/CLI-mode), and [CLI actions](https://github.com/OrcaSlicer/OrcaSlicer/wiki/cli_actions)
- [Bambu Studio CLI guide](https://github.com/bambulab/BambuStudio/wiki/Command-Line-Usage), [02.08.02.61 release](https://github.com/bambulab/BambuStudio/releases/tag/v02.08.02.61)
- [Creality Print repository](https://github.com/CrealityOfficial/CrealityPrint), [7.2.1 Linux release](https://github.com/CrealityOfficial/CrealityPrint/releases/tag/v7.2.1)
- [PrusaSlicer CLI guide](https://help.prusa3d.com/article/command-line-interface_177484), [Linux installation](https://help.prusa3d.com/article/install-prusaslicer_1903), [current releases](https://github.com/prusa3d/PrusaSlicer/releases)

## Recommendation and blockers

The execution pass moved Bambu Studio and Creality Print from investigation to tested adapter prototypes. Creality has usable time/material G-code fields in this run. Bambu has parseable, internally cross-checked fields, but its material magnitude is anomalous for the fixture. Orca remains the selected second engine from the original Stage 3 proof; the expanded four-adapter prototype does not change the OpenClaw exposure decision.

Remaining blockers before OpenClaw exposes Orca or quotes are production-facing:

- import/version/hash full slicer profiles and validate machine, nozzle, material, and process compatibility;
- regenerate and validate Bambu's flattened CLI configs on each slicer release;
- source PLA density from farm configuration, since Orca emitted zero density/grams in this run;
- investigate why Bambu's A1 CLI run reports 43.487 cm³ / 54.79 g for the 20 × 20 × 12 mm fixture before using its material estimate;
- resolve Cura simplified-map versus GUI-resolved material parity before presenting its mass estimate as production-equivalent;
- pin the complete Orca package set and profile resources; check in a clean-build recipe for the Cura 5.13.0 baseline image;
- review AGPL notices/source obligations for any redistributed slicer images.

**Stage 4 recommendation:** Stage 3 remains passed, so Stage 4 may begin when scheduled. Implement Persistent Domain Model and Farm Configuration: put slicer ID/version, imported profile identifiers and digests, explicit material-density records, and profile validation state in farm configuration. Keep the OpenClaw slice tool Cura-only until the registry and validation are in place; make Orca, Bambu, and Creality selectable only after each imported profile passes it. Resolve the Bambu material anomaly before business quoting. Do not add printer control in Stage 4.

## Stage 4 implementation status

Stage 4 is **PASSED** for the persistent domain/configuration scope. The current implementation preserves Stage 3 evidence as profile-validation input; see the [Stage 4 implementation plan](stage-4-implementation-plan.md) and Stage 4 notes in the [roadmap](3d-print-farm-openclaw-roadmap.md). The registry records execution availability separately from quote status. Cura remains quote-review pending, Orca and Creality remain quote-review pending, and Bambu remains quote-blocked. OpenClaw still exposes only Cura, and no printer control was added.

## 2026-09-28 Bambu homologation follow-up

The historical Stage 3 Bambu result remains evidence for the old inherited profile snapshot: the same 02.08.02.61 image sliced the 20 mm fixture with one 12-triangle object, one filament, no filament changes, and 60 layers. Its G-code reported 18,079.40 mm of 1.75 mm filament, 43,486.04 mm³, 54.79 g, and 1.26 g/cm³. Length/volume/mass reconcile, but this toolpath is still anomalous and untrusted.

The first complete but inheritance-free bundle failed with `return_code=-17`, `process not compatible with printer`, because it discarded Bambu system identity and ancestry. The current resolver merges parent values while retaining bundled `from: system`, `setting_id`, preset name, `inherits`, and compatibility metadata. Studio accepted the chain (`compatible 1`) and produced a successful CLI slice: 481.49 s, 825.51 mm length, 1,985.58 mm³, 2.50 g at 1.26 g/cm³, one object/filament, 60 layers. Its CLI-exported 3MF exposes effective values in `Metadata/project_settings.config`. A headless `--export-settings` attempt emitted no separate config file.

The new result does not prove GUI parity or explain the prior ~43,487 mm³ result; both remain open. No physical print validation has started. One committed tester has now confirmed Bambu Lab A1 / 0.4 mm / Bambu Studio; the single-filament PLA and process choice are still investigation settings. Keep Bambu quote-blocked and outside the OpenClaw allowlist. Evidence, full effective settings, CLI log, G-code, 3MF, and normalized SlicerResult are in [`bambu-a1-system-chain`](../experiments/slicing/evidence/bambu-a1-system-chain/). See the [homologation plan](bambu-homologation-implementation-plan.md).

Three repeated slices of fixture SHA-256 `4ca3d19d01e11ee608d81218670db3547d320cbc7bef4e36b64339cf4285ad70` had a 0.0116% volume range and 0.2076% time range. The active Stage 4 candidate is profile version 4, execution `available`, quote `blocked`. Its registry source digest matches the adapter bundle digest; quote readiness remains blocked until GUI parity and the historical anomaly are resolved.

Bambu's quote approval path now requires structured evidence matching the profile digest and explicit successful GUI-parity and physical-print validation fields. Tests prove a mismatching/missing artifact cannot approve, while a fully matching artifact can pass the software gate; no real GUI or physical validation artifact exists yet.
