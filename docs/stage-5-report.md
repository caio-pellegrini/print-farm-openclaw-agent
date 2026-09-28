# Stage 5 Report — Identity, Roles, and Safe Customer Intake

**Assessment: PARTIALLY PASSED** (updated 2026-09-28)

**Bridge error-envelope fix (2026-09-28):** Investigation found a protocol-handling bug relevant to the no-reply failure path: the Python bridge returns caught application errors as `{"error": ...}` while exiting successfully, but the TypeScript client treated every zero-exit JSON object as a successful result. The client now rejects that error envelope, allowing the existing failure/recovery path to run. Deterministic tests cover successful, error, malformed, and non-object responses. This does not change intake correlation, reply claiming, channel behavior, or customer messaging. The original live attempt could not be safely replayed: the configured database no longer contains its pending/matched record, so the fix is not yet confirmed by a fresh live intake.

**Latest live reply recovery (2026-09-28):** The pending customer intake already had exactly one job and analysis. WhatsApp history showed no confirmation after that request, while the database held a `claimed` reply receipt without `sent_at`. Startup had attempted the drain before WhatsApp was listening, and the old sender did not retain the adapter's provider receipt. I reconciled only that intake after checking the conversation, changed the sender to require a provider message ID before marking `sent`, and gated the startup drain on the local OpenClaw channel-status probe. After restart-loop protection suppressed WhatsApp autostart, I started the channel through the authenticated Gateway call. Gateway health is **OK**, WhatsApp is **healthy/connected**, the receipt is now **sent** with a provider message ID, and WhatsApp Web shows exactly one new farm confirmation for the existing job. No additional job or analysis was created; totals are two jobs and nine analyses. This proves live reply delivery and per-intake deduplication on the recovered intake; it does not count as a second customer submission.

The application authorization layer and persistent intake correlator are implemented and locally tested. A real WhatsApp text+STL intake completed and created one CUSTOMER, one job/order, and one new analysis. The customer nevertheless received two confirmations. Gateway transcript evidence shows two normal agent turns—one for each distinct inbound text/media event—each tried to send a confirmation. Persistent reply claiming and a fixed single-send confirmation are implemented and locally tested.

The latest live attempt did **not** complete an intake: the Gateway recorded two distinct accepted WhatsApp text events at 2026-09-28 03:37:39Z and 03:37:55Z, each with `attachment_count=0` and `status=pending`. The database contains two pending text requests with no `intake_id` or attachment link; no new CUSTOMER, job/order, analysis, or reply claim was created. The sole persisted reply receipt is the earlier completed intake and has `status=sent`; claims are keyed by `intake_id`, so it cannot suppress a new intake. No `farm_send_intake_confirmation` call or outbound adapter result appears for this attempt. The latest transcript contains generic `message` tool calls only. The public WhatsApp policy blocks that generic send path; the short-lived duplicate cancellation guard did not arm because neither inbound event was a duplicate. No evidence ties this attempt to Gateway cancellation, an AbortError, or a reply-claim collision. The absence of a media event at the intake hook is the concrete reason no completed-intake confirmation could be sent.

The claim/send boundary now resolves the WhatsApp adapter before writing a persistent reply claim. If local adapter setup fails, the intake remains claimable; if the actual outbound call has an uncertain result, the one-shot claim remains closed to prevent a duplicate. The correlator and its matching rules were not changed.

## What identity mechanism was actually tested

The application tests issue and verify short-lived HMAC-SHA256 assertions containing issuer, stable subject, audience, issue time, expiry, and token ID. The identity resolves through the persisted `(issuer, subject)` mapping in `farm_user_identities` to a `farm_users` row; roles come from `user_roles`. Altered signatures, expired/wrong-audience/wrong-issuer assertions, unknown identities, and unauthorized identity links are rejected.

