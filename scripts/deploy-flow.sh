#!/usr/bin/env bash

set -Eeuo pipefail

exec 9>/tmp/peoplemine-deploy.lock
flock -n 9 || {
  echo "another deployment is running"
  exit 1
}

APP_BASE="${APP_BASE:-/home/admin/peoplemine}"
RELEASES_DIR="$APP_BASE/releases"
SHARED_DIR="$APP_BASE/shared"
CURRENT_LINK="$APP_BASE/current"
RELEASE_ID="${CI_COMMIT_SHA:-$(date +%Y%m%d%H%M%S)}"
REL="$RELEASES_DIR/$RELEASE_ID"
PREVIOUS_TARGET="$(readlink -f "$CURRENT_LINK" 2>/dev/null || true)"

health_check() {
  local tries=0
  local max_tries=30
  local sleep_seconds=2
  local body_file="/tmp/peoplemine-health-${RELEASE_ID}.json"
  rm -f "$body_file"

  while [ "$tries" -lt "$max_tries" ]; do
    if curl -fsS -m 5 "http://127.0.0.1:3000/api/health" -o "$body_file"; then
      if grep -q '"ok"[[:space:]]*:[[:space:]]*true' "$body_file"; then
        echo "health check passed: $(cat "$body_file")"
        return 0
      fi
      echo "health check response not ready: $(cat "$body_file")"
    fi
    tries=$((tries + 1))
    sleep "$sleep_seconds"
  done

  echo "health check failed after ${max_tries} tries"
  return 1
}

if [ -n "${package_download_path:-}" ] && [ -f "${package_download_path}" ]; then
  PKG="${package_download_path}"
elif [ -f "/root/peoplemine/package.tgz" ]; then
  PKG="/root/peoplemine/package.tgz"
elif [ -f "$APP_BASE/package.tgz" ]; then
  PKG="$APP_BASE/package.tgz"
else
  echo "package.tgz not found"
  exit 1
fi

echo "using package: $PKG"
echo "release dir: $REL"
if [ -n "${PREVIOUS_TARGET:-}" ]; then
  echo "previous target: $PREVIOUS_TARGET"
fi

mkdir -p "$RELEASES_DIR" "$SHARED_DIR" "$REL"
chown -R admin:admin "$APP_BASE"

tar -xzf "$PKG" -C "$REL"

INNER_PKG="$(find "$REL" -maxdepth 2 -type f -name 'package.tgz' | head -n1)"
if [ -n "${INNER_PKG:-}" ]; then
  INNER_DIR="$REL/inner"
  mkdir -p "$INNER_DIR"
  tar -xzf "$INNER_PKG" -C "$INNER_DIR"
  SEARCH_DIR="$INNER_DIR"
else
  SEARCH_DIR="$REL"
fi

chown -R admin:admin "$REL"

APP_DIR="$SEARCH_DIR"
if [ ! -f "$APP_DIR/package.json" ]; then
  PACKAGE_JSON_PATH="$(find "$SEARCH_DIR" -path '*/node_modules/*' -prune -o -name package.json -print | head -n1)"
  if [ -n "${PACKAGE_JSON_PATH:-}" ]; then
    APP_DIR="$(dirname "$PACKAGE_JSON_PATH")"
  fi
fi

if [ -z "${APP_DIR:-}" ] || [ ! -f "$APP_DIR/package.json" ]; then
  echo "package.json not found in release"
  exit 1
fi

echo "app dir: $APP_DIR"

# Prevent packaged env files from overriding server-managed production env.
rm -f "$APP_DIR/.env.local" "$APP_DIR/.env.production.local" "$APP_DIR/.env"

if [ -f "$SHARED_DIR/.env.production" ]; then
  ln -sfn "$SHARED_DIR/.env.production" "$APP_DIR/.env.production"
fi

ln -sfn "$APP_DIR" "$CURRENT_LINK"
chown -h admin:admin "$CURRENT_LINK"

sudo -u admin -H bash -lc "
  set -Eeuo pipefail
  cd '$CURRENT_LINK'
  npm run check:runtime-env
"

# Clear any stale root-managed process so the admin PM2 app can bind 3000.
pm2 delete peoplemine >/dev/null 2>&1 || true

if command -v fuser >/dev/null 2>&1; then
  fuser -k 3000/tcp >/dev/null 2>&1 || true
else
  PORT_PIDS="$(ss -lntp 2>/dev/null | grep ':3000' | sed -n 's/.*pid=\([0-9]\+\).*/\1/p' | sort -u)"
  if [ -n "${PORT_PIDS:-}" ]; then
    kill $PORT_PIDS >/dev/null 2>&1 || true
  fi
fi

sudo -u admin -H bash -lc "
  set -Eeuo pipefail
  pm2 delete peoplemine >/dev/null 2>&1 || true
  pm2 start npm --name peoplemine --cwd '$CURRENT_LINK' -- start
  pm2 save
"

if ! health_check; then
  echo "new release health check failed, starting rollback..."

  if [ -n "${PREVIOUS_TARGET:-}" ] && [ -f "$PREVIOUS_TARGET/package.json" ]; then
    ln -sfn "$PREVIOUS_TARGET" "$CURRENT_LINK"
    chown -h admin:admin "$CURRENT_LINK"

    sudo -u admin -H bash -lc "
      set -Eeuo pipefail
      pm2 delete peoplemine >/dev/null 2>&1 || true
      pm2 start npm --name peoplemine --cwd '$CURRENT_LINK' -- start
      pm2 save
    "

    if health_check; then
      echo "rollback succeeded to $PREVIOUS_TARGET"
    else
      echo "rollback failed: previous release is unhealthy too"
    fi
  else
    echo "rollback skipped: no previous release target"
  fi

  exit 1
fi

cd "$RELEASES_DIR"
ls -1dt */ | tail -n +6 | xargs -r rm -rf

echo "deploy success"
