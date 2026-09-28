# 3D Print Farm OpenClaw Agent — Product Direction and Technical Roadmap

## 1. Purpose

This document consolidates the current product direction, technical decisions, architectural principles, known constraints, and next implementation stages for the **3D Print Farm OpenClaw Agent**.

The goal is not to build a generic "STL calculator".

The goal is to build an **AI operational employee for small 3D-printing businesses and print farms** that sits between customers, the people running the business, printers, and slicers. It must work for a solo business owner and for a team.

The agent should help move real work through the operation:

```text
Customer request
→ STL analysis
→ slicing
→ quote
→ approval
→ production queue
→ printer assignment
→ operator execution
→ completion/failure
→ business metrics
```

The project lives at:

```text
/home/caio/code/pessoal/print-farm-openclaw-agent
```

All architecture, source code naming, documentation, configuration descriptions, and technical artifacts should be written in **English**.

---

# 2. Important Deployment Assumption

Each user/customer will run **their own OpenClaw instance and their own copy of this agent**.

We are **not** building a centralized SaaS where multiple print farms share our OpenClaw Gateway.

Therefore:

- each print farm owns its runtime;
- each print farm owns its local configuration;
- each print farm owns its STL files and job history;
- each print farm connects its own slicers and printers;
- each print farm stores its own costs, materials, machine data, and operational metrics;
- each deployment can be treated as one trusted farm environment.

This significantly reduces the multi-tenant isolation concern.

OpenClaw multi-user still matters for collaboration inside one trusted deployment, but we do not need to design cross-customer tenant isolation inside one Gateway.

---

# 3. Product Roles

Customer, Operator, and Owner describe business roles and capabilities, not three required people. A person can hold any combination of roles; for example, a solo business user can be both Owner and Operator. Larger teams can assign those roles to different people. Do not make onboarding, workflow, data models, or authorization depend on one person per role.

Model assignments as a set of roles on a user, for example:

```text
User A: [OWNER, OPERATOR]
User B: [OPERATOR]
User C: [OWNER]
```

The application authorization policy should grant the capabilities associated with each assigned role. This is a product direction, not a request to build a full authorization system before the relevant workflows require it.

## 3.1 Customer

The customer interacts with the agent to request work.

Typical actions:

- send an STL;
- inform quantity;
- choose or request material/color;
- ask for a quote;
- receive print estimate;
- receive price;
- approve or reject the quote;
- ask for order status.

Example:

```text
Customer:
I need 4 copies of this part in black PETG.

Agent:
The model fits the selected printer profile.

Estimated print time: 8h 42m
Estimated material: 318 g
Estimated price: $42.00

Would you like to approve this order?
```

---

## 3.2 Operator

The operator is responsible for the physical production environment.

Typical actions:

- receive newly approved jobs;
- confirm printer availability;
- verify correct filament/color;
- verify that the print bed is clean;
- confirm the machine is ready;
- start the physical print when appropriate;
- update status;
- report failures;
- mark machines as offline or under maintenance.

Example:

```text
Agent:
Order #137 was approved.

Suggested printer: Bambu A1 #2
Material: Black PLA
Estimated duration: 3h 47m

Please verify:
- correct filament/color
- clean print bed
- printer availability

Confirm when ready.
```

The agent should coordinate the operator, not blindly assume that physical conditions are correct.

---

## 3.3 Owner

The owner configures the business model and monitors the operation.

Typical actions:

- configure supported materials;
- configure material costs;
- configure machine-hour costs;
- configure energy cost;
- configure minimum job fee;
- configure margins;
- configure printers;
- configure slicer profiles;
- ask for queue status;
- ask for utilization;
- ask for revenue;
- ask for estimated costs and margins;
- receive daily operational summaries.

Example:

```text
Owner:
How did the farm perform today?

Agent:
12 jobs completed
7 customer orders completed
Estimated revenue: $842
Estimated production cost: $286
Estimated gross contribution: $556
Total machine time: 38h 42m
2 printers currently idle
```

Financial values must be clearly labeled as **estimated** unless backed by authoritative accounting data.

Owner and Operator tasks may belong to the same user. References to these roles below describe responsibilities; they do not imply separate accounts or a required handoff.

---

# 4. Business Configuration

Business configuration is a core feature, not an optional dashboard feature.

The initial implementation can use conversational setup + persistent storage. A web dashboard is not required for the first release.

Example configuration model:

```text
Materials

PLA Black
- cost_per_kg: 82.00
- selling_price_per_kg: 160.00

PETG Black
- cost_per_kg: 95.00
- selling_price_per_kg: 190.00


Business Rules

- machine_hour_cost: 2.50
- energy_cost_per_hour: 0.60
- minimum_margin_percent: 35
- minimum_order_fee: 10.00
- currency: BRL
```

The agent must explain how a quote was calculated.

The quote engine must use configurable parameters instead of hard-coded assumptions.

---

# 5. Core Architectural Decision: Separate Slicer and Printer Layers

A major architectural decision is to treat **slicing software** and **physical printer connectivity/control** as two independent layers.

They must not be coupled.

---

# 6. Slicer Layer

The system should expose one internal slicer contract.

Example conceptual interface:

```text
SlicerAdapter
  slice(job, printer_profile, material_profile, process_profile)
  validate_profile(...)
  inspect_result(...)
```

Different slicers can implement that contract.

Initial candidates:

```text
CuraEngine
OrcaSlicer
Bambu Studio
Creality Print
PrusaSlicer
```

The application should not care which slicer produced the result.

A normalized slicer result must preserve the units and measurement basis evidenced by the selected adapter. The Stage 3 prototype uses:

```json
{
  "schema_version": 1,
  "slicer_id": "orcaslicer",
  "slicer_version": "2.4.2",
  "profile": {
    "id": "orca-ender3-v3se-04-generic-pla-standard",
    "printer": "Creality Ender-3 V3 SE 0.4 nozzle",
    "process": "0.20mm Standard",
    "material": "Generic PLA @System"
  },
  "print_time_seconds": 1062,
  "material_consumption": {
    "volume_mm3": 2020
  },
  "warnings": [],
  "errors": [],
  "output_artifact": {"media_type": "text/x-gcode", "size_bytes": 203885}
}
```