The plugin consumes each trusted `message_received` event, normalizes channel/account/sender/conversation/message context and optional text/media, and persists it through the stdin bridge. It excludes conversation/session IDs from authorization, binds only the trusted sender to the account namespace, and signs the local identity assertion inside the bridge when a unique request/file pair is complete. The sender on the real WhatsApp DM was verified and mapped to the one CUSTOMER row created for this valid request. The live text and STL reached the bridge and produced one completed intake/job. The narrow sender-scoped status and own-job tools remain; the plugin does not request OpenClaw's broader conversation-access hook grant.

Earlier, while WhatsApp still used pairing admission, a real contact sent an inbound message and the channel returned an OpenClaw pairing challenge. This was the expected inbound pairing response; no bot-initiated contact message or secret/code is recorded here. Pairing was suitable for that development check but not public customer onboarding.

The application schema is v9. Before this live intake there were seven historical STL analyses and nine historical estimates. The current database has one farm user, one job/order/quote record, and eight total analyses: the successful request added exactly one of each required customer/job/analysis record. No real customer quote was issued; the quote is still a draft behind Stage 4 trust gating.

## Role combinations and actions proven

| User | Persisted roles | Allowed actions proven | Denied actions proven |
|---|---|---|---|
| Solo farm user | OWNER + OPERATOR | Inspect any farm job, update production status, configure materials/business costs, manage roles | The assignment works as one person; no distinct Owner/Operator assumption |
| Team owner | OWNER | Inspect jobs, update status, configure materials/business costs, manage users/roles, link a verified channel identity | Cannot submit a customer request without CUSTOMER |
| Team operator | OPERATOR | Inspect any farm job and update production status | Cannot manage roles, configure costs/materials, or submit a customer request |
| Customer | CUSTOMER | Submit an STL/request and read own job | Cannot inspect another customer's job, change production status, manage roles, or configure costs/materials |
| Public WhatsApp sender | CUSTOMER-only request scope | On a valid request plus STL, create/resolve CUSTOMER and create/read its own job | Cannot inherit linked OWNER/OPERATOR authority through the public route |

Capabilities union across roles. Tests also prove a second CUSTOMER cannot read or consume another customer's job/upload. Owner approval is required to link another verified channel identity to an existing `farm_user`; there is no automatic link by phone or display name.

## Upload-to-job evidence

The Python stdin bridge test used a private mode-0600 key and a binary STL, then created a generated job ID and safe `model.stl` file in a private per-job directory. It verified the resulting `farm_users` role and could read the owned job. The analyzer ran on the private copy. No quote was issued; the job has a draft quote only.

The OpenClaw plugin accepts a staged attachment from the runtime `message_received` hook, reads only a file inside the explicitly configured private OpenClaw media root, rejects path escape/symlink abuse, and enforces a 25 MiB STL bound. The hook exposes agent-facing `content`, not a separate raw-body field; the adapter treats content as request text only on text-only events because media-only content can be a generated envelope. The normalized event is stored in a private persistent spool with a generated opaque reference, digest, and 30-minute expiry; the reference and host path are never model arguments. When a unique recent request and attachment pair exists, the application creates/links a CUSTOMER and job through the usual identity and ownership checks. `intake_id` prevents duplicate job creation after a retry. The model sees only a generated job ID and safe filename after success.

Tests cover text→attachment, attachment→text, delayed matching, expiry, unrelated senders/conversations, duplicate event delivery, one-time attachment consumption, ambiguous choices, process restart between events, pending-spool symlink substitution, invalid STL/extension, oversize content, upload digest/ownership, job-file cleanup, and the actual OpenClaw media-fact contract where a path under the private state media root is outside the agent workspace. Pending and upload spool directories are mode 0700; job directories are mode 0700 and files mode 0600. Abandoned events expire after 30 minutes; consumed job files default to 30 days. Cleanup runs at startup, every five minutes, and before new intake events.

## Customer safety boundary

Public intake submission is a deterministic plugin hook, not a model-selected tool. The only customer-facing plugin tools are sender-scoped pending-intake status, own-job read, and explicit resolution of an ambiguous pair. Active policy denies legacy shared-directory/latest-record tools. The public bridge applies a CUSTOMER capability ceiling even when the sender's linked farm user has internal roles. Unknown identities are created only after a valid request and valid STL are matched; casual/unmatched messages do not create `farm_users`. Unlinked identities have no quote/order history lookup.

