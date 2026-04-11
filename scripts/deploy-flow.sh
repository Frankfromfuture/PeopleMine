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
chown -R admin:admin "$REL"

APP_DIR="$REL"
if [ ! -f "$APP_DIR/package.json" ]; then
  PACKAGE_JSON_PATH="$(find "$REL" -path '*/node_modules/*' -prune -o -name package.json -print | head -n1)"
  if [ -n "${PACKAGE_JSON_PATH:-}" ]; then
    APP_DIR="$(dirname "$PACKAGE_JSON_PATH")"
  fi
fi

if [ -z "${APP_DIR:-}" ] || [ ! -f "$APP_DIR/package.json" ]; then
  echo "package.json not found in release"
  exit 1
fi

echo "app dir: $APP_DIR"

rm -rf "$APP_DIR/node_modules" "$APP_DIR/.next"

if [ -f "$SHARED_DIR/.env.production" ]; then
  ln -sfn "$SHARED_DIR/.env.production" "$APP_DIR/.env.production"
fi

sudo -u admin -H bash -lc "
  set -Eeuo pipefail
  cd '$APP_DIR'
  unset PRISMA_ENGINES_MIRROR
  export PRISMA_SKIP_POSTINSTALL_GENERATE=1
  npm ci
  npx prisma generate
  npm run build
"

ln -sfn "$APP_DIR" "$CURRENT_LINK"
chown -h admin:admin "$CURRENT_LINK"

sudo -u admin -H bash -lc "
  set -Eeuo pipefail
  if pm2 describe peoplemine >/dev/null 2>&1; then
    pm2 restart peoplemine --update-env
  else
    pm2 start npm --name peoplemine --cwd '$CURRENT_LINK' -- start
  fi
  pm2 save
"

sleep 5
curl -fI http://127.0.0.1:3000

cd "$RELEASES_DIR"
ls -1dt */ | tail -n +6 | xargs -r rm -rf

echo "deploy success"