The result is evidence-derived, but still a prototype. Output artifact metadata is optional because Cura's Stage 3 adapter discards G-code. The generic quote function receives density from quote/business configuration and derives grams from this common volume field; the tested Orca G-code reported density/grams as zero. See the [Stage 3 report](stage-3-multi-slicer-proof-report.md) before extending this contract.

---

# 7. Slicer Strategy

The system must not assume:

```text
Ender = Cura
Bambu = Bambu Studio
Creality = Creality Print
```

Instead:

```text
STL
  ↓
Slicer abstraction
  ├── Cura adapter
  ├── Orca adapter
  ├── Bambu Studio adapter
  ├── Creality Print adapter
  └── PrusaSlicer adapter
```

A user should be able to configure which slicer/profile they actually use.

The product should prefer **explicitly imported/validated profiles** over guessing a printer configuration from natural language.

---

# 8. Printer Layer

Physical printer connectivity is a separate abstraction.

Conceptual interface:

```text
PrinterAdapter
  get_status(...)
  get_current_job(...)
  get_progress(...)
  submit_job(...)
  start_job(...)
  pause_job(...)
  cancel_job(...)
```

Not every adapter needs to support every operation.

Potential adapters:

```text
OctoPrint
Moonraker
Bambu
Creality
Manual
```

---

# 9. Manual Printer Adapter Is a First-Class Feature

The **Manual** adapter is important.

A printer does not need an API to participate in the farm.

Example:

```text
Printer: Ender 3 #2
Adapter: manual
Status: IDLE
Material: PLA Black
Build volume: 220 x 220 x 250
```

The operator can update the machine conversationally:

```text
Operator:
Ender 3 #2 finished the job.

Agent:
Printer Ender 3 #2 is now IDLE.
Order #128 has been marked as completed.
```

This lets the product support old, disconnected, or proprietary printers without pretending that universal automatic control exists.

---

# 10. Printer Independence

The intended product claim is:

> The farm workflow should not depend on a single printer manufacturer.

The product should NOT claim:

> We automatically control every 3D printer.

Compatibility should be achieved through:

1. normalized printer metadata;
2. printer adapters when integrations exist;
3. manual operation when they do not.

---

# 11. Current POC Evidence

The current POC already proved:

## Tested

- CuraEngine 5.0.0 can be built in the isolated project.
- CuraEngine successfully sliced four STL fixtures.
- STL analysis works for basic dimensions and mesh-related information.
- A configurable quote engine works.
- A mocked farm can recommend a compatible printer.
- An end-to-end CLI flow can execute:
  - STL analysis;
  - slicing;
  - quote;
  - mock printer recommendation.

## Investigated but not validated end-to-end

- PrusaSlicer CLI.
- OctoPrint APIs.
- Moonraker APIs.
- OpenClaw multi-user documentation.

## Not yet tested

- OpenClaw runtime inside this POC.
- OpenClaw multiplayer sessions.
- OrcaSlicer slicing.
- Bambu Studio slicing.
- Creality Print slicing.
- Real printer integration.
- Real OctoPrint instance.
- Real Moonraker instance.
- Physical print validation.
- Agent Index registration/deployment flow.

---

# 12. Current Product Model

Customer, Operator, and Owner are role/capability labels that may be assigned in combination to a user. They are not separate required person records. A solo deployment can have one business user with `[OWNER, OPERATOR]`; a team can distribute the same roles across several users.

The target domain model should evolve toward something similar to:

```text
Customer
Operator
Owner

Material
Printer
PrinterProfile
SlicerProfile
ProcessProfile

Quote
Order
PrintJob
JobEvent

CostConfiguration
BusinessConfiguration

DailySummary
FarmMetrics
```

This is conceptual and should be refined based on implementation evidence.

---

# 13. Order and Production Flow

Target flow:

```text
Customer sends STL + quantity + material
        ↓
STL validation and analysis
        ↓
Select validated slicer/printer/material profile
        ↓
Slice
        ↓
Normalize print time + material consumption
        ↓
Quote engine
        ↓
Operator/owner review when required
        ↓
Customer approval
        ↓
Persist order
        ↓
Create print job
        ↓
Farm scheduler recommends printer
        ↓
Operator receives preparation checklist
        ↓
Operator confirms machine readiness
        ↓
Print starts manually or through supported adapter
        ↓
Job progress/status
        ↓
Completed / Failed
        ↓
Metrics and reporting
```

---

# 14. Farm Scheduling

The scheduler should work on normalized printer data.

Example printer states:

```text
IDLE
PRINTING
OFFLINE
MAINTENANCE
UNKNOWN
```

Scheduling can initially consider:

- printer build volume;
- material compatibility;
- current state;
- queue;
- estimated finish time;
- required nozzle/profile if configured.

The first scheduler does not need to solve industrial optimization.

It needs to produce an explainable recommendation.

Example:

```text
Recommended printer: A1 #3

Reason:
- idle
- compatible build volume
- PLA Black loaded
- no queued job
```

---

# 15. Metrics and Owner Reporting

The system should persist enough events to derive useful operational metrics.

Potential metrics:

- orders quoted;
- orders approved;
- jobs queued;
- jobs completed;
- jobs failed;
- estimated material consumed;
- estimated machine hours;
- machine idle time;
- utilization;
- estimated revenue;
- estimated production cost;
- estimated contribution/margin;
- orders waiting for operator;
- delayed jobs.

Possible daily summary:

```text
Today

12 jobs completed
2 jobs failed
7 customer orders completed

Estimated revenue: R$ 842
Estimated production cost: R$ 286
Estimated contribution: R$ 556

38h 42m machine time
73% estimated farm utilization

Idle printers:
- Ender 3 #4: 6h 10m
- A1 #2: 2h 40m
```