WhatsApp currently uses `dmPolicy=open` with `allowFrom=["*"]`, solely for this customer-safe intake test. `groupPolicy` remains disabled; calls and channel config writes remain off. Gateway auth remains shared-token and loopback-only, tool profile remains `minimal`, Code Mode remains disabled, and `exec`/`process` remain denied. Intake correlation does not use native debounce. No printer adapter, control surface, or physical production action was added.

## Verification evidence

- `python3 -W ignore::ResourceWarning -m unittest tests.test_intake_correlation -v`: **16 tests passed**, including duplicate delivery suppression, same-STL later requests, and two consecutive completed intakes with independent claims.
- `npm test` in `openclaw/plugins/print-farm-stl`: **7 tests passed**, including a pre-send adapter setup failure that leaves the intake unclaimed and allows a later send attempt.
- This latest live attempt is not a successful live reply proof because the Gateway received no attachment event; Stage 5 remains **PARTIALLY PASSED** until a complete live intake receives exactly one confirmation.
- `npm test` in `openclaw/plugins/print-farm-stl`: **7 tests passed**, including the WhatsApp media event replay, private media-root acceptance, traversal/symlink rejection, one-send suppression, exact duplicate-event outbound cancellation, pre-claim adapter setup handling, and uncertain-send no-retry behavior.
- `npm run plugin:validate` in `openclaw/plugins/print-farm-stl`: **Plugin print-farm-stl is valid**.
- `openclaw config validate`: **Config valid**.
- `openclaw plugins doctor`: plugin discovery, compatibility, and config checks passed.
- The earlier post-fix Gateway health check was **OK** with WhatsApp healthy. During this latest investigation no Gateway process was reachable; local CLI health also required configured Gateway credentials, so no current live send was attempted.
- The earlier post-fix channel probe reported WhatsApp enabled, linked, connected, `dm:open`, `allow:*`, with groups disabled. The current Gateway state was not available to re-probe.
- Live database `PRAGMA user_version`: **9**; current totals are **1 CUSTOMER**, **1 job/order**, **8 analyses** (seven pre-existing plus one from this intake), with no duplicate `intake_id`.
- The plugin compiles and validates with `farm_send_intake_confirmation`, which requires a persistent application claim before sending one fixed success response; request submission remains in the trusted event hook rather than as a model-selected tool. Adapter availability is checked before the claim is written; transport errors after a send call remain at-most-once when the provider outcome is uncertain.

These include the successful real sender-to-farm-user binding and attachment handoff through WhatsApp. They do not yet prove the new reply-deduplication path on the deployed Gateway.

## Successful live intake and duplicate reply investigation — 2026-09-28

The completed WhatsApp intake added exactly one CUSTOMER, one job/order, and one STL analysis. The database has one completed intake and one consumed attachment; the existing unique `orders.intake_id` and `inbound_event_receipts(channel, account_id, message_id)` constraints show no duplicate job or repeated normalized event. The seven earlier analyses remain unchanged; the new total is eight. No quote was issued.

The inbound receipts in the success window correspond to the expected two different events: one text message and one STL media message. They had separate provider message identities and each opened a normal OpenClaw agent turn. The redacted transcript records one `message` tool send action in each turn; the text turn resolved/read the completed job and sent a confirmation, then the media turn read the same job and sent another confirmation. The `message_received` hook does not send customer messages. No repeated attachment receipt, retry/ack path, second analyzer run, or second correlator-created job explains the duplicate. The concrete source was two model-driven replies to the distinct text and media turns after the persistent hook had already completed the intake.

