#!/bin/sh
set -eu

APP_ROOT="${APP_ROOT:-/opt/print-farm-operator}"
DATA_ROOT="${PRINT_FARM_DATA_DIR:-/data}"
export HOME="${HOME:-$DATA_ROOT/home}"
export OPENCLAW_STATE_DIR="${OPENCLAW_STATE_DIR:-$DATA_ROOT/openclaw}"
export OPENCLAW_CONFIG_PATH="${OPENCLAW_CONFIG_PATH:-$OPENCLAW_STATE_DIR/openclaw.json}"
export PRINT_FARM_IDENTITY_AUDIENCE="${PRINT_FARM_IDENTITY_AUDIENCE:-print-farm-operator}"
export AGENT_INDEX_SLUG="${AGENT_INDEX_SLUG:-print-farm-operator}"

mkdir -p \
  "$HOME" \
  "$OPENCLAW_STATE_DIR" \
  "$DATA_ROOT/farm" \
  "$DATA_ROOT/secrets" \
  "$DATA_ROOT/jobs" \
  "$DATA_ROOT/private-jobs" \
  "$DATA_ROOT/upload-spool" \
  "$DATA_ROOT/pending-intake" \
  "$OPENCLAW_STATE_DIR/media/inbound"

if [ ! -s "$DATA_ROOT/secrets/gateway-token" ]; then
  umask 077
  python3 -c 'import secrets,sys; sys.stdout.write(secrets.token_urlsafe(36))' > "$DATA_ROOT/secrets/gateway-token"
fi
if [ ! -s "$DATA_ROOT/secrets/identity.key" ]; then
  umask 077
  python3 -c 'import secrets,sys; sys.stdout.write(secrets.token_hex(32))' > "$DATA_ROOT/secrets/identity.key"
fi
chmod 0600 "$DATA_ROOT/secrets/gateway-token" "$DATA_ROOT/secrets/identity.key"
export OPENCLAW_GATEWAY_TOKEN="$(cat "$DATA_ROOT/secrets/gateway-token")"

python3 "$APP_ROOT/docker/initialize_runtime.py"

# The client reads OpenClaw's own per-agent SQLite transcripts. It starts with
# the Gateway and reports immediately, then every five minutes. Its installation
# key is stored under HOME, which is part of the persistent /data volume.
"$APP_ROOT/docker/agent-index-loop.sh" &

exec openclaw gateway run --bind lan --auth token --port "${OPENCLAW_GATEWAY_PORT:-18789}"
