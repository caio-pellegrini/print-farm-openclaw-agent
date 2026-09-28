# Architecture Decisions

## 2026-09-28 — Run approved production jobs through an audited manual printer adapter

**Decision:** Add a channel-neutral production workflow backed by the existing SQLite `print_jobs`, `printers`, `orders`, and `job_events` records. Persisted `queued` represents API status `READY_FOR_PRODUCTION`; OWNER/OPERATOR can assign a configured printer, record its physical start, and mark the job `COMPLETED` or `FAILED`. Existing printers migrate as `manual` adapters. Customer status reads continue to use the persisted job record and ownership check.

**Reason:** Farms need an operational workflow after a job has passed approval even when the printer has no supported network API. Human confirmation keeps physical work explicit while application state and history survive sessions and restarts.

**Boundary:** A job is eligible only when its quote is approved and its order is approved or queued. This does not issue or approve quotes and does not relax profile, digest, material, or business trust gates. No staff production tool is added to the public WhatsApp route. Remote start/pause/cancel, telemetry, discovery, scheduling, and vendor integrations remain deferred.

**Stage assessment:** Stage 6 is **PASSED for the manual-adapter scope** based on deterministic local authorization, lifecycle, event, migration, and subprocess persistence tests. Stage 5 Gateway role proof remains separately open.

## 2026-09-28 — Prioritize tester-confirmed Bambu A1 workflow homologation; defer printer integration

**Decision:** Prioritize Bambu Studio slicing/profile/estimate homologation as a distribution-driven product need. One committed tester confirmed a Bambu Lab A1 with a 0.4 mm nozzle and uses Bambu Studio because it already connects directly to their printer. The repository's A1 0.4 mm machine target therefore matches real tester hardware. Keep the checked-in single-filament PLA and 0.20 mm Standard choices as investigation settings until the tester confirms their material and process. Do not broaden model coverage before GUI↔CLI parity.

**Reason:** Slicing compatibility with the tester's existing workflow reduces onboarding friction. Its direct printer connection also signals an eventual printer-side integration expectation.

**Boundary:** First resolve Bambu profile/CLI compatibility and establish GUI↔CLI parity; physical print validation starts only after parity passes. This stage covers slicing, profile resolution, estimates, and quote-readiness only. Printer APIs, job control, telemetry, and Stage 6 adapters remain out of scope. Bambu remains out of the model-facing OpenClaw allowlist until the exact profile passes quote-safe validation and digest enforcement is separately verified.

## 2026-09-27 — Keep product workflows channel-agnostic; prefer WhatsApp for Brazilian customer pilot

**Decision:** For the current Brazilian pilot, prefer WhatsApp for customer intake and consider Telegram as a convenient initial OWNER/OPERATOR channel, without making either a hard product requirement. Keep WhatsApp groups, Telegram, Discord, iMessage, web/chat, and other supported channels possible future entry points. Plow, Latch, and iMessage may help the hackathon but are not product architecture dependencies.

**Architecture rule:** Each channel bridge normalizes inbound context as `channel`, `external_sender_id`, `external_account_id`, `conversation_context`, and `attachment_reference`, then verifies the external identity and resolves it to `farm_users`. Persisted roles/capabilities authorize the application action and the domain binds it to a request/job. Channel IDs, conversation IDs, session labels, and transport behavior do not enter core authorization, order, or job logic. In a group, sender identity and group/conversation identity are distinct; a group ID must never stand in for the sender in authorization.

**Reason:** The same customer and staff workflows should survive changes in messaging product and channel. A farm remains one trusted OpenClaw deployment, with application roles enforcing access inside that boundary.

## 2026-09-27 — Public WhatsApp customer intake only after CUSTOMER-only bridge proof

**Decision:** Pairing is suitable for WhatsApp development and testing, but not the final Brazilian customer experience. Keep WhatsApp paused and in pairing mode while the application bridge and customer authorization surface are incomplete. After tests prove the public route is CUSTOMER-only, allow public WhatsApp DMs without per-customer manual pairing. Keep internal OWNER/OPERATOR entry points restricted by pairing/allowlist and explicit app role bindings; keep WhatsApp groups disabled until an internal group allowlist is configured.

**First contact:** Create or resolve a CUSTOMER `farm_user` only when a new verified public sender submits a valid request with an STL. Do not create users for casual messages. The public DM authorization scope is limited to request submission and own-job reads, even if a channel identity is linked to a staff user. Unlinked senders receive no legacy quote/order/customer lookup; no matching by display name or phone number is automatic. Linking another verified channel identity to a user requires explicit OWNER approval.