The fix adds an atomic persistent `intake_id` success-reply claim, validates the claim against the verified sender, owned job, and attachment digest, sends one fixed confirmation through the current WhatsApp DM adapter, and returns `NO_REPLY` to prevent the model from composing an additional confirmation. Duplicate claims and uncertain transport outcomes are silent and are not retried. The generic OpenClaw `message` tool is blocked for public WhatsApp requesters. Exact duplicate event receipts are rejected before correlation, and the outbound hook cancels a resulting duplicate-event reply for that conversation for 30 seconds; session context is used only for this short-lived cancellation scope, never authorization. Completed-intake replies are separately guarded by the persistent claim. The already-completed live intake is recorded as already replied, preventing a later turn from sending a third confirmation for it. No debounce or correlation behavior changed.

An uncertain provider send is deliberately at-most-once: if WhatsApp accepts a send but the local adapter reports an error, the app does not retry and risk another customer reply. Provider-level exactly-once delivery cannot be promised without a transport idempotency key. The deterministic tests prove one application send attempt and suppress retries; the updated Gateway reply path still needs deployment validation before another live customer test.

## Prior live failure investigation — 2026-09-27 valid-STL attempt

The most recent inbound event carrying a valid STL in the Gateway log was **2026-09-27 23:49:47 BRT**; later inbound media entries at 23:50:56 and 23:52:42 were voice media (`audio/ogg`), not STL. The valid pair below is identified only by redacted pseudonyms:

| Field | Request text event | STL event |
|---|---|---|
| Event type | WhatsApp direct text | WhatsApp direct media |
| Channel / account | `whatsapp` / `default` | `whatsapp` / `default` (single linked account; same direct inbound route) |
| Sender | `sender-H1` | `sender-H1` in raw inbound routing logs |
| Conversation | `conversation-H1`, same direct sender context | Gateway did not persist a Stage 5 normalized conversation value before failure; raw sender and target route match the text event |
| Message identity | `message-H1` (redacted from persisted receipt) | Not captured by Stage 5; the hook failed before the bridge receipt. OpenClaw's diagnostic log did not include provider message ID |
| Timestamp | `23:49:47.209` | `23:49:47.663` |
| Raw text / media | Raw body present; no attachment | Raw body empty; one media item, recognized as `application/vnd.ms-pki.stl` |
| Hook / persistence | `message_received` ran; bridge wrote one pending request (`status=pending`, quantity 2) | Same `message_received` path ran; plugin logged failure before the bridge call, with `attachment_count=0`; no attachment receipt/row was written |
| Correlation | — | No correlator lookup occurred. The request remained pending; the attachment was rejected by the plugin's media reader before correlation, not by sender/account/conversation matching |

The trusted WhatsApp inbound path placed the 524,684-byte regular STL under OpenClaw's private state `media` directory. Source inspection confirms the WhatsApp adapter passes `path`, `url`, `contentType`, and `kind` to OpenClaw media normalization without a `workspaceDir`; the `message_received` event preserves that optional field only if one was supplied. The plugin's reader incorrectly required `workspaceDir` and a path inside the agent workspace. The hook ran immediately after inbound dispatch; a later agent transcript contained the separate workspace-staged copy, but the hook had already failed. Its catch logged only generic `Error`, so the exact provider message ID was not retained. There was no `AbortError` during this valid-STL pair. This is a media-path contract mismatch, not an identifier divergence or a correlator lookup failure.

The same OpenClaw media event had no raw customer text, while its agent-facing content held a 72-character generated media envelope. The old hook used `event.content` unconditionally; if it had reached the bridge, that could have been misclassified as a new request. The fix now treats media-bearing events as file-only for correlation text and reads media below the configured private OpenClaw media root. A Node replay exercises the live event shape, and an end-to-end Python replay proves one job is created from text then media exactly once. The customer-facing intake instructions now explicitly prohibit asking for a resend merely because the status still says `awaiting_attachment` after a media event.

## Remaining limitations and live proof

