# Architecture Decisions

## 2026-09-27 — Normalize Cura and Orca outputs before quote calculation

**Decision:** Keep the model-facing OpenClaw slicer choice fixed to the existing Cura profile for now. Introduce a code-backed, allowlisted `SlicerAdapter` prototype for CuraEngine 5.13.0 and OrcaSlicer 2.4.2. Normalize the fields supported by both tested outputs—slicer/version, fixed profile identifiers, print-time seconds, filament volume, warnings, and errors—then pass those values to one generic quote function with explicit density configuration.

**Reason:** Both adapters sliced the same staged STL and the quote function consumed each result without branching on slicer identity. Orca required a fixed absolute-extrusion compatibility setting, and its tested G-code reported zero density and grams. The shared material volume and explicit quote-density conversion make that limitation visible instead of relying on incompatible per-slicer business logic.

**Boundary:** Adapter profile IDs map only to fixed images, resources, and settings; neither the agent nor the caller supplies arbitrary shell commands, host paths, slicer flags, or free-form setting maps. The Orca machine profile records the CLI compatibility value. No Orca OpenClaw exposure, printer control, profile auto-import, or cross-slicer accuracy comparison is authorized by this prototype.

**Revisit when:** Stage 4 implements versioned imported profiles and configured material densities, then validates Orca's resolved profile against the actual farm printer.

## 2026-09-27 — Treat business roles as flexible and composable

**Decision:** Customer, Operator, and Owner are business roles/capabilities, not three distinct people. A user may hold multiple roles, such as `[OWNER, OPERATOR]`; larger teams may assign roles to different or overlapping users.

**Previous assumption:** Product examples and workflows often represented Customer, Operator, and Owner as separate people, implying a staffed print farm.

**Reason:** Many qualified businesses start with one person who receives customer jobs, quotes them, and runs the printers. The product must also remain useful as those businesses grow into teams.

**Impact:** Broaden the ICP to small 3D-printing businesses and print farms with real customer jobs; let onboarding fit solo or team operations; model authorization as capabilities assigned to users; update landing and distribution copy. Future agents must not assume Owner and Operator are different people.

**Non-goal:** Generic hobbyists without a real or emerging business workflow are not the primary ICP. This decision does not require a full authorization-system redesign before needed.

## 2026-09-26 — Expose STL analysis as a narrow OpenClaw plugin tool

**Decision:** Keep the existing Python analyzer and expose it through a small OpenClaw plugin tool with a single `filename` parameter. Use a workspace `SKILL.md` for instructions and tool selection.

**Reason:** The skill is appropriate for workflow guidance; the plugin owns validation and local execution. The model does not receive repository shell access or an arbitrary path parameter.

**Boundary:** The plugin accepts only basenames from a configured job directory, rejects symlinks, caps the file at 25 MiB, invokes the fixed analyzer with `execFile`, limits it to 10 seconds / 1 MiB output, and removes its private temporary copy. OpenClaw policy uses the `minimal` profile, explicitly allows only project tools, denies `exec` and `process`, and disables Code Mode.

## 2026-09-26 — Treat OpenClaw sessions as collaboration context, not print-farm ACLs

**Decision:** Model customer, operator, and owner authorization in application policy tied to verified identities and jobs. Do not use session owners, labels, session names, or `dmScope` as the product's access-control system.

**Reason:** OpenClaw multi-user sessions are collaboration features inside one trusted Gateway. The Stage 1 tests used two sessions on one `main` agent but did not provision two authenticated user profiles. A print farm remains one Gateway trust domain; each farm runs its own Gateway.

## 2026-09-26 — Keep application persistence separate from Gateway history

**Decision:** Store Stage 1 analysis results in a project-local SQLite database, separate from OpenClaw session/transcript storage.

**Reason:** A fresh OpenClaw session successfully retrieved an earlier analysis through an explicit project tool. Job records need stable IDs, status, timestamps, and future authorization/retention rules regardless of chat history.

## 2026-09-26 — Require a controlled upload-to-job handoff before accepting customer STL uploads

**Decision:** The Stage 1 tool accepts only an already staged filename. Add no direct arbitrary-path or model-selected host-file access. Build an upload adapter before customer-facing file intake.

**Reason:** OpenClaw attachment references and managed-media paths are not equivalent to the project jobs-directory contract. The adapter must bind an upload to a verified sender/session and application job, validate it, copy it safely, and enforce size and retention before the existing analyzer runs.

## 2026-09-26 — Defer Plow and Agent Index publication