Do not label these values as accounting profit unless authoritative accounting data exists.

---

# 16. Safety and Human Confirmation

Physical execution must not be treated as fully autonomous by default.

The first implementation should favor explicit confirmation before actions that can affect hardware.

Example:

```text
Agent:
Printer A1 #3 is the recommended machine.

Please verify:
- correct filament
- correct color
- clean bed
- printer ready

Operator:
Ready.

Agent:
Start this job?

Operator:
Yes.
```

Later, adapters may support start/pause/cancel, but the system should preserve configurable confirmation boundaries.

---

# 17. OpenClaw Is Now the Highest-Priority Unknown

The slicing POC already proved that the core technical flow is feasible.

The largest remaining product-level unknown is now:

> Can this workflow be implemented cleanly as a real OpenClaw 2.0 agent with multiplayer interaction, tools, local persistence, and a deployable installation experience?

Therefore, OpenClaw runtime validation must happen before expanding the product significantly.

---

# 18. Implementation Roadmap

## Stage 1 — OpenClaw Runtime Proof

### Goal

Run a real OpenClaw 2.0 instance for this project and prove the minimum agent lifecycle.

### Required outcomes

- install/run OpenClaw 2.0 in the project environment;
- understand project/skill/plugin structure;
- create the smallest possible agent/skill;
- expose one safe local tool;
- call that tool from the agent;
- persist a small amount of local state;
- test multiple trusted users/sessions;
- understand how multiplayer behaves in practice;
- document installation/setup;
- identify how this project could be packaged for BYO/Plow/Agent Index.

### Minimal proof

A trusted user should be able to ask something similar to:

```text
Analyze this STL.
```

The OpenClaw agent should invoke the existing local STL-analysis tool and return structured results.

Do not expand into slicer adapters until this works.

### Agent notes

```text
Date:
Agent:
OpenClaw version:
Environment:

What was attempted:

What worked:

What failed:

Important commands:

Architecture observations:

Multiplayer observations:

File handling observations:

Persistence observations:

Packaging/deployment observations:

Security observations:

Open questions:

Next recommendation:
```

### Stage 1 execution notes — 2026-09-26

Date: 2026-09-26 (America/Sao_Paulo)  
Agent: Codex  
OpenClaw version: `2026.8.1` (`ea80657`, OpenClaw 2.0)  
Environment: Linux; Node.js `v24.16.0`; npm `11.13`; Python `3.14.2`; loopback Gateway. No Docker container or daemon was used.

What was attempted:

- Installed the exact OpenClaw 2.0 npm release into `.stage1/runtime`, ran its Gateway, created a workspace skill and TypeScript plugin, then sent agent requests through the Gateway.
- Tested with the existing generated `small-box-20mm.stl` fixture, first from the analysis session and then from a new session using the SQLite retrieval tool.
- Probed a nonexistent file and a `../` path. Checked current official docs for skills, plugins, sessions, user profiles, file attachments, installation, and Plow/Agent Index.

What worked:

- The Gateway reported ready on `127.0.0.1:18789` and loaded the `print-farm-stl` plugin and `analyze-stl` skill.
- Prompt `Analyze this STL and tell me its dimensions in millimeters. The file is small-box-20mm.stl in the approved jobs folder.` produced a real `analyze_stl` tool call and structured result: 20 × 20 × 12 mm, 12 triangles, 4.8 cm³, watertight heuristic true. The agent returned those dimensions.
- A separate OpenClaw 2.0 session invoked `get_latest_stl_analysis` and retrieved the persisted record. The two session contexts remained separate in a marker check.
- The invalid `../small-box-20mm.stl` tool input was rejected; the missing-file request returned an explicit error.

What failed:

- The initially selected `openai/gpt-5.6-sol` model was rejected by the signed-in ChatGPT/Codex account. Selecting the account-listed `openai/gpt-5.6-luna` allowed the runtime proof to complete.
- Two distinct authenticated human profiles were not provisioned. `openclaw users list` returned an empty profile list, and CLI runs share the `cli` observation identity.
- A normal Control UI or messaging-channel STL upload was not exercised. The fixture was staged in the approved jobs directory before the prompt.

Important commands:

- `npm install --prefix .stage1/runtime openclaw@2026.8.1`
- `openclaw plugins init print-farm-stl --name "Print Farm STL Analysis" --type tool --directory openclaw/plugins/print-farm-stl`
- From `openclaw/plugins/print-farm-stl`: `npm ci`, then `npm run plugin:build` and `npm run plugin:validate`.
- `OPENCLAW_CONFIG_PATH="$PWD/.stage1/state/openclaw.json" OPENCLAW_STATE_DIR="$PWD/.stage1/state" ./.stage1/runtime/node_modules/.bin/openclaw gateway run`
- `openclaw agent --session-key stage1-proof-20 --message "Analyze this STL and tell me its dimensions in millimeters. The file is small-box-20mm.stl in the approved jobs folder." --json`

Architecture observations:

- A workspace `SKILL.md` provides the workflow; the code-backed `analyze_stl` and `get_latest_stl_analysis` capabilities are project plugin tools.
- The agent had a minimal tool profile, only the two project tools were added, `exec`/`process` were denied, and Code Mode was disabled. The successful run says Code Mode was not engaged.
- OpenClaw conversation storage and application/job persistence are separate SQLite stores.

Multiplayer observations:

- The same configured `main` agent accepted different session keys with different session IDs. The explicit analysis database was shared across them; conversation text was not. A marker in one session was unknown in the second.
- Both test sessions were run through one CLI identity. No customer/operator/owner profile or application authorization was implemented. OpenClaw's session/owner UI is not an ACL.

File handling observations:

- The tool receives a basename from a configured jobs directory, not an arbitrary path or raw attachment. It enforces `.stl`, existence, regular-file status, a 25 MiB maximum, no final symlink, a 10-second process timeout, 1 MiB output maximum, and private temporary-file cleanup.
- The `../` probe was rejected. The OpenClaw 2.0 user upload-to-job path remains unverified; a future adapter must bind a managed attachment to a verified session and job before invoking the tool.