- An earlier attempt produced `AbortError` / `skipped:reply_operation_aborted` in the Gateway inbound active-turn steering lifecycle. The 2026-09-27 valid-STL pair did not: the independent intake hook itself failed its media-path guard before bridge/correlation. These are distinct failures. The fixed hook no longer requires a later agent-workspace media copy; the reply-deduplication path is deployed, but its outbound confirmation is not yet verified on a new live intake.
- There is no WhatsApp debounce configured for intake. Matching is persistent and based on the full normalized channel/account/sender/conversation tuple with a 30-minute expiry. A unique pair is processed automatically; multiple candidates require an explicit sender choice.
- The real valid text+STL traversed the persistent Stage 5 bridge and created the first live CUSTOMER/job. The new single-reply tool is not yet verified on the deployed Gateway.
- `ModelSource` is generic in the request schema; Stage 5 only creates `ATTACHMENT` sources for validated local STL files. URL sources, downloads, scraping, and MakerWorld/Thingiverse/Printables resolution are documented future work only.
- No separate real internal OWNER/OPERATOR channel has been provisioned. Local workflow tests prove those roles; Gateway-level staff access still requires a verified, Owner-linked internal identity. Telegram remains a possible restricted channel, not mandatory.
- The local HMAC key is deployment-local and protected with mode 0600. Key rotation/managed secret storage and a production identity issuer lifecycle remain operational work.
- No historical quote/order lookup is available to unlinked customers. No quote was issued because Stage 4's digest-matched profile/material/business quote gate must pass; Cura remains `needs_review`.
- OpenClaw plugin tool metadata still contains legacy Stage 1/2 tools, but active policy denies them. Replacing/removing that legacy surface is future cleanup; it is unavailable to this customer route.

## Exact recommendation for Stage 6

Stage 5 remains **PARTIALLY PASSED** until live Gateway calls prove CUSTOMER own-job reads and denial of staff actions, plus allowed access for a separately verified OWNER/OPERATOR. The manual Stage 6 domain workflow has proceeded independently; it is not exposed through the public WhatsApp surface. Keep groups and legacy tools unavailable. Future printer connectivity and remote start/pause/cancel remain deferred.

## Latest live smoke and recovery — 2026-09-28, sender ending 9584

**Original missing reply:** WhatsApp Web showed the sender's 18:49 text and STL in the conversation with the project number, but the project Gateway did not record a corresponding inbound event or Stage 5 receipt. Its log records `WhatsApp session logged out` and credentials cleared at 18:38:29 BRT, a connection timeout before login at 18:41:11, and a 503 disconnect at 18:41:36. The exact 18:49 text/media pair is absent from the bridge database. The original message therefore never reached the Stage 5 intake hook; reconnecting did not backfill it. This is the confirmed cause of the initial silence. Later inbound traffic from a different sender was mistakenly treated as evidence about this sender; that attribution was incorrect.

**Resent intake:** At 19:14:39 BRT the Stage 5 hook received the sender's request text; at 19:14:40 it received the separate `application/vnd.ms-pki.stl` attachment. The bridge persisted and matched the request and file under the same verified WhatsApp sender/account/conversation. The hook then logged `failure_category=Error attachment_count=1`; at that point no job existed. The persisted matched intake was recovered with the existing `_finish_matched_intake` path. It created exactly one job (`93d5d692-0d60-4b28-be73-1f0d0ca228cf`, quantity 2), completed the intake, and kept the quote in `draft` under the existing Stage 4 trust gate. A one-time reply claim was recorded; the fixed success confirmation was sent through the project Gateway and its provider message ID was persisted as `sent`.

**Unresolved defect / release status:** The generic `Error` from the first automatic finalization was not diagnosed. The plugin logs only the exception class and the bridge subprocess discards stderr, so the original exception is unavailable. Manual replay succeeded, but that does not prove the automatic path will not fail again. Do not label the automatic live path fully passed or promise this cannot recur. Keep Stage 5 **PARTIALLY PASSED** until safe diagnostic logging identifies the failing operation and a fresh live text+STL intake completes automatically. Do not resend or recreate this already completed intake; it has a completed receipt, one job, and a sent confirmation. The incident did not change the correlator, reply policy, channel configuration, or Stage 4 quote gates.
