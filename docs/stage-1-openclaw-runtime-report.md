# Stage 1 — OpenClaw Runtime Proof

**Date:** 2026-09-26 (America/Sao_Paulo)  
**Agent:** Codex  
**Project:** `/home/caio/code/pessoal/print-farm-openclaw-agent`  
**OpenClaw:** `2026.8.1` (`ea80657`), the release documented as OpenClaw 2.0  
**Environment:** Linux, Node.js `v24.16.0`, npm `11.13`, Python `3.14.2`; loopback Gateway. Docker was installed but not used.

## 1. Did OpenClaw 2.0 run successfully?

**Yes.** The real `2026.8.1` Gateway reached `ready` at `127.0.0.1:18789`, loaded the project plugin and skill, accepted agent requests, executed the local tool, and returned a model response. The Gateway was run in the foreground; no system service or public listener was installed.

The OpenClaw package was installed into an isolated project npm prefix. Its state and configuration live under `.stage1/state`, which is mode `0700`; the config file is mode `0600`. `.stage1/` is Git-ignored. The device-code sign-in was completed with the user's approval and its auth profile remains in that protected state directory. No auth code, password, or token is recorded in this report.

## 2. What exact version/setup was used?

The runtime was installed with:

```sh
npm install --prefix .stage1/runtime openclaw@2026.8.1
```

The version check returned `OpenClaw 2026.8.1 (ea80657)`. The project plugin was scaffolded with the OpenClaw plugin CLI, built and validated with its local pinned TypeScript toolchain, and loaded through an explicit project plugin path. Python `3.14.2` runs the existing STL analyzer. No database server, Docker container, Cura process, or printer service was used for Stage 1.

The test Gateway command was:

```sh
OPENCLAW_CONFIG_PATH="$PWD/.stage1/state/openclaw.json" \
OPENCLAW_STATE_DIR="$PWD/.stage1/state" \
  ./.stage1/runtime/node_modules/.bin/openclaw gateway run
```

The Gateway was configured for local mode, loopback binding, token authentication, and port `18789`. The default model was set to `openai/gpt-5.6-luna`, which worked with the authenticated account. An earlier attempt with `openai/gpt-5.6-sol` failed with an account-model compatibility error; selecting an account-listed model fixed it.

Starting Git state: this project directory and its parents had no `.git` directory. `git status` returned `fatal: not a git repository`. No repository was initialized and no remote changes were made.

## 3. How does this project integrate with OpenClaw?

The integration is the smallest code-backed capability plus one workflow skill:

- [STL analysis plugin](../openclaw/plugins/print-farm-stl/src/index.ts) defines `analyze_stl` and `get_latest_stl_analysis` with TypeBox input/output schemas.
- [Analyze STL skill](../openclaw/workspace/skills/analyze-stl/SKILL.md) tells the model when to use the tool, to pass only a staged basename, and to report the analyzer's units/heuristic limitations.
- Existing [STL analyzer](../experiments/stl-analysis/analyze_stl.py) remains the geometry implementation. The plugin invokes its fixed path with `execFile`; no shell command or model-provided executable path is accepted.
- [Persistence helper](../experiments/stl-analysis/persistence.py) stores explicit application records in `.stage1/state/print-farm.sqlite`, separate from OpenClaw's conversation database.