Persistence observations:

- SQLite table `stl_analyses` stores analysis ID, filename, dimensions, structured analysis JSON, UTC creation time, and `completed` status. The new session retrieved the saved 20 × 20 × 12 mm result.
- This is explicit application persistence, not OpenClaw session memory.

Packaging/deployment observations:

- The tested local npm prefix and plugin build are reproducible for this host. Another owner needs their own OpenClaw install, model/channel credentials, plugin/skill, Python runtime, persistent state, and a setup path for approved farm settings. Cura packaging is still separate.
- Plow base image / BYO Agent Index reporting and one-click registration were investigated but not installed or published.

Security observations:

- Gateway remained on loopback. Config and auth state are protected under `.stage1/state`; `.stage1/` is ignored. No credentials were written to project docs or source.
- The local plugin uses a fixed `execFile` invocation, not a model-provided shell command. It still runs as the Gateway OS user and is not an OS/container sandbox.
- Deep audit had zero critical issues and three warnings: reverse-proxy trust guidance (not applicable while loopback-only), unpinned Codex npm install metadata, and the audit CLI lacking `operator.read` for its deep probe.

Open questions:

- Which file-upload channel will the MVP use, and how will it identify the user, job, attachment path, and retention period?
- How will verified user identities and their possibly overlapping customer/operator/owner capabilities map to print-farm job permissions?
- How can setup let one user complete both Owner and Operator tasks, while allowing a team to invite people with separate or overlapping roles?
- Should Stage 2's Cura process run in a dedicated sandbox/container per job?
- Which Plow base image, volume contract, and Agent Index verification path will be current at submission time?

Next recommendation:

- Start Stage 2 by wrapping the existing Cura POC behind one bounded `slice_stl` capability that consumes a previously staged job file and returns typed estimate data. In parallel, specify and test the attachment-to-job adapter and verified user-profile setup before exposing customer intake.

**Stage 1 status:** PARTIALLY PASSED. The required real OpenClaw 2.0 conversation-to-tool-to-structured-result flow and separate-session SQLite retrieval both succeeded. Distinct human identity/role behavior and user-facing file upload remain untested.

---

## Stage 2 — OpenClaw + Existing Cura POC

### Goal

Connect the already-tested Cura/STL/quote pipeline to the OpenClaw agent.

### Required outcomes

Prove:

```text
OpenClaw conversation
→ STL input
→ STL analyzer
→ CuraEngine
→ normalized slice result
→ quote engine
→ structured response
```

Add local persistent records for:

- quote;
- customer request;
- selected profile;
- slicer result.

### Agent notes

```text
Date:
Agent:

Input flow tested:

Tool interfaces created:

Persistence model:

Cura integration result:

Failure handling:

Security observations:

Open questions:

Next recommendation:
```

### Stage 2 execution notes — 2026-09-27

Date: 2026-09-27 (America/Sao_Paulo)  
Agent: Codex  
OpenClaw version: `2026.8.1` (`ea80657`)  
Environment: Linux; Node.js `v24.16.0`; Python `3.14.2`; Gateway at `127.0.0.1:18789`; local Docker image `print-farm-cura-poc:latest` (CuraEngine `5.0.0`, image ID `sha256:a08c0afa9427c34f401454515b8dfbec42e3cc9cb816f6ccc0c69631bf6aea9f`). Gateway remained local and was stopped after the proof; no printer or messaging channel was configured.

What was attempted:

- Added a fixed-profile `slice_stl(filename, analysis_id, profile, quantity)` tool and `get_latest_production_estimate` to the existing project plugin. The slicing tool requires a saved `analyze_stl` result for that exact filename.
- Asked OpenClaw to analyze `.stage1/jobs/small-box-20mm.stl`, then run the approved Cura estimate. The successful final agent run was `8323c4db-e14f-4345-aafe-1bf0498a5895`, session `5dfdfd8f-aee2-4878-ac1d-e3c3f5bf4912`; tools selected: `analyze_stl`, `slice_stl`; failures: 0.
- In a separate session `ad955e59-ff29-401a-a8b9-7351794ab6e9`, run `6514da8d-054d-4f13-b3fd-a2d64a2d415f` invoked `get_latest_production_estimate` and returned the saved estimate.

What worked:

- The real STL measured 20 × 20 × 12 mm, 12 triangles, 4.8 cm³, with the mesh watertight heuristic passing.
- Cura returned 995 seconds, 3,044 mm³, and 1.26566 m. The tool derived 3.775 g from configured example PLA density 1.24 g/cm³.
- The existing quote engine consumed 3.775 g and 995 seconds for quantity one. Example business settings produced R$0.92 estimated cost, R$1.54 suggested order price, and R$0.62 estimated gross profit.
- SQLite persisted request summary, analysis ID, filename, profile, normalized slicer result, estimated total material/time, quote, business configuration, timestamp, and completed status. Estimate ID: `c2d9b453-a271-4c9a-a009-0686a3505735`; analysis ID: `0e671878-8e45-4d85-ab12-c49fedb675e3`.

What failed / remains unreliable:

- Cura exited 0 and produced metrics but emitted 109 warnings plus two `[ERROR]` diagnostics: missing `creality_base_extruder_0` and an unreadable JSON file. This is a legacy generic Ender-3 profile, not a validated printer profile; its output is not ready to be used for real customer quotes or G-code production.
- The first final-code verification exposed a local runner `NameError`; it was fixed before the successful Gateway run. A runner build should stay under regression checks as profile support evolves.
- The existing quote defaults are examples, not farm-configured pricing. Quantity >1 is a linear/sequential estimate and does not model plate packing.

Important commands:

- `npm run plugin:build`
- `npm run plugin:validate`
- `OPENCLAW_CONFIG_PATH="$PWD/.stage1/state/openclaw.json" OPENCLAW_STATE_DIR="$PWD/.stage1/state" ./.stage1/runtime/node_modules/.bin/openclaw gateway run`
- `OPENCLAW_CONFIG_PATH="$PWD/.stage1/state/openclaw.json" OPENCLAW_STATE_DIR="$PWD/.stage1/state" ./.stage1/runtime/node_modules/.bin/openclaw agent --session-key stage2-cura-final-2 --message "Analyze small-box-20mm.stl in the approved jobs folder, then produce a Cura estimate for one copy using cura-ender3-generic-pla-020. Use analyze_stl first and pass its returned analysis_id to slice_stl." --json`

Architecture observations:

- The Gateway exposes only project tools under the minimal tool profile; `exec` and `process` remain denied and Code Mode remains disabled. The model chooses a filename, analysis ID, fixed profile identifier, and bounded quantity; it cannot supply shell text or a host path.
- Cura runs using a fixed Docker image and fixed argument vector as the caller's numeric UID/GID, networking disabled, read-only root filesystem, 1 GiB memory, two CPUs, 64 pids, 64 MiB `/tmp`, and a 30-second process timeout. The plugin has a 40-second ceiling and 1 MiB structured-output cap. It emits only normalized fields, not G-code.
- The Docker daemon remains a trusted host boundary; this container setup limits the Cura process but does not sandbox the OpenClaw Gateway/plugin itself.

Persistence observations:

- `production_estimates` links to `stl_analyses` by `analysis_id` and keeps a deterministic request summary, selected profile, slicing JSON, estimated material/time, quote JSON, example business config, creation timestamp, and status.
- A fresh OpenClaw session used the explicit retrieval tool and read the persisted result without relying on transcript context.

Next recommendation:

- Stage 3 extended execution tested CuraEngine, OrcaSlicer, Bambu Studio, and Creality Print through the same normalized result and quote function. Stage 3 remains PASSED at prototype scope. Stage 4 may begin when scheduled: implement Persistent Domain Model and Farm Configuration with exact slicer versions, imported profile IDs/digests, material-density records, and profile validation state. Keep all non-Cura slicers out of OpenClaw until their profiles and metrics pass farm validation; investigate Bambu's anomalously high filament amount before enabling its quoting path. Do not add printer APIs in Stage 4.

---

## Stage 3 — Slicer Adapter Research and Proofs

### Goal

Prove that the application can produce a common quote input from two real slicers without adding slicer-specific business logic.

### Stage 3 outcome — PASSED (four-adapter prototype scope)

- Executed CuraEngine 5.13.0, OrcaSlicer 2.4.2, Bambu Studio 02.08.02.61, and Creality Print 7.2.1.5476 against the same privately staged `small-box-20mm.stl` (SHA-256 `4ca3d19d01e11ee608d81218670db3547d320cbc7bef4e36b64339cf4285ad70`).
- All four adapters returned a normalized result with slicer/version, approved profile identifiers, print time, filament volume, warnings, and errors. The generated G-code artifact metadata was included where the slicer produced G-code. The generic quote function accepts separate explicit density and calculates grams from volume.
- The same `quote_slicer_result` function consumed all four results without a slicer-ID branch. Their profiles differ and the numeric outputs are not comparative accuracy evidence. Bambu's volume/mass is internally consistent with the slicer header but anomalously high for the fixture and is not suitable for business quoting until investigated.
- Creality's stock Ender-3 V3 SE machine/process/filament profile files loaded directly. Bambu required a complete inheritance-resolved A1 preset bundle with CLI identity and compatibility fields; a stock preset fragment failed with `return_code=-5`.
- The Orca CLI needed a checked-in adapter profile with one fixed compatibility value (`use_relative_e_distances=0`); its unmodified bundled combination failed preflight validation. Orca's G-code reports density as 0, so the proof's generic quote call supplies an explicit PLA density (1.24 g/cm³) and derives grams from slicer filament volume. Farm-specific density must be configured in Stage 4.
- The adapter prototype is not yet exposed through OpenClaw. The current OpenClaw tool remains Cura-only and retains its filename/profile allowlists and fixed command construction.

The Stage 3 adapter proof used private staged input and constrained Docker execution for all four slicers. The AppImage-based Docker recipes pin base/image checksums; OS package versions remain unlocked. The OpenClaw plugin remains Cura-only and exposes no arbitrary slicer arguments or free-form settings.

See [the Stage 3 proof report](stage-3-multi-slicer-proof-report.md), [the slicer comparison](slicer-comparison.md), and the reproducible [proof runner](../experiments/slicing/run_stage3_proof.py).

### Bambu Studio homologation priority — 2026-09-28

One committed tester confirmed a Bambu Lab A1 with a 0.4 mm nozzle and uses Bambu Studio because it already connects directly to the printer. This is distribution evidence and makes Bambu Studio homologation a product priority. The repository's A1 0.4 mm machine target now matches confirmed tester hardware; its single-filament PLA material and 0.20 mm Standard process are investigation choices, not yet tester-confirmed.

The next technical priority is Bambu preset/CLI compatibility and GUI↔CLI parity. The official CLI contract expects complete configs, while compatibility depends on system-preset identity and ancestry. A new parent-to-child-resolved profile bundle preserves Bambu's bundled `from`, `setting_id`, `name`, and `inherits` metadata; Studio 02.08.02.61 accepts it (`compatible 1`) and sliced the hashed Stage 3 box at 481.49 s and 1,985.58 mm³ (825.51 mm filament; 2.50 g at 1.26 g/cm³; one object/filament, 60 layers). The historical inherited-profile slice remains about 43,487 mm³. The cause of that difference is not confirmed, and no GUI parity run has been completed. The new profile is not quote-safe; preserve the blocked trust state. Obtain an equivalent GUI project/output and compare preset identities, effective values, time, filament metrics, and object/layer counts before physical print validation. Keep printer APIs, job control, telemetry, and Stage 6 adapters out of scope, and keep Bambu outside the model-facing OpenClaw allowlist. See the [Bambu homologation plan](bambu-homologation-implementation-plan.md) and [comparison evidence](../experiments/slicing/evidence/bambu-a1-system-chain/slice-comparison.json).

