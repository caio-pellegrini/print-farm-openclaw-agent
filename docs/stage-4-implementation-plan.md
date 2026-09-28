# Stage 4 Implementation Plan

**Status:** Completed; Stage 4 assessed **PASSED** on 2026-09-27

## Repository state observed

- Application data already lives in `.stage1/state/print-farm.sqlite`, separate from OpenClaw history.
- `experiments/stl-analysis/persistence.py` currently creates `stl_analyses` and `production_estimates` ad hoc and adds one column with an inline `ALTER TABLE`; there is no schema version or migration runner.
- `production_estimates` snapshots the slicer output and an example business config as JSON. The quote runner's `PROFILE_MAP` embeds Cura's 1.24 g/cm³ density and the quote defaults are hard-coded in Python.
- `experiments/slicing/slicer_adapters.py` already provides the desired adapter boundary and fixed adapter IDs/profile allowlist. It supports four prototype engines, while OpenClaw's `slice_stl` schema exposes only Cura.
- `experiments/slicing/profiles/` contains source JSON for Orca, Bambu, and Creality. The fixed Cura POC settings are assembled in code from official resources; the Cura GUI/full-settings material-volume parity issue is unresolved.
- The Stage 3 reports document Orca's absolute-extrusion compatibility adjustment, zero native Orca mass metadata, Cura material-volume parity uncertainty, and Bambu's anomalous material magnitude. These are validation inputs, not reasons to widen OpenClaw exposure.
- The worktree already contains user edits to Stage 3 docs/evidence and slicer adapters. Those files are inputs to this work and must be preserved.

## Implementation sequence

1. **Add a versioned SQLite schema and migration runner.** Adopt the existing application database without dropping or rewriting Stage 1/2 rows. Replace ad hoc schema setup with ordered, repeatable migrations and record the schema version. Keep operational estimates as immutable snapshots.
2. **Add a farm-domain configuration boundary.** Implement validated persistence operations for materials (density with units and source, cost and selling price), versioned slicer installations, printers/basic metadata, versioned slicer profiles with source identifiers/digests, separate execution and quote-trust states, validation findings/history, and versioned business configuration. Provide a small local CLI for owner/operator setup and inspection; do not add printer connectivity.
3. **Register the existing evidence as explicitly untrusted configuration.** Represent the known Cura profile and available prototype profile sources with their exact slicer versions and SHA-256 source digests. Preserve known validation findings. `can_execute` and `quote_safe` are distinct; Cura's tested execution does not clear its material-parity finding, Orca needs farm profile/material validation, and Bambu remains quote-blocked for its anomalous metric. No non-Cura engine is added to the OpenClaw tool.
4. **Connect quote inputs to persisted configuration without silently enabling unvalidated profiles.** Keep the historical fixed Cura tool contract for compatibility, but make the estimate snapshot record the registered profile/material/business versions and validation state. Missing farm setup or a quote-unsafe material/profile must not be represented as a trusted farm quote; retain the existing demo estimate only as an explicitly labeled legacy/example path until the configured path is selected.
5. **Document decisions and verify each migration/domain workflow.** Add focused tests for migration of an existing database, idempotence, digest/version persistence, validation gating, and quote-configuration snapshots. Update Stage 4 notes, decisions, and limitations with concrete behavior and remaining evidence gaps.

## Boundaries

- Preserve the slicer adapter contract and its current fixed OpenClaw allowlist.
- No printer control or hardware API work.
- Do not infer farm density from slicer metadata/name; store unit and source explicitly.
- A profile can be executable while still needing review or being blocked for business quoting.
- Do not claim Cura material parity or clear Bambu's anomalous material metric without new evidence.
- Keep prior architecture/product decisions intact unless this implementation produces new evidence that warrants a recorded decision.
