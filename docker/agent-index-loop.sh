#!/bin/sh
set -u

APP_ROOT="${APP_ROOT:-/opt/print-farm-operator}"
AGENT_INDEX_SLUG="${AGENT_INDEX_SLUG:-print-farm-operator}"
CLIENT="$APP_ROOT/standalone/agent_index_client.py"
STATE_ROOT="${OPENCLAW_STATE_DIR:-${HOME:-/data/home}/.openclaw}"
if [ -n "${HERMES_HOME:-}" ]; then
  INDEX_STATE="$HERMES_HOME/.agent-index.json"
else
  INDEX_STATE="${HOME:-/data/home}/.agent-index/.agent-index.json"
fi

while :; do
  if [ -s "$INDEX_STATE" ] && \
     find "$STATE_ROOT/agents" -path '*/agent/openclaw-agent.sqlite' -print -quit 2>/dev/null | grep -q .; then
    python3 "$CLIENT" --agent "$AGENT_INDEX_SLUG" || \
      printf '%s\n' 'Agent Index usage report failed; it will retry in five minutes.' >&2
  fi
  sleep 300
done