**Evidence/update:** A real contact initiated a WhatsApp DM and received OpenClaw's pairing challenge under the current development configuration. This is transport-level pairing evidence, not an application identity or role decision. The DM policy remains `pairing`; do not switch it to `open` until the customer-safe path and negative authorization tests pass. No per-sender request-count throttle is added in this MVP; existing file-size, type, private-storage, and retention controls remain.

**Status:** Current product/integration direction, not a permanent vendor commitment. Revisit with onboarding and pilot evidence.

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

## 2026-09-27 — Version farm configuration and separate execution from quote trust

**Decision:** Use additive, ordered SQLite migrations in `experiments/farm_domain.py` as the schema authority. Persist materials and their density source/units, printers, slicer installation versions, digest-pinned profile versions and validation evidence, and versioned business configuration. Keep execution availability separate from profile quote approval. Production-estimate snapshots record the profile, material, and business-configuration versions used, plus quote-readiness state.

**Reason:** Stage 3 proves that adapters can execute, but it does not prove farm profile parity or safe material costs. Orca's proof density is external, Cura's simplified profile has unresolved material parity, and Bambu's material amount is anomalous.

**Boundary:** Stage 3 records are proof evidence, not farm configuration. Cura remains the only OpenClaw slicer. Unapproved profiles may return a successful slice result, but do not return a business quote. Bambu's current anomalous proof profile cannot be marked quote-approved; a corrected profile version and new evidence are required. Printer rows are metadata only; no control API is implemented.

**Migration:** Schema versions 1–5 preserve Stage 1/2 records. Existing estimates are labeled `legacy_unverified` for quote readiness and retain their original snapshot fields. Successful slices without an approved quote configuration are persisted as `slicer_runs`, not as production estimates.

**Stage assessment:** Stage 4 is **PASSED** at the persistent-domain/configuration scope. Eight tests cover additive migration/idempotence, profile registration and digest behavior, validation gates, configuration versions, quote snapshots, and unquoted slicer-run persistence. Cura/Orca/Creality profile review and Bambu's quote block remain active trust findings, not stage failures.

## 2026-09-27 — Bind application roles to verified external identity assertions

**Decision:** Resolve application users only from a short-lived signed assertion from the trusted deployment identity bridge. Bind the assertion's stable issuer/subject pair to `farm_users`; derive capabilities as the union of persisted `user_roles`. OpenClaw session keys, labels, and conversation IDs are not authorization inputs. OWNER, OPERATOR, and CUSTOMER remain composable role assignments.

**Reason:** A Gateway session is conversation context and does not prove which business user is acting. Application actions need a verified principal before applying customer ownership or staff capabilities.

**Proof boundary:** The Stage 5 tests exercise an HMAC-SHA256 signed assertion contract with issuer, subject, audience, issue time, expiry, and unique token ID fields. The OpenClaw 2026.8.1 WhatsApp plugin now reads the runtime's trusted sender/account and managed media context, but no real external sender/media event has yet traversed it. Assertions are issued only inside that bridge. Trusted upload references are persisted with their owning `farm_users.user_id`, so one customer cannot submit another user's upload.

## 2026-09-27 — Accept customer STL content through opaque trusted upload references

**Decision:** Resolve an opaque `ocw_...` attachment reference only through the trusted deployment bridge. Validate STL signature and the 25 MiB limit, store content in a mode-0700 private spool, then copy it to a generated per-job `model.stl` in a mode-0700 job directory with mode-0600 file permissions. Persist owner, digest, job ID, and retention deadline; expire unconsumed refs after 30 minutes by default and provide explicit upload/job cleanup operations.

**Reason:** Customer-controlled host paths and OpenClaw managed-media locations must not flow into analyzer or slicer commands. The application creates the job ID and safe filename after resolving the trusted reference.

**Boundary:** Unit tests and a subprocess test exercise the local bridge using staged STL bytes; the actual WhatsApp attachment path still awaits one external message. New customer requests create a draft quote only. The existing Stage 4 digest/profile/material/business trust gate remains required before any quote can be issued.

## 2026-09-27 — Enable public WhatsApp DM only for CUSTOMER intake

**Decision:** After the CUSTOMER-only workflow and denial tests passed, configure WhatsApp DM for public intake (`dmPolicy=open`, `allowFrom=["*"]`) and opt the trusted plugin into inbound message/media hooks. Keep WhatsApp groups disabled, calls/config writes disabled, and internal OWNER/OPERATOR entry points restricted.