### Research outcomes

The comparison covers Linux support, headless CLI, profile inputs, time/material metrics, artifact and diagnostics, container cost, licenses, and project limitations. Evidence is labeled `TESTED`, `INVESTIGATED`, or `HYPOTHESIS`; see the report for findings and official links.

### Required result

The Stage 3 prototype meets and exceeds the two-adapter proof requirement. Stage 4 may begin when scheduled. Before production use, add reviewed profile ingestion/validation and verify configured material density and full profile state for each deployed printer/material/process combination. Resolve Bambu's anomalous material result before enabling its quote path.

### Agent notes

```text
Slicer:
Version:
License:
Install method:

Slice tested:
Result:

Profile model:

Output metrics:

CLI limitations:

Packaging concerns:

Adapter feasibility:

Recommendation:
```

---

## Stage 4 — Persistent Domain Model and Farm Configuration

### Goal

Create the local operational data model.

Suggested storage:

```text
SQLite
```

Initial entities:

- users/roles;
- materials;
- printers;
- slicer profiles;
- printer profiles;
- business configuration;
- quotes;
- orders;
- print jobs;
- job events.

### Required workflows

Owner must be able to configure:

- materials;
- material costs;
- machine-hour costs;
- margin rules;
- printers;
- slicer/profile association.

For slicer profiles, persist the engine ID/version, imported printer/process/material preset identifiers and source digests, nozzle size, and profile validation status. Persist material density in explicit units with its farm/source record; do not infer density from a slicer name. Keep Orca unavailable in the OpenClaw tool until its imported profile and material record pass this validation flow.

### Agent notes

```text
Schema version:

Entities implemented:

Configuration flow:

Migration notes:

Questions/limitations:

Next recommendation:
```

### Stage 4 implementation notes — 2026-09-27

**Stage 4 status: PASSED.** The requested persistent configuration foundation, migration/preservation behavior, quote-readiness separation, and domain-table coverage are implemented and verified. This status does not approve any Stage 3 profile for production quoting.

Schema version: SQLite `PRAGMA user_version = 5`, managed by `experiments/farm_domain.py`. Existing `stl_analyses` and `production_estimates` rows are retained and legacy estimates are marked `legacy_unverified` for quote readiness. Successful slices without quote approval are stored as `slicer_runs`, separate from production estimates.

Entities implemented: versioned materials with sourced density and per-kg costs; basic printer metadata; versioned slicer installations; digest-pinned slicer profile versions and validation/execution history; versioned business configurations; composable user roles; printer-profile associations; durable quote, order, print-job, and job-event tables; and slicer-run snapshots. Printer records are metadata only; no printer API or control is present.

Configuration flow: the local `farm_domain.py` CLI initializes/migrates the database, registers Stage 3 evidence with its current trust findings, imports profile files and computes a SHA-256 manifest digest, configures materials/business costs/printers, and records profile execution and quote validation separately. New profile imports start `unverified` for execution and `needs_review` for quoting. Profile source/version identifiers and validation evidence are stored independently from slicer execution.

Quote behavior: the Cura-only OpenClaw tool still accepts the fixed Stage 2 profile ID. It reads the current profile, material density/cost, and active business-configuration version from SQLite, and compares the registered profile digest to the fixed profile actually executed. A successful slice can be returned without a quote while the profile is unregistered, digest-mismatched, or quote-unapproved; it is stored as a slicer run rather than a quote estimate. Estimate snapshots record quote readiness and the exact profile/material/business versions. The example Stage 3 PLA density is registered only as proof input, explicitly marked not farm supplied.

Migration notes: versions 1–5 are additive and repeatable; the existing local database was migrated from schema version 0 to 5 without changing its seven STL analyses or nine estimate records, then received Stage 3 registry records. Version 5 separates successful slicer runs from quote estimates. New migrations are applied when the persistence or domain entrypoint opens the database. Eight unit tests pass, covering legacy migration preservation/idempotence, Stage 3 registration idempotence, profile digests and trust gates, material/business versioning, quote snapshot versions, quote minimum fee/currency, and separate slicer-run persistence.

Known profile states from Stage 3: Cura executes but remains `needs_review` because simplified-map material parity is unresolved. Orca remains `needs_review` for its compatibility adjustment and lack of native density/mass. Bambu remains `blocked` for quoting because of its anomalously high material metric; Stage 4 blocks approval of that same proof profile until a corrected, versioned profile is supported by new evidence. Creality remains `needs_review` pending farm validation. Only Cura remains exposed in OpenClaw, and profile state does not widen that allowlist.

Questions/limitations: Stage 4 establishes storage and local configuration commands, not a conversational owner-onboarding UI or application authorization enforcement for the role tables. The current Stage 3 profile registration is proof metadata; a farm must import and validate its own files before trusting a quote. Existing estimate rows retain their original snapshots and are not retroactively reinterpreted.

Next recommendation: begin Stage 5 with verified application identity binding and role-capability resolution using `farm_users` / `user_roles`. First prove a solo `[OWNER, OPERATOR]` identity and a two-user team, without treating OpenClaw sessions as ACLs. Then implement the controlled upload-to-job handoff required before customer-facing STL intake and connect the existing quote flow only to an approved, digest-matched profile/configuration. Cura currently remains `needs_review`, so Stage 5 must not bypass that quote gate. Printer control remains deferred to Stage 6; farm scheduling remains Stage 7.

---

## Stage 5 — Identity, Roles, and Multi-user Workflow Proof

### Goal

Prove the product's main multiplayer story.

### Customer flow

```text
send STL
→ request quote
→ receive estimate
→ approve/reject
```

### Operator flow

```text
receive approved job
→ inspect requirements
→ verify printer/material/bed
→ confirm readiness
→ update production status
```

