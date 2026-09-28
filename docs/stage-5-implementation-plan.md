# Stage 5 Implementation Plan — Identity, Roles, and Safe Customer Intake

**Status:** Persistent event correlation is being implemented after two failed live WhatsApp attempts. Do not treat the channel as customer-ready until the normalized event bridge, restart-safe correlation, and live proof pass. See [Stage 5 report](stage-5-report.md).

## Decisions applied before runtime changes

- WhatsApp DM is the preferred Brazilian customer entry point. Pairing is for development, not the eventual customer onboarding experience.
- Public intake remains customer-only, even if a verified sender identity is linked to a staff `farm_user`. A new sender becomes/resolves to CUSTOMER only when submitting a valid request with an STL; casual messages do not create a user.
- Unlinked identities do not receive historical quote/order data. A separate identity can link to an existing farm user only through explicit Owner approval.
- Internal OWNER/OPERATOR entry points stay restricted. Telegram is a possible first internal channel, not a required product dependency. WhatsApp groups stay disabled until an individually verified sender policy exists.
- Domain authorization consumes verified application identities and persisted roles/capabilities. Channel/account/sender and managed attachment facts stay in the bridge; session keys, conversation IDs, and labels never authorize.
- Intake state is persisted for a 30-minute correlation window. Text and attachment messages are independent events; no short debounce is used to associate them.
- The request stores a generic `ModelSource`. Stage 5 implements only validated local `ATTACHMENT` STL sources; URL resolution remains future work.

## Implementation sequence

1. **Persist identity links.** Add additive schema v8 table `farm_user_identities` so one farm user may have multiple verified external channel identities. Keep `farm_users` / `user_roles` as the user and role foundation. Only an Owner capability may link an identity to an existing user.
2. **Authorize by capability.** Verify a short-lived HMAC assertion produced inside the trusted bridge, resolve its stable `(issuer, subject)` mapping, load persisted role grants, and authorize each operation by the union of role capabilities. Public WhatsApp requests apply a CUSTOMER ceiling even when the verified identity maps to staff.
3. **Bootstrap only on valid intake.** Validate the trusted attachment bytes and request before creating a first-contact CUSTOMER. Reject groups at the bridge API, never infer a user from a name/phone, and exclude historical quote/order lookup for identities that are not already linked.
4. **Normalize independent inbound events.** The channel adapter supplies only `channel`, account, sender, conversation, message, timestamp, optional raw customer body, and trusted staged attachment bytes. OpenClaw agent-facing media-envelope text is not customer text. Local media must be beneath the configured private OpenClaw media root; it does not have to wait for a copy in the agent workspace. Channel-specific identifiers stay in the bridge; core correlates on the full channel/account/sender/conversation tuple but authorizes using only the verified sender identity. Session keys are excluded.
5. **Persist, correlate, and consume exactly once.** Store text requests and validated STL attachments in private, expiring persistent records so either may arrive first and survive process restarts. Auto-match only a unique request/attachment pair within 30 minutes. Keep a durable ambiguity state when there are multiple candidates and require an explicit selection before consumption. Event receipts deduplicate Gateway redelivery, and a unique `intake_id` makes job creation safely replayable after a crash.
6. **Use a generic model-source abstraction.** Link the created request to `ModelSource(type=ATTACHMENT, ...)`; only STL attachments resolve in Stage 5. Keep analysis and slicing downstream of a validated private file. Do not add remote URL fetching, scraping, or model resolution in this stage.
7. **Run the correlation path independently of agent-turn completion.** The Gateway hook persists and correlates inbound events before the model reply. A cancelled/aborted conversational turn must not discard the intake event or attachment. The agent reads sender-scoped status through a narrow application tool; the plugin does not enable OpenClaw's broader conversation-access hook capability.
8. **Call the local bridge through bounded stdin.** The plugin passes normalized sender identity, message context, and bounded attachment bytes over stdin to a narrow Python bridge process. The bridge reads a mode-0600 deployment key and calls the same application workflow tested locally. It returns only a generated job ID, safe filename, and bounded status. No shell tool or arbitrary path is exposed.
9. **Keep runtime boundaries intact.** WhatsApp DMs use `dmPolicy=open`, `allowFrom=["*"]`; groups remain disabled, calls/config writes remain off, token Gateway auth stays loopback-only, `minimal` tool profile stays active, Code Mode stays disabled, `exec`/`process` remain denied, and legacy shared-directory tools are denied. Debounce may coalesce rapid text fragments only; it is not part of intake correlation.
10. **Prove all paths.** Exercise text→attachment, attachment→text, delay, expiry, unrelated senders, duplicate/reuse prevention, ambiguous selection, and process restart. Retain the solo/team role and file-safety proofs. Then run a new real external WhatsApp request/STL and separately determine whether Gateway `AbortError` remains after ingestion is independent of the agent run.

## Capability contract

| Capability | CUSTOMER | OPERATOR | OWNER |
|---|---:|---:|---:|
| Submit own request and STL | Yes | No | No |
| Read own request/job | Yes | Yes | Yes |
| Inspect any farm request/job | No | Yes | Yes |
| Change production status / append event | No | Yes | Yes |
| Configure farm materials/business costs | No | No | Yes |
| Manage users and roles | No | No | Yes |

Capabilities union across roles. Customer ownership checks apply to each read. OWNER and OPERATOR are composable assignments, not assumed to be different people.

## Boundaries

- No printer adapters, printer control, or scheduling work.
- Do not bypass Stage 4 quote trust. Intake creates a draft only; no quote is sent while profile/material/business configuration is not quote-safe and digest-matched.
- Do not broaden shell/file permissions. The two customer tools are the only plugin tools added to the active minimal profile; the four legacy shared-directory/latest-record tools are explicitly denied.
- One trusted OpenClaw deployment remains the trust boundary for one farm.

## Current proof state

Local tests prove HMAC assertion verification, persisted role composition, public CUSTOMER-only scope, upload-to-job creation, and positive/negative authorization. Live inspection found that a valid STL was rejected before the bridge because its immediate OpenClaw media path was outside the later agent-workspace copy; the correlated text remained pending. The fix reads only the private OpenClaw media root and uses raw event body text. Node and Python deterministic replays cover the observed event shape. Do not request another external message until the fixed plugin is rebuilt, deployed, and replay checks pass; live post-fix media proof remains open.