**Reason:** New customers need to submit a valid request/STL without pairing. Pairing approval is still appropriate for development and restricted staff channels, but is not suitable as the customer onboarding experience.

**Boundary:** An unknown sender becomes a CUSTOMER only when a valid request and STL are submitted. The public plugin surface is limited to sender-scoped pending-intake status, own-job reads, and explicit ambiguity resolution; identity-bound request creation is handled deterministically by the normalized event bridge. Linked internal roles are attenuated to CUSTOMER on the public route. Legacy shared-directory/latest-record tools, `exec`, and `process` remain unavailable. Two external attempts delivered text and STL as separate events but did not create a job/user; see the later persistent-correlation decision and Stage 5 report. The model must never promise a price while the Stage 4 gate is closed.

## 2026-09-27 — Persist normalized intake events; do not use debounce to pair requests and files

**Decision:** Treat inbound text and file uploads as independent channel events. The bridge normalizes channel, account, sender, conversation, message ID, optional text, attachment facts, and timestamp. The application correlates recent events by the exact channel/account/sender/conversation tuple and persists them for 30 minutes. It supports either arrival order, consumes an attachment once, deduplicates event redelivery, and only auto-matches a unique pair. Multiple candidates require explicit customer selection. No short debounce is used as the correlation mechanism.

**Reason:** WhatsApp/OpenClaw can dispatch text and attachments asynchronously and may cancel an active agent turn while steering a later inbound event. In-memory attachment state and a model-selected tool call cannot reliably preserve the intake across that lifecycle.

**Boundary:** Pending STL bytes stay in a private spool and pass type/signature, size, symlink, and digest checks. First-contact CUSTOMER creation and job creation happen only after an unambiguous matched request plus valid STL. Replays use a persisted `intake_id`. Abandoned requests/files expire and are cleaned; cleanup runs at Gateway startup, every five minutes, and before new intake events. Conversation/session identifiers are correlation context, never authorization. The order links a generic `ModelSource`; Stage 5 implements `ATTACHMENT` only. URL resolution for MakerWorld/Thingiverse/Printables and other remote sources is future work, not implemented.

**Runtime note:** The persisted state directory must be configured for the Gateway process so it reads the already-paired WhatsApp credentials. The running test Gateway is healthy and connected. The plugin uses a narrow sender-scoped `farm_get_pending_intake_status` tool instead of enabling OpenClaw's broader conversation-access hook grant. Public tool allowlisting remains explicit; shell/process and legacy shared-directory tools stay denied. A real WhatsApp intake has now created one customer/job/analysis; verify the idempotent reply path through Gateway before calling Stage 5 complete.

## 2026-09-28 — Read WhatsApp media from its trusted OpenClaw staging root

**Finding:** In the latest valid-STL attempt, the text and media events had the same redacted sender identity and direct WhatsApp route. The text entered Stage 5 and remained pending. OpenClaw recognized the separate media item as `application/vnd.ms-pki.stl` and fired the same `message_received` hook, but the plugin failed before calling the bridge. The inbound file was staged below OpenClaw's private state `media` root; the plugin incorrectly required the path to be inside the agent workspace, whose copy appears later in the agent turn. The correlator did not run for the media event, and `AbortError` was not present in this attempt.

**Decision:** Read local inbound media only from the explicitly configured private OpenClaw media root, enforcing path containment, no-follow, regular-file checks, and the existing 25 MiB cap. OpenClaw's `message_received` event exposes agent-facing `content`, not a separate raw-body field; use its content only for text-only events and ignore it when media is present because it may include a generated envelope. On media-read failure, return a safe failure category and never ask the customer to resend solely because the event did not correlate. Keep media records pending after a successful read until matching or expiry.

**Evidence:** The deterministic replay uses the observed separate-event shape, `application/vnd.ms-pki.stl`, raw empty body plus non-empty agent-facing media envelope, and the private staging-root path. It asserts same sender/account/conversation pairing, one-time job creation, and rejection of outside-root/symlink paths. No delay/debounce change or identity heuristic is introduced.

## 2026-09-28 — Claim customer intake success replies once per intake

**Finding:** One real WhatsApp text event and one separate STL event each started a normal OpenClaw agent turn. The persistent hook completed the intake exactly once, creating one CUSTOMER, job/order, and new analysis, but both model-driven turns invoked the generic `message` tool to confirm that same job. The hook itself did not send either reply; the inbound receipt table showed no redelivered event.

