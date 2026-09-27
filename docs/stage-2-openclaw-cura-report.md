# Stage 2 — OpenClaw + Cura baseline report

**Date:** 2026-09-27 (America/Sao_Paulo)  
**Agent:** Codex  
**OpenClaw:** `2026.8.1` (`ea80657`, OpenClaw 2.0)  
**Environment:** Linux; Node.js `v24.16.0`; Python `3.14.2`; loopback Gateway `127.0.0.1:18789`, stopped after testing. No printer hardware or customer upload channel was connected.

## Result

The updated live OpenClaw flow successfully called the existing STL analyzer, CuraEngine 5.13.0, the existing quote engine, and SQLite persistence. A different OpenClaw session retrieved the stored result. The old Cura 5.0.0 image and legacy Ender-3 profile were not used for this run.

**Stage 2: passed for this controlled POC baseline.** The timing investigation established that the saved G-code's initial `;TIME:6666` is a CuraEngine placeholder, not the computed print estimate. CuraEngine's verbose estimate agrees with Cura GUI within 1.2%, and replaying Cura GUI's complete resolved settings through the same engine reproduced the GUI's time exactly. The 130 definition warnings remain visible and are classified below; they did not prevent a matching time estimate. This is not a physical-printer validation.

## Runtime and official profile

