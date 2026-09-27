# OpenClaw Runtime Notes

**Date:** 2026-09-26 (America/Sao_Paulo)  
**Agent:** Codex  
**OpenClaw version tested:** `2026.8.1` (`ea80657`), documented by OpenClaw as OpenClaw 2.0  
**Environment:** Linux, Node.js `v24.16.0`, npm `11.13`, Python `3.14.2`; Gateway loopback only. Docker was available but not used for this stage.

## Evidence labels

- **TESTED** means executed in this project against the pinned OpenClaw 2.0 runtime.
- **INVESTIGATED** means checked against current OpenClaw or Agent Index / Plow documentation, but not exercised end to end here.
- **HYPOTHESIS** means a deployment proposal that still needs a real farm setup to confirm.

## Runtime installation and architecture

### TESTED

- Installed the published npm package into an isolated project prefix with `npm install --prefix .stage1/runtime openclaw@2026.8.1`; `openclaw --version` returned `2026.8.1 (ea80657)`.
- The Gateway ran in the foreground on `127.0.0.1:18789`. It reported `ready`, loaded the project plugin, and served actual agent turns through the Gateway.
- The isolated config and OAuth profile are under `.stage1/state`. That directory is mode `0700`; the config file is mode `0600`. `.stage1/` is ignored by Git. No Docker daemon or service install was used.
- OpenClaw 2.0 initially tried the account-default `openai/gpt-5.6-sol`, which this ChatGPT/Codex account rejected. The account-listed `openai/gpt-5.6-luna` worked. Choosing an account-authorized model is part of setup; model IDs in a static catalog do not prove account access.
- The selected agent workspace was `openclaw/workspace`. Its `skills/analyze-stl/SKILL.md` loaded and appeared in agent prompt metadata.

### INVESTIGATED