**Decision:** Require an atomic persistent application claim keyed by `intake_id` and validated against the verified sender, owned `job_id`, and attachment digest before sending a completed-intake confirmation. The plugin sends one fixed confirmation through the current WhatsApp DM adapter and returns `NO_REPLY`; a duplicate claim or uncertain send is silent and is not retried. Block the generic OpenClaw `message` tool for public WhatsApp requesters. Exact repeated message IDs remain rejected by the durable inbound-event receipt, and the outbound hook cancels resulting duplicate-event messages for the same conversation briefly; conversation/session context is used only to scope this cancellation, never authorization. Keep the existing channel-neutral correlation model unchanged.

**Boundary:** Database uniqueness ensures one claim/send attempt per completed intake, while the inbound event receipt key suppresses transport redelivery and a short outbound hook suppresses a duplicate normal turn. WhatsApp does not provide an idempotency guarantee through the adapter for ambiguous provider outcomes, so delivery is at-most-once when a send call fails uncertainly. Local tests and deployment/config validation pass; a new live intake must verify actual Gateway delivery before Stage 5 is complete.

**2026-09-28 follow-up:** The newest live Gateway window contains two distinct text-only intake events (`status=pending`, `attachment_count=0`); both requests remain pending and have no `intake_id`, attachment link, job, analysis, or reply claim. The earlier `sent` receipt belongs to its own completed intake and is not a global/digest dedupe key. The confirmation tool was not invoked, and the short duplicate-event cancellation guard did not arm. Generic WhatsApp `message` calls appear in the turn transcript, but the deployed policy blocks that route; the latest events never reached the completed-intake confirmation stage. Resolve the adapter before persisting a reply claim so local setup failure cannot strand an unsent intake. Retain the claim after an ambiguous actual send because provider delivery may already have occurred. Do not change correlation behavior based on this attempt.

**2026-09-28 reply-recovery follow-up:** A later completed intake had one job/analysis and a `claimed` reply receipt without `sent_at`. WhatsApp Web showed that the customer had not received a confirmation. The startup drain had run before the WhatsApp listener was ready; a restart-loop breaker subsequently suppressed channel autostart. The one receipt was reconciled only after checking that conversation, then the reply was sent after an authenticated Gateway channel start. WhatsApp returned a provider message ID, the database recorded `sent`, and the visible conversation showed one confirmation. The sender now requires provider evidence, classifies explicit `not_sent` separately, preserves ambiguous deliveries as non-retryable, and gates startup delivery on the local OpenClaw `channels status --probe` result. This did not alter intake correlation or quote gating. Stage 5 remains partially passed until separate live customer/staff Gateway authorization checks are proven.

## 2026-09-27 — Keep model source extensible without implementing remote resolution

**Decision:** Model a request source through a generic `ModelSource` record with type, reference, optional original filename/source URL/digest, and resolution status. Current accepted source type is only `ATTACHMENT`; it must resolve to a private validated STL before analysis.

**Future requirement:** Allow users to request a quote from supported design URLs through `ModelResolver`, then pass the validated private model file to analysis and a `SlicerAdapter`. Do not add URL downloads, scraping, MakerWorld, Thingiverse, Printables, or remote model resolution as part of Stage 5.

# 2026-09-28 - LLM interpretation is not business state.
The model may interpret intent and produce conversational responses, but durable business state transitions must be executed through deterministic application commands with authorization, validation, idempotency, persistence, and audit events. Customer-facing responses about business state must be based on persisted application results, not conversation memory.

## 2026-09-28 — Record the Stage 5 live reconnection gap and avoid replaying completed intake

**Finding:** The original 18:49 BRT WhatsApp text+STL was visible in WhatsApp Web but had no matching project Gateway inbound event or Stage 5 receipt. Gateway logs show logout and credential clearing at 18:38:29, then a pre-login timeout and 503. A later resend from the same verified sender was received and matched, but automatic bridge finalization raised a generic `Error`. The exact exception was not retained because the plugin records only its class and the bridge subprocess ignores stderr.

**Decision:** Treat the original message as not ingested and the resend as the single completed intake. Use only the persisted matched-intake recovery path for recovery; do not manually recreate the job, correlate by display name, or re-send a customer confirmation after its persisted reply receipt is `sent`. Stage 5 remains partially passed until the finalization exception is diagnosed and a fresh intake succeeds through the automatic path. See the latest live-smoke section in `docs/stage-5-report.md`.