- Stable release: [UltiMaker Cura 5.13.0](https://github.com/Ultimaker/Cura/releases/tag/5.13.0), using its bundled `CuraEngine` (`Cura_SteamEngine version 5.13.0`). The official release listing marked it latest stable; `5.14.0-alpha.0` was a prerelease.
- Download: official Linux X64 AppImage, SHA-256 `100f068127b2598167f00ba4db0e0699ded45adf97bbab2d22ff171a1e1ecc40`.
- Local Docker image: `print-farm-cura-5.13.0:baseline`, image digest `sha256:904537896fd9a721bd68a0135a11652fa9510dc40ac92778f82c96447fb723b0`. It contains the AppImage's engine, runtime libraries, and official Cura resources on the local `debian:trixie` base. The extracted files and image are in ignored `.stage1/` state, not committed deployment assets.
- Official bundled machine definition: `ultimaker2_plus.def.json`; extruder: `ultimaker2_plus_extruder_0.def.json`; nozzle variant: `0.4 mm`.
- Official bundled material: `generic_pla.xml.fdm_material` (`generic_pla`, 2.85 mm filament diameter, 1.24 g/cm³ density, 200 °C print and 60 °C bed temperatures).
- Official process: `um2p_global_Normal_Quality.inst.cfg` plus `pla_0.4_normal.inst.cfg`; normal quality, 0.1 mm layer height, 20% infill, 50 mm/s print speed. The settings are passed through a fixed profile map. The two zero roofing/flooring layer values are explicit CLI compatibility defaults.
- Project profile ID: `cura-ultimaker2plus-generic-pla-normal`.

The AppImage was extracted and the engine, four bundled shared libraries, and the official Cura resource tree were copied into the local image. `CuraEngine help` reported 5.13.0 and the supported CLI. A first direct invocation without explicit roofing/flooring values exited unsuccessfully due to missing setting values; adding those explicit CLI defaults produced a successful slice. No Cura `[error]` diagnostics appeared in the successful run.

## Live OpenClaw proof

**Prompt:**

> Analyze small-box-20mm.stl, then create a Cura estimate for one copy using cura-ultimaker2plus-generic-pla-normal. Use analyze_stl first and pass its returned analysis_id to slice_stl. Report dimensions, Cura time and filament volume/estimated grams, quote cost and suggested price, warning count, and error count.

- OpenClaw run: `eda7eaed-d323-4a79-b6e6-6dee8bceefd5`; session: `62aa994a-6f45-4ee0-85fa-a1edc37994ee`.
- OpenClaw selected `analyze_stl` and `slice_stl`; both succeeded, zero tool failures, Code Mode not engaged.
- Agent response: dimensions 20 × 20 × 12 mm; 33m 55s; 2,968 mm³ and estimated 3.68 g; estimated cost R$1.53; suggested price R$2.54; 130 warnings and zero errors.
- Persisted estimate: `0505fee4-0f7d-4f65-9d8f-be5e98a45ea9`, analysis `0e671878-8e45-4d85-ab12-c49fedb675e3`.
- A separate session (`104ff3b3-6b2f-4796-87a5-a36f6ce5b56e`) used `get_latest_production_estimate` and retrieved the ID, filename, selected profile, Cura version, print time, material volume/mass, suggested quote, and `completed` status. Its run was `46c66559-998f-4c01-b709-39ff60268e10`.

## Metrics and quote

| Category | Value | Source |
| --- | ---: | --- |
| Cura verbose print time | 2,035 s (33m 55s) | CuraEngine verbose output |
| Filament volume | 2,968 mm³ | CuraEngine verbose output |
| Filament mass | 3.68 g | Derived from Cura volume and bundled material density, 1.24 g/cm³ |
| Estimated production cost | R$1.53 | Existing quote engine |
| Suggested unit/order price | R$2.54 | Existing quote engine, 40% gross margin |
| Estimated gross profit | R$1.02 | Suggested price less estimated costs |

Configured example business values were unchanged: PLA R$90/kg, machine R$2/hour, energy 0.12 kWh/hour at R$0.95/kWh, 40% gross margin, and zero setup. These are illustrative values, not this farm's verified costs. Slicer-derived values, configured assumptions, and estimated financial values remain separate in the structured tool result and SQLite row. Quantity one was tested; multi-copy estimates remain linear and do not model plate packing.

## Independent output comparison

The output G-code was inspected across all time-related comments. It has 119 time entries: the file starts with `;TIME:6666`, followed by per-layer `;TIME_ELAPSED` values, with the final modeled layer at `;TIME_ELAPSED:2035.302919`. The saved file also has an initial placeholder block with `;MATERIAL:6666`; its later metadata block reports `;MATERIAL:2968`. CuraEngine's post-slice console summary prints a corrected `;TIME:2035` header and `Print time (s): 2035`, but does not rewrite the file's initial placeholder header. This fixed-header behavior is also documented in [CuraEngine issue #559](https://github.com/Ultimaker/CuraEngine/issues/559), where the project reports the same `;TIME:6666` file header and a different computed console time.

The isolated official Cura 5.13.0 GUI test used the same `small-box-20mm.stl`, Ultimaker 2+, Generic PLA, 0.4 mm nozzle, and Fine - 0.1 mm process (the profile's quality type is `normal`). The GUI displayed 33 minutes; its engine log gave **2,011 s (33m 31s)**. The project CLI runner reported **2,035 s (33m 55s)**, a 24-second / 1.2% difference. A one-off CLI replay of the complete 2,715-token settings vector logged by the GUI returned **2,011 s**, matching the GUI exactly. That replay emitted the same 130 warnings and no errors. The replay's filament volume was 2,296 mm³, versus 2,260 mm³ in the GUI log; the project runner's simplified fixed-setting invocation reports 2,968 mm³. The timing comparison is strong; exact material/profile parity across those invocations is not established.

The project runner loads the official machine and extruder definitions and sets the selected nozzle, material diameter/temperatures, layer height, infill, top/bottom thickness, cooling, and selected speeds. It does not serialize all 2,715 resolved GUI settings. The complete-settings replay shows that the engine accepts Cura's resolved global settings and returns the GUI time, while the ordinary project invocation differs by 24 seconds. The current project result is therefore a close controlled estimate, not a byte-for-byte equivalent reproduction of the GUI's entire settings state.

`;TIME:6666` is placeholder metadata and must not be parsed as the estimate in this setup. The authoritative time source for this fixed Cura 5.13.0 integration is CuraEngine's post-slice `Print time (s)` verbose metric; `;TIME_ELAPSED` at the final modeled layer is an independent consistency check. The 2,035 s CLI result and the 2,011 s GUI result agree reasonably.

## Security and persistence

The narrow plugin design and policy were unchanged: model-selected filename is a basename only, profile is a single enum, and there is no arbitrary shell, path, Docker argument, or settings input. The runner verifies the matching saved analysis and a non-symlink regular STL no larger than 25 MiB, copies it into a private temporary directory, and runs a fixed Docker argument vector. Cura had no network, ran under the Gateway UID/GID, and used a read-only root, read-only input mount, 1 GiB memory, two CPUs, 64 pids, 64 MiB temporary filesystem, 30-second slicer timeout, and 1 MiB captured-output limit. OpenClaw stayed loopback-only, on the minimal profile; `exec` and `process` remained denied, and Code Mode stayed disabled. The trusted host Docker daemon remains outside the container boundary.

SQLite table `production_estimates` saved the analysis/estimate identifiers, filename, selected profile, normalized slicing result, estimated material and time, quote, business configuration, timestamp, request summary, and completed status. The separate-session retrieval proves application persistence independently of conversation history.

## Limitations and next step

- The 130 `[warning]` diagnostics are all the same class: `JSON setting '<name>' has no [default_]value!` for 122 distinct setting names. They arise while loading bundled setting definitions that omit a literal default. Names include motion, speed, acceleration, cooling, and retraction settings, so the warning text alone does not prove those values are harmless or unresolved. However, Cura GUI slicing and a CLI replay of its complete resolved settings both completed with these same 130 warnings, zero errors, and matching 2,011-second time. They did not prevent the tested time estimate from matching.
- The project runner's fixed settings map is narrower than Cura's full resolved profile state. Its time is 24 seconds (1.2%) above the GUI, and its volume differs more materially; do not treat the simplified map as exact GUI equivalence or use its material output as physically validated production data.
- The local image currently lives in ignored `.stage1/` state. A future deployment task still needs a checked-in, version-pinned runtime build/setup recipe and licensing review.
- The Ultimaker 2+ profile is a controlled official baseline, not a model of the farm's physical printer. No physical print, customer upload, hardware control, or farm-specific pricing was tested.
- The quote is illustrative and depends on configured assumptions. The agent should not present it as a real customer offer before farm values and time reliability are established.

**Next recommendation:** preserve the verbose CuraEngine time as the normalized source for this tested profile and add a focused regression check that rejects placeholder `;TIME:6666` as a time source. Before relying on material estimates or broadening profiles, align the project's fixed settings map with Cura's fully resolved profile values and compare the resulting material metrics. Stage 3 may begin as bounded slicer research; no printer control or physical-print claim follows from this result.

**STAGE 2: PASSED**

Evidence: Cura 5.13.0 successfully sliced the real fixture without `[error]` diagnostics; the OpenClaw flow returned normalized metrics, the quote engine consumed them, SQLite persisted the estimate, and a separate session retrieved it. The saved G-code's `;TIME:6666` was confirmed as placeholder metadata. The CLI estimate (2,035 s) agreed within 1.2% with the isolated GUI estimate (2,011 s), and replaying the GUI's resolved settings through CLI reproduced 2,011 s. The 130 setting-definition warnings were present during both GUI-equivalent and project CLI runs with zero errors. Exact material parity and physical-printer accuracy remain limitations, not blockers to this timing-focused Stage 2 proof.