- OpenClaw is a local Gateway/control plane. CLI, Control UI, TUI, and supported chat channels are clients; agent routing, sessions, tool execution, and channel delivery pass through the Gateway. The official install guide currently requires Node `24.16+` or `26.1+` and recommends the installer for a normal host setup. The 2.0 release is `2026.8.1`. See [Install](https://docs.openclaw.ai/install) and [v2026.8.1 release notes](https://docs.openclaw.ai/releases/2026.8.1).
- A workspace skill is a folder containing `SKILL.md` with YAML frontmatter including `name` and `description`. It provides instructions and tool-use guidance; it is not executable code. See [Skills](https://docs.openclaw.ai/tools/skills).
- A code-backed local capability belongs in a plugin/tool. The tested plugin uses `defineToolPlugin`, TypeBox input/output schemas, and the plugin manifest. A plugin can be loaded from a local project path or installed as a package. OpenClaw documents npm, local directory, archive, Git, and marketplace plugin sources; the local path is convenient for development, while a pinned npm package or image is more suitable for deployment. See [Plugin overview](https://docs.openclaw.ai/tools) and [Install plugins](https://docs.openclaw.ai/cli/plugins/install).
- Plugins execute trusted project code inside the Gateway process. Model access should be limited by OpenClaw's tool profile and allow/deny policy, then by tool schemas and deterministic input validation. The model should not receive a generic shell or repository tool for this workflow. See [Tool policy](https://docs.openclaw.ai/gateway/config-tools/tool-policy).
- `openclaw.plugins.init` generated a plugin scaffold; the project builds its TypeScript plugin against the pinned `openclaw@2026.8.1` SDK. Current OpenClaw documentation warns that plugin APIs can evolve, so pin the host and plugin versions together and rebuild/validate on upgrades.

## Gateway tools and sessions

### TESTED

- The active config used `tools.profile: minimal`, `tools.alsoAllow` for only `analyze_stl` and `get_latest_stl_analysis`, `tools.deny` for `exec` and `process`, and `tools.codeMode.enabled: false`. The Gateway used the Codex app-server plugin with `appServer.mode: guardian`; the successful proof metadata reported `codeModeEngaged: false` and `successfulToolNames: ["analyze_stl"]`.
- `session.dmScope` was set to `per-channel-peer`. Agent CLI runs used distinct session keys and OpenClaw session IDs. A marker placed in one test conversation was unknown in another conversation, confirming that their conversational contexts were separate.
- `openclaw users list --json` returned an empty profile list. Both CLI-created sessions reported the same observation identity (`cli`); these were two sessions, not two independently authenticated people.
- The analyzed STL bytes were read by the local plugin. Only the prompt and structured result text were sent to the model provider; the plugin did not attach or transmit the STL bytes.

### INVESTIGATED

- OpenClaw keeps conversation/session state in its own SQLite stores. That is separate from application data and does not replace a print-farm job database. Current docs describe per-agent session stores and session scopes. See [Agent runtime](https://docs.openclaw.ai/concepts/agent) and [Session management](https://docs.openclaw.ai/session).
- Multi-user mode adds session creator, owner, participant history, and presence. These are collaboration and display features inside a trusted Gateway; they are not ACLs. OpenClaw's personal-assistant trust model assumes one trusted operator boundary unless profiles, roles, policy, and application authorization are deliberately configured. An agent user can invoke every capability granted to that agent. See [Multi-user mode](https://docs.openclaw.ai/concepts/multi-user) and [Security CLI](https://docs.openclaw.ai/cli/security).
- `session.dmScope: per-channel-peer` separates direct-message context by channel and peer. It does not by itself establish that channel senders are authenticated Gateway profiles, authorize access to application records, or isolate files.
- Durable Gateway profiles and per-person model accounts require a Gateway identity/login path. Channel sender IDs and CLI session names are not substitutes for verified profiles. The application still needs customer/operator/owner authorization over farm jobs and records.

## File input and safe handoff

### TESTED

- `analyze_stl` accepts one filename, not a path. It rejects `../small-box-20mm.stl` with `Pass a filename only; directory paths are not accepted.` A nonexistent `missing-sample.stl` returns a useful not-found error.
- The tool requires `.stl`, an existing regular file under the configured jobs directory, rejects final-component symlinks, caps input at 25 MiB, copies it into a private temporary directory, calls the fixed Python analyzer via `execFile` (no shell), caps execution at 10 seconds and structured output at 1 MiB, then removes the temporary copy.
- The proof fixture was copied into `.stage1/jobs` before the conversation. A normal user upload through the Control UI or a messaging channel was not performed: no messaging channel was configured, and the Control UI tab was at its Gateway authentication screen rather than an authenticated user chat.

### INVESTIGATED

- Current Control UI docs describe uploads as attachments represented in chat history by managed-media links (with images handled separately). That is not the same interface as the project's `filename` argument and does not automatically place an STL in the farm jobs directory. The exact stored file path, scope, and retrieval flow were not verified for OpenClaw 2.0 here. See [Control UI chat](https://docs.openclaw.ai/web/control-ui/chat).
- The Gateway's `terminal.upload` is an operator-terminal RPC: it accepts one base64 file up to 16 MiB, stages it in a private temporary directory for 24 hours, and returns an absolute path. It does not send terminal input or execute a command, but it is not a user-facing chat attachment API and was not used in this proof. See [Gateway protocol system and channel methods](https://docs.openclaw.ai/gateway/protocol/rpc-system-and-channels).
- A future intake adapter should accept a Gateway attachment reference or an authenticated upload ID, verify the session/profile and size, copy the file into a per-job directory without following links, verify extension and file type, enforce retention/cleanup, and pass only an application-generated job ID or basename to the analyzer. Do not let the model supply an arbitrary host path.

## Persistence

### TESTED

- Added `experiments/stl-analysis/persistence.py` and a separate SQLite database at `.stage1/state/print-farm.sqlite`.
- After an OpenClaw session called `analyze_stl`, a second OpenClaw 2.0 session called `get_latest_stl_analysis` and returned the saved `small-box-20mm.stl` record, including its analysis ID, dimensions, creation time, and completed status. This was across different session IDs on the same running Gateway.
- OpenClaw conversation history and app persistence are therefore distinct: the Gateway owns chat/session history; the project database owns explicit analysis records.

### INVESTIGATED

- Keep application data in a versioned project database with explicit retention and ownership fields. Do not use OpenClaw's transcript as the source of truth for job status or customer data.

## Packaging, deployment, Agent Index, BYO, and Plow

### TESTED

- The runtime and plugin can be started from project-local folders; the current successful plugin was loaded from `openclaw/plugins/print-farm-stl` with explicit paths to the jobs directory, analyzer, persistence script, and SQLite file.
- `npm run plugin:build` and `npm run plugin:validate` completed during scaffold work. No image was published, no Plow deployment was created, and no Agent Index registration/report was made.

### INVESTIGATED

- For a normal host setup, pin the OpenClaw version, complete `openclaw onboard`, and run the Gateway on the farm host. For a farm image, bundle the project plugin, skill, Python, the project dependencies, and (later) a supported CuraEngine installation; mount config/state and job data as persistent, private volumes. OpenClaw's agent and session state should also persist across container recreation.
- The Agent Index publish page recommends building on the Plow OpenClaw base image for a one-click Plow deployment, then using `plow-agents login` and `plow-agents deploy --local --line <line-id>` during local validation. A public image, profile UID/slug, and one-time admin enablement are required for one-click listing. See [Publish your agent](https://aiworthusing.com/agent-index/publish).
- The BYO flow runs the Agent Index client beside an existing agent, registers metadata, and schedules usage reports every five minutes. The current client reads OpenClaw token usage from `$OPENCLAW_STATE_DIR/agents/<agentId>/agent/openclaw-agent.sqlite`; it uses `PLOW_AGENT_TOKEN` and persistent install identity data. A deployment must preserve the OpenClaw state directory and must not bake the token into a container image. See the [Agent Index client](https://github.com/plow-pbc/agent-index-client).
- These are publishing/usage paths, not requirements for the local analysis tool. Neither was installed or exercised; publication is deferred.

### HYPOTHESIS

- The closest future setup flow for an independent print-farm owner is `Deploy -> run setup -> configure farm -> ready`: pull a versioned image, mount private durable state/job directories, provide that farm's model/channel credentials, choose an approved printer/profile and costs, verify dependencies, then run a local readiness check. Whether Plow's base image is the best fit depends on the required channel/connectors and its then-current deployment contract.

## Security findings and remaining questions

### TESTED

- The deep security audit reported zero critical findings and three warnings: loopback Gateway proxy-trust guidance, an unpinned Codex plugin install record, and the local deep-probe CLI connection lacking `operator.read`. The first warning is relevant if the UI is later placed behind a reverse proxy; the audit probe failure is an operator scope issue, not a model/tool-call failure.
- No application API key was stored. The authorized ChatGPT/Codex sign-in state and local Gateway config are protected under `.stage1/state`; no password or token was added to source or documentation.
- The restricted tool still runs inside the Gateway process and invokes a host Python interpreter. Path, file-size, timeout, and output bounds were tested/implemented, but this is not an OS-level sandbox.

### HYPOTHESIS / OPEN QUESTIONS

- Which authenticated channel or UI should receive customer files, and how does its attachment handle map to a stable application job ID in OpenClaw 2.0?
- How should a business provision verified users with composable customer, operator, and owner capabilities, and which application records may each role read or change? One solo user may hold both owner and operator capabilities.
- Should Stage 2 run CuraEngine inside an isolated container per slice, or use another bounded host process model? The existing Cura POC uses Docker, but no slicer was invoked by this agent.
- What exact Plow line, base image, volume layout, usage-report cadence, and Agent Index verification requirements will apply at submission time?

## Official sources consulted

- [OpenClaw 2.0 / v2026.8.1](https://docs.openclaw.ai/releases/2026.8.1)
- [OpenClaw installation](https://docs.openclaw.ai/install)
- [Skills](https://docs.openclaw.ai/tools/skills)
- [Plugin install](https://docs.openclaw.ai/cli/plugins/install)
- [Tool policy](https://docs.openclaw.ai/gateway/config-tools/tool-policy)
- [Multi-user mode](https://docs.openclaw.ai/concepts/multi-user)
- [Session management](https://docs.openclaw.ai/session)
- [Control UI chat](https://docs.openclaw.ai/web/control-ui/chat)
- [Gateway protocol file staging](https://docs.openclaw.ai/gateway/protocol/rpc-system-and-channels)
- [Agent Index publish guide](https://aiworthusing.com/agent-index/publish)
- [Agent Index client source](https://github.com/plow-pbc/agent-index-client)