**Decision:** Do not publish or register the project during Stage 1.

**Reason:** The runtime proof is local and the deployment contract, role onboarding, upload path, and Cura packaging remain incomplete. Agent Index usage reporting is separate from the local print-farm capability and must use its own protected credential and persistent install state if adopted later.

## 2026-09-27 — Expose Cura estimate through a fixed-profile OpenClaw tool

**Decision:** Add `slice_stl(filename, analysis_id, profile, quantity)` to the existing project plugin. Require an `analyze_stl` record for the same filename, allow only the named Cura POC profile, invoke the existing CuraEngine Docker image with fixed arguments, discard generated G-code, pass normalized estimates to the existing quote engine, and persist completed estimates in the application SQLite database.

**Reason:** A single profile and a stable analysis ID keep the model from choosing arbitrary slicer settings or host paths, while the successful Stage 2 conversation proves the actual OpenClaw → analysis → Cura → quote path.

**Boundary:** The file must be a basename under the approved jobs directory, a regular `.stl` file, and at most 25 MiB. The runner reopens it without following a final symlink and copies it into a private temporary directory mounted read-only. Cura runs as the Gateway caller's numeric UID/GID with networking disabled, a read-only root, 1 GiB memory, two CPUs, 64 MiB temporary storage, 64 process limit, and a 30-second execution timeout. Tool execution is capped at 40 seconds and structured output at 1 MiB. Docker still runs through the trusted host daemon; this is not an OS sandbox for the Gateway process.

**Historical limitation (superseded by the 2026-09-27 baseline cleanup below):** The first Cura 5.0.0 run returned metrics but emitted warnings and two `[ERROR]` diagnostics for the legacy generic Ender-3 profile.

## 2026-09-27 — Use Cura 5.13.0 bundled definitions for the Stage 2 baseline

**Decision:** Replace the legacy 5.0.0/Ender-3 proof mapping with official Cura 5.13.0 resources: Ultimaker 2+ machine and extruder definitions, Generic PLA material, and the bundled Normal 0.4 mm process profile. Keep the OpenClaw tool schema narrow and pass only this fixed profile; retain the existing private staging, Docker limits, quote engine, and SQLite record.

**Reason:** The updated real agent flow exits successfully with no Cura `[error]` diagnostics and persists a quote retrieved by a different session. This establishes a cleaner versioned reference profile without asserting that it matches the farm's hardware.

**Boundary:** CuraEngine runs from the official 5.13.0 Linux AppImage inside a local Docker image with no network and the existing resource limits. The model still cannot provide paths, commands, Docker arguments, or arbitrary slicer settings.

**Limitation (timing issue resolved; profile parity still limited):** The engine emitted 130 setting-definition warnings in CLI mode. Investigation established that the saved G-code's `;TIME:6666` is placeholder metadata; verbose output reported 2,035 seconds and the final `;TIME_ELAPSED` was 2,035.303 seconds. The GUI reported 2,011 seconds. The project's simplified settings map is not identical to Cura's complete resolved state, and material-volume parity remains unresolved.

## 2026-09-27 — Use CuraEngine verbose time, not the saved G-code `;TIME` header

**Decision:** For the tested Cura 5.13.0 profile, normalize print time from CuraEngine's post-slice `Print time (s)` output. Use the last modeled-layer `;TIME_ELAPSED` value only as an independent consistency check. Do not use the saved G-code's initial `;TIME:6666` field as the estimate.

**Reason:** The same fixture produced 2,035 seconds in the project CLI run, 2,011 seconds in Cura GUI, and 2,011 seconds when the GUI's complete resolved setting vector was replayed through CuraEngine CLI. The G-code file retained `;TIME:6666`, while its final `;TIME_ELAPSED` was 2,035.303 seconds. CuraEngine's post-slice console prints the computed time separately and does not rewrite the file's placeholder header.

**Scope:** This establishes a source for print-time normalization for the tested Cura 5.13.0 profile and fixture. It does not establish exact material-volume parity, validate another profile, or guarantee physical print duration.

## 2026-09-27 — Persist explicit estimate snapshots separately from OpenClaw sessions

**Decision:** Store production estimate snapshots in a `production_estimates` SQLite table linked to the `stl_analyses` ID. Record the filename, profile, slicer result, derived material and time, quote, example business configuration, request summary, timestamp, and completed status.

**Reason:** A second OpenClaw session successfully retrieved the saved estimate through a dedicated tool. The row remains available independently from transcript/session context and records the exact input configuration used for the estimated quote.