OpenClaw owns the Gateway, agent/session lifecycle, workspace skill loading, model calls, and tool dispatch. The project plugin owns deterministic input validation, the analyzer handoff, result schema, and application persistence. Official OpenClaw docs describe this separation: [Gateway architecture](https://docs.openclaw.ai/gateway/protocol), [skills](https://docs.openclaw.ai/tools/skills), and [plugin tool selection](https://docs.openclaw.ai/tools).

## 4. Did OpenClaw successfully call the STL analyzer?

**Yes, on OpenClaw 2.0.** The exact user prompt was:

> Analyze this STL and tell me its dimensions in millimeters. The file is small-box-20mm.stl in the approved jobs folder.

The Gateway agent used model `openai/gpt-5.6-luna` and selected `analyze_stl` with:

```json
{"filename":"small-box-20mm.stl"}
```

The successful Gateway run was `fc283e87-ee35-466f-9d3e-4f66424b0448`; the tool call ID was `exec-228a1b6e-6be8-4938-be0a-c1b8ff69bb16`. Its structured result included:

```json
{
  "success": true,
  "filename": "small-box-20mm.stl",
  "analysis_id": "b5bd69cf-2e4b-413a-baf6-a67fa7637f7e",
  "analysis": {
    "format": "binary",
    "triangle_count": 12,
    "connected_components_by_shared_vertices": 1,
    "dimensions_mm": {"x": 20, "y": 20, "z": 12},
    "bounds_mm": {"min": [0, 0, 0], "max": [20, 20, 12]},
    "volume_cm3": 4.8,
    "watertight_heuristic": true,
    "boundary_or_nonmanifold_edges": 0,
    "fits_example_220x220x250mm": true,
    "orientation": "STL has coordinates but no reliable print orientation metadata",
    "units_assumption": "millimetres; STL itself does not encode units"
  }
}
```

The final agent response was:

> `small-box-20mm.stl` dimensions: **20 × 20 × 12 mm** (X × Y × Z). The STL is watertight; dimensions assume the file’s coordinates are in millimeters.

OpenClaw run metadata reported one successful tool call named `analyze_stl`, no tool failures, and `codeModeEngaged: false`. A separate invalid-input probe called the same tool with `../small-box-20mm.stl`; the tool returned `Pass a filename only; directory paths are not accepted.` A nonexistent `missing-sample.stl` produced `The file or configured analyzer was not found.`

## 5. How should local tools be exposed safely?

Use a project plugin tool for executable local work and a workspace skill for instructions. The agent configuration used `tools.profile: minimal`, allowed only `analyze_stl` and `get_latest_stl_analysis`, denied `exec` and `process`, and disabled Code Mode. The Codex app-server ran in Guardian mode; the successful turn did not engage Code Mode. The agent did not receive an unrestricted repository shell.

The plugin requires an absolute configured jobs directory, accepts only a basename ending in `.stl`, rejects traversal, nonexistent paths, non-regular files, and final-component symlinks, and caps input at 25 MiB. It copies the file to a private temporary directory and invokes the fixed analyzer using `execFile` with a 10-second timeout and 1 MiB output cap; it removes the temporary directory after completion. The model cannot choose the Python script, arbitrary working directory, executable, or shell command.

This is a narrow and bounded host process, not an OS sandbox: the Gateway and analyzer still run under the same OS user. A dedicated container or OS-level process isolation should be considered for untrusted customer files before production intake.

## 6. How does persistence work?

After the analysis, a second OpenClaw 2.0 interaction used a distinct session key and called `get_latest_stl_analysis`. It returned the stored `small-box-20mm.stl` record with dimensions `20 × 20 × 12 mm`, analysis ID `b5bd69cf-2e4b-413a-baf6-a67fa7637f7e`, a UTC timestamp, and status `completed`. This second call succeeded as Gateway run `c1b048a1-10c7-4814-a75c-d139d26b5c0f`.

OpenClaw session memory is the Gateway-owned conversation/transcript state. Application persistence is the separate SQLite database with the `stl_analyses` table. A new session has no prior chat text but can retrieve a result through the explicit application tool.

## 7. What did multiplayer actually do in tests?

Two different session IDs were created for the same configured `main` agent. The sessions had different conversation context: a harmless marker placed in one session was unknown in another. The application SQLite record was shared across those sessions, and the second session retrieved the first analysis.

This was a **session** test, not a distinct-human identity test. Both sessions were sent through the OpenClaw CLI and recorded the same `cli` observation identity. `openclaw users list --json` returned `{"profiles":[]}`. No Gateway user profiles or application role assignments were configured for the test. Customer, Operator, and Owner are composable product capabilities, so the product does not require one profile per role. OpenClaw's multi-user mode supports session ownership and participant history, but the official trust model treats those as collaboration features, not security boundaries. Role-based access to farm jobs must be implemented and tested separately. Each print farm should keep its own Gateway trust domain; cross-company tenancy is not needed for this product.

## 8. How should STL/file inputs work?

The analyzer tool currently accepts only a file already staged under the configured jobs directory. That narrow contract was exercised with the POC fixture and traversal probe. A normal upload from the Control UI or a messaging channel was **not** exercised: no messaging channel account was configured, and the Control UI browser was at its Gateway authentication screen rather than an authenticated user chat.

Current OpenClaw Control UI documentation describes file uploads as managed chat attachments; that does not automatically satisfy the plugin's approved-job-directory contract. The Gateway's `terminal.upload` operator RPC stages up to 16 MiB for 24 hours and returns a host path, but it is a terminal/operator upload mechanism, not the customer chat attachment flow. The exact OpenClaw 2.0 attachment handle, storage path, job/session scope, and cleanup policy were not demonstrated.

Before customer uploads, add a controlled adapter that resolves the attachment through OpenClaw, verifies the sender/profile and job, enforces size/type limits, copies it without following symlinks into a unique private job directory, and applies retention cleanup. The model should pass a generated job ID or filename to the analyzer, never an arbitrary host path. For later slicer work, hand off only this validated staged file.

## 9. What does another user need to deploy their own instance?

Each print-farm owner needs their own OpenClaw installation and state: a supported Node.js runtime, pinned OpenClaw package, their model-provider authentication, Gateway/channel setup, the project plugin and workspace skill, Python for the existing analyzer, a private persistent state/job directory, and farm-specific printer/profile/cost configuration. CuraEngine/Docker setup will be added only when Stage 2 calls the existing slicer POC.

The local proof used:

```sh
npm install --prefix .stage1/runtime openclaw@2026.8.1
cd openclaw/plugins/print-farm-stl
npm ci
npm run plugin:build
npm run plugin:validate
```

Then it loaded the plugin from its explicit path, set `agents.defaults.workspace` to the project workspace, configured the two allowlisted tools, and ran the Gateway command in section 2. A deployment script/image should make these steps repeatable without copying any operator's auth state. It should initialize a new farm's state, job directory, and SQLite database, verify the required Python/slicer dependencies, and ask the farm owner to configure credentials through OpenClaw onboarding.

The Agent Index publish guide recommends a Plow OpenClaw base image for its one-click path. Its BYO path runs the Agent Index client beside an existing agent, registers the listing, and schedules usage reporting every five minutes. The client needs its own `PLOW_AGENT_TOKEN` and persistent install state; the token must remain outside images and source. Nothing was registered or published in Stage 1. See [Agent Index publish](https://aiworthusing.com/agent-index/publish) and [Agent Index client](https://github.com/plow-pbc/agent-index-client).

## 10. What blockers remain?

- A verified multi-user Gateway identity/profile setup and customer/operator/owner application authorization were not tested.
- User-facing upload of an STL into a job directory, per-job ownership, and retention/cleanup were not tested.
- The analyzer runs as the Gateway OS user; no container/seccomp/process sandbox was used.
- The OpenClaw security audit reported zero critical findings and three warnings: reverse-proxy trust guidance while loopback-only, unpinned Codex plugin install metadata, and the local deep-audit CLI missing `operator.read` scope.
- One model was not supported by the authenticated account. A different account may have a different model catalog.
- Plugin installation/build in a clean second-user deployment, Cura execution from OpenClaw, Plow deployment, and Agent Index reporting remain unverified.

## 11. Is the architecture ready for Stage 2?

**Ready for a narrow Stage 2 integration against pre-staged local files.** OpenClaw 2.0 can load this project's plugin and skill, choose the analyzer tool, execute the existing code, return structured results, and retrieve saved data across sessions. Stage 2 can add one bounded tool over the existing Cura POC while preserving the same minimal tool policy.

It is not ready for customer file intake, role-based customer data access, or automatic printer control. Those workflows depend on the unresolved upload and verified identity boundaries.

## 12. What exact work should happen next?

1. Wrap the existing Cura POC as one `slice_stl` plugin tool that accepts a staged job filename, uses the existing approved profile, enforces output/time limits, and returns structured estimate data. Do not add other slicers or printer control yet.
2. Design and test the attachment-to-job adapter, including verified user/session identity, safe copy, size limits, per-job ownership, and retention cleanup.
3. Provision two real Gateway profiles and repeat the same-agent session tests from the Control UI or intended channel. Record identity attribution and explicitly test that job access is enforced by application policy.
4. Pin the Codex plugin install record, resolve the audit CLI's read-scope setup for repeatable security checks, and then package a clean install script/image for another farm owner.
5. Revisit Plow and BYO Agent Index packaging only after the local Stage 2 workflow is stable; do not publish/register until the required listing and usage-reporting process is chosen.

**STAGE 1: PARTIALLY PASSED**

The main proof ran on the required OpenClaw 2.0 release: an OpenClaw conversation selected a restricted local tool, the existing analyzer processed a real STL fixture, structured analysis returned to the agent, and a second session retrieved explicitly persisted application state. Session-level collaboration was tested, but separate human profiles/roles and real user-facing STL upload were not. Those gaps prevent claiming the broader Stage 1 multiplayer/file-intake criteria as complete.
