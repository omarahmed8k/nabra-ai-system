#!/usr/bin/env bash
# Production deploy for Nabra / Wengz on Hostinger VPS.
# Install: sudo install -m 755 scripts/deploy-nabra.sh /usr/local/bin/deploy-nabra.sh
# Or: curl from repo after first clone — keep this copy in sync with the repo script.
set -euo pipefail

APP_DIR="${APP_DIR:-/var/www/nabra-ai-system}"
APP_NAME="${APP_NAME:-nabra-ai-system}"
BRANCH="${DEPLOY_BRANCH:-main}"
HEALTH_URL="${HEALTH_URL:-http://127.0.0.1:3000/api/health}"
LOG_FILE="${LOG_FILE:-/var/log/nabra-deploy.log}"
STATE_DIR="${STATE_DIR:-/var/lib/nabra}"
PREV_SHA_FILE="${STATE_DIR}/last-good-sha"
LOCK_FILE="${STATE_DIR}/deploy.lock"

mkdir -p "$(dirname "$LOG_FILE")" "$STATE_DIR"

exec >>"$LOG_FILE" 2>&1

log() {
  printf '[%s] %s\n' "$(date -u +'%Y-%m-%dT%H:%M:%SZ')" "$*"
}

cleanup() {
  rm -f "$LOCK_FILE"
}
trap cleanup EXIT

if [[ -f "$LOCK_FILE" ]]; then
  log "ERROR: deploy already in progress (lock: $LOCK_FILE)"
  exit 1
fi
echo $$ >"$LOCK_FILE"

cd "$APP_DIR"

if [[ ! -f .env ]]; then
  log "ERROR: missing $APP_DIR/.env — secrets stay on the VPS, aborting"
  exit 1
fi

PREV_SHA="$(git rev-parse HEAD)"
log "Starting deploy on branch=$BRANCH from sha=$PREV_SHA"

git fetch --prune origin
git checkout "$BRANCH"
git reset --hard "origin/$BRANCH"

NEW_SHA="$(git rev-parse HEAD)"
log "Checked out $NEW_SHA"

# Keep /usr/local/bin in sync with the repo copy after checkout.
if [[ -f "$APP_DIR/scripts/deploy-nabra.sh" ]]; then
  install -m 755 "$APP_DIR/scripts/deploy-nabra.sh" /usr/local/bin/deploy-nabra.sh || true
fi

# Preserve upload storage and env across resets (tracked files only).
# LOCAL_UPLOAD_DIR / storage and .env are untracked / gitignored.

export NODE_ENV=production
npm ci --include=dev

# Schema sync until real Prisma migrations exist in the repo.
npm run db:push

npm run build

pm2 restart "$APP_NAME" --update-env
pm2 save

log "Waiting for health check: $HEALTH_URL"
sleep 3

if ! curl -fsS --max-time 15 "$HEALTH_URL" >/dev/null; then
  log "ERROR: health check failed — rolling back to $PREV_SHA"
  git reset --hard "$PREV_SHA"
  npm ci --include=dev
  npm run build
  pm2 restart "$APP_NAME" --update-env
  pm2 save
  sleep 3
  if curl -fsS --max-time 15 "$HEALTH_URL" >/dev/null; then
    log "Rollback succeeded; still on $PREV_SHA"
  else
    log "CRITICAL: rollback health check also failed"
  fi
  exit 1
fi

echo "$NEW_SHA" >"$PREV_SHA_FILE"
log "Deploy OK: $NEW_SHA (previous good: $PREV_SHA)"