### Owner flow

```text
configure costs/materials/printers
→ inspect jobs
→ query operational and financial estimates
```

### Required proof

The same farm deployment should support these three trusted roles coherently. One user may hold multiple roles (including Owner + Operator); a team may distribute or overlap them. Demonstrate both a solo configuration and a team configuration when validating onboarding and permissions.

### Recommended starting point

Use the persisted `farm_users` / `user_roles` foundation to bind verified external sender identities to application users. Derive access from capability unions so `[OWNER, OPERATOR]` may belong to one user. Add the channel-neutral bridge and CUSTOMER-only first-request bootstrap before enabling public customer intake. Public WhatsApp sender identity must not inherit internal roles, legacy data, or shared-directory tools. Keep quote trust gating and all Stage 6 printer work deferred.

### Agent notes

```text
Roles tested:

Session model:

State sharing:

Identity assumptions:

Permission limitations:

Successful scenarios:

Failed scenarios:

Open questions:
```

### Stage 5 implementation notes — 2026-09-27

**Stage 5 status: PARTIALLY PASSED.** A real WhatsApp text+STL intake completed and produced one CUSTOMER, job/order, and analysis; the customer received two confirmations. Transcript evidence shows separate normal agent turns for text and media, each calling the generic `message` tool for the same completed intake. No duplicate inbound media, second correlator job, or repeated analysis was found. The per-`intake_id` claim, fixed one-shot confirmation, public WhatsApp generic-message block, and duplicate-event cancellation guard are implemented. The next live attempt did not complete: two distinct text events reached the hook (`attachment_count=0`), leaving two pending requests without an intake ID, file, job, or reply claim. The previous sent receipt is scoped to its own intake, and the cancellation guard did not arm. The confirmation tool was not called; no attachment reached the correlator, so no completed-intake confirmation could be sent. The confirmation sender now prepares the WhatsApp adapter before persisting the reply claim, preventing a local adapter setup failure from consuming the claim. Local duplicate/retry, same-STL new-request, and consecutive-intake tests pass. The latest Gateway inspection found the Gateway offline, so no post-fix live delivery is proven. The channel-neutral correlator remains unchanged with 30-minute expiry, both event orders, restart recovery, one-time attachment consumption, and explicit ambiguity handling. Public DM intake remains enabled, groups disabled, private Gateway auth intact, legacy shared-directory tools denied, and `exec`/`process` denied. See the [Stage 5 report](stage-5-report.md) and [implementation plan](stage-5-implementation-plan.md).

Identity mechanism tested: unit tests verify locally signed, short-lived HMAC-SHA256 assertions with issuer, stable subject, audience, issue/expiry times, and token ID. The production plugin uses OpenClaw's trusted inbound sender/account context and staged media event and signs the assertion inside the local bridge. A real WhatsApp sender and STL have traversed this flow and created a CUSTOMER/job. Session keys, labels, and conversation IDs are excluded from authorization.

Role combinations proven: one solo user with `[OWNER, OPERATOR]`; and a team with separate OWNER, OPERATOR, CUSTOMER, and an unauthorized second CUSTOMER. OWNER configures materials/business costs, manages roles, inspects jobs, and updates status. OPERATOR inspects and updates jobs but cannot manage roles/configuration or submit as a customer. CUSTOMER submits requests and reads their own job, but cannot update status or access another customer's job.

Upload proof: tests and the Python stdin bridge accept staged media bytes from normalized events, verify STL type/structure and the 25 MiB bound, check the private signing-key mode, persist the pending bytes with generated spool names, then create a job-linked `model.stl` under a generated job ID. Traversal, invalid type/structure, oversize, symlink substitution, digest changes, duplicate/reuse, unauthorized access, expiry cleanup, ambiguous matching, and process restart are tested. Analyzer/slicer tools receive only a generated job ID and safe filename. Pending requests and unattached files expire after 30 minutes; job files retain the 30-day default. One real WhatsApp STL completed the private handoff and analysis.

The order links a generic `ModelSource`, currently implemented only as `ATTACHMENT` with validated STL content. A future `ModelResolver` may handle supported MakerWorld, Thingiverse, Printables, or similar URLs before the validated private model reaches analysis and `SlicerAdapter`. URL downloading, scraping, and remote resolution are expressly out of scope for Stage 5.

The workflow creates an analysis, draft quote, pending order, and job for the verified customer. It does not issue a real quote; Stage 4 profile/material/business readiness and digest matching remain mandatory, and Cura remains `needs_review`. Stage 6 adds a separate local manual production workflow; it does not change intake or public WhatsApp behavior.

### Next recommendation

The latest live recovery verified exactly one provider-accepted confirmation for the existing completed intake. The stuck receipt was reconciled only after checking WhatsApp history; provider message ID and the visible outgoing message now agree. Do not ask for another intake solely to retest that reply path. Stage 5 remains partially passed until real Gateway authorization calls prove that a CUSTOMER can read only its own job and is denied staff actions while a restricted verified OWNER/OPERATOR is allowed to inspect/update jobs. Local Stage 6 manual-adapter domain work can proceed while that separate Gateway proof remains open; staff actions are not added to the public WhatsApp surface.

**Latest live smoke — 2026-09-28:** The original 18:49 BRT sender-9584 text+STL was absent from the Gateway intake because the project WhatsApp session had logged out and cleared credentials earlier; reconnect did not backfill it. A resend reached and matched in Stage 5, but automatic finalization raised an undiagnosed generic `Error`. Persisted-match recovery created one job and one fixed confirmation was sent/recorded. Do not replay this completed intake. Keep Stage 5 partially passed until the bridge error is diagnosed and a fresh live intake completes automatically. Details: [Stage 5 report](stage-5-report.md).

---

## Stage 6 — Printer Adapter Layer

### Goal

Make an approved print job operational without requiring printer connectivity.

