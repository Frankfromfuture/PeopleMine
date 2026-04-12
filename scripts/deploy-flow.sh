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

if [ -f "$SHARED_DIR/.env.production" ]; then
  ln -sfn "$SHARED_DIR/.env.production" "$APP_DIR/.env.production"
fi

ln -sfn "$APP_DIR" "$CURRENT_LINK"
chown -h admin:admin "$CURRENT_LINK"

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

sleep 5
curl -fI http://127.0.0.1:3000

cd "$RELEASES_DIR"
ls -1dt */ | tail -n +6 | xargs -r rm -rf

echo "deploy success"