**Manual-adapter scope: PASSED (2026-09-28).** The persistent workflow lists approved ready jobs, assigns a configured manual printer, records operator-confirmed start, and records completion or failure. OWNER and OPERATOR capabilities are required for staff actions; customers can read only their own persisted job status. Each assignment and production transition appends a `job_events` record. `queued` is the persisted database state for the API status `READY_FOR_PRODUCTION`.

Schema v10 adds `printers.adapter_id`, defaulting existing printer records to `manual`. A generic `PrinterAdapter` contract and `ManualPrinterAdapter` are implemented. An eligible job must already have an approved quote and an approved/queued order; the workflow does not alter quote-readiness or issue quotes.

Real printer integrations remain future work. OctoPrint, Moonraker, Bambu, and Creality connectivity, telemetry, automatic discovery, scheduling, and remote start/pause/cancel are deferred.

### Agent notes

See [Stage 6 report](stage-6-report.md) for the implemented workflow, tests, and deferred integrations.

---

## Stage 7 — Farm Scheduler

### Goal

Recommend a printer based on normalized data.

First version can use a simple explainable heuristic.

Inputs:

- dimensions;
- printer build volume;
- required material;
- printer status;
- queued jobs;
- estimated finish time.

Output:

```text
recommended_printer
reason
alternative_printers
estimated_start
estimated_finish
```

### Agent notes

```text
Heuristic tested:

Inputs:

Results:

Failure cases:

Possible future improvements:
```

---

## Stage 8 — Operator Execution Workflow

### Goal

Turn approved orders into operational instructions.

Example:

```text
Order #137 is ready for production.

Printer: A1 #2
Material: PLA Black
Estimated duration: 3h47

Before starting:
[ ] correct filament
[ ] correct color
[ ] clean bed
[ ] printer available
```

The agent should wait for operator confirmation before hardware-affecting operations.

### Agent notes

```text
Flow tested:

Confirmation model:

Failure handling:

Human checkpoints:

Open questions:
```

---

## Stage 9 — Metrics and Owner Reporting

### Goal

Generate useful operational summaries from persisted events.

Initial metrics:

- completed jobs;
- failed jobs;
- queue size;
- estimated revenue;
- estimated cost;
- estimated contribution;
- material consumption;
- machine hours;
- utilization;
- idle printers.

### Agent notes

```text
Metrics implemented:

Source data:

Estimated vs authoritative data:

Daily summary output:

Known inaccuracies:
```

---

## Stage 10 — Packaging, Installation, and Hackathon Submission

### Goal

Make the agent reproducible and installable.

Investigate and implement:

- OpenClaw packaging;
- dependencies;
- slicer dependency setup;
- Docker requirements;
- local storage;
- setup/onboarding;
- Agent Index client;
- MIT project licensing;
- third-party license obligations;
- BYO/Plow path;
- usage reporting;
- demo environment.

Target onboarding concept:

```text
Deploy agent
→ setup
→ configure business
→ register printers
→ import/select slicer profiles
→ run test STL
→ ready
```

### Agent notes

```text
Install path:

Dependencies:

Setup steps:

Packaging result:

Agent Index result:

Known blockers:

Release recommendation:
```

---

# 19. Documentation Rules

All project documentation must be written in English.

Prefer documents under:

```text
docs/
```

Recommended living documents:

```text
docs/product-direction.md
docs/architecture.md
docs/research-log.md
docs/limitations.md
docs/slicer-comparison.md
docs/printer-integrations.md
docs/openclaw-notes.md
docs/decisions.md
docs/release-readiness.md
```

Agents should update existing documents instead of creating redundant reports when possible.

---

# 20. Evidence Labels

Every technical statement should use one of these mental categories:

## TESTED

Executed successfully in the current environment.

## INVESTIGATED

Supported by documentation/source review but not validated end-to-end.

## HYPOTHESIS

Not yet proven.

Do not describe an investigated or hypothetical capability as implemented.

---

# 21. Research Log

Agents should append significant work here or in `docs/research-log.md`.

```text
============================================================
DATE/TIME:
AGENT:
STAGE:

HYPOTHESIS:

TEST:

COMMANDS / IMPLEMENTATION:

RESULT:

STATUS:
TESTED / INVESTIGATED / HYPOTHESIS

LIMITATIONS:

DECISION IMPACT:

NEXT STEP:
============================================================
```

---

# 22. Decision Log

Use this section or `docs/decisions.md` for architectural decisions.

```text
Decision:

Date:

Context:

Options considered:

Decision:

Reason:

Trade-offs:

Can this decision be revisited?
```

---

# 23. Known Open Questions

- What is the cleanest OpenClaw project/skill/plugin structure for this agent?
- How should STL uploads be exposed safely to local tools?
- How does OpenClaw multiplayer behave with users holding one or more of the three target roles in practice?
- What persistence lifecycle works best between sessions?
- How should the agent be packaged for simple installation?
- Which slicers can be installed reproducibly on Linux?
- Can Bambu Studio and Creality Print provide enough CLI functionality for reliable adapter support?
- What common output can all slicers normalize into?
- Which printer integrations are practical without cloud dependence?
- What capabilities should remain manual by design?
- How should imported slicer profiles be validated and versioned?
- What third-party licensing obligations affect public MIT distribution?

Agents should add new open questions as they are discovered.

---

# 24. Immediate Priority

The immediate release priority is to keep the manual production workflow demoable and finish the separately tracked Stage 5 Gateway authorization proof. Real printer connectivity remains deferred. Keep each slicer behind its existing profile/digest and quote-readiness gates.

---

# 25. Product Principle

The product should evolve toward:

> **An AI operational employee that coordinates customer intake, quoting, production, operators, printers, and business visibility for a small 3D print farm.**

Not:

> a chatbot for 3D printing.

Not:

> a universal printer controller.

Not:

> an STL calculator.

The architecture should remain adaptable through:

```text
Slicer adapters
+
Printer adapters
+
Manual fallback
+
Local configuration
+
Persistent operational state
```

This is the current direction until new technical evidence justifies changing it.
