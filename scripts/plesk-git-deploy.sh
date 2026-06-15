#!/bin/bash
# Plesk Git — Additional deployment actions
# Run from the cloned repository root after git pull.
#
# Preserves live data/ and uploads/ on the server while deploying
# fresh code from httpdocs-ready/.

set -euo pipefail

REPO_ROOT="$(pwd)"
SRC="${REPO_ROOT}/httpdocs-ready"
DEST="${PLESK_DOCUMENT_ROOT:-}"

if [ -z "$DEST" ]; then
  echo "PLESK_DOCUMENT_ROOT is not set. Set deployment path to httpdocs in Plesk Git settings."
  exit 1
fi

if [ ! -d "$SRC" ]; then
  echo "Missing httpdocs-ready/. Run: npm run build:httpdocs"
  exit 1
fi

BACKUP="$(mktemp -d)"
trap 'rm -rf "$BACKUP"' EXIT

for dir in data uploads; do
  if [ -d "${DEST}/${dir}" ]; then
    cp -a "${DEST}/${dir}" "${BACKUP}/${dir}"
  fi
done

# Deploy site files; do not delete protected folders from the live site.
rsync -a --delete \
  --exclude 'data/' \
  --exclude 'uploads/' \
  "${SRC}/" "${DEST}/"

for dir in data uploads; do
  if [ -d "${BACKUP}/${dir}" ]; then
    mkdir -p "${DEST}/${dir}"
    cp -an "${BACKUP}/${dir}/." "${DEST}/${dir}/"
  fi
done

chmod 775 "${DEST}/data" 2>/dev/null || true
chmod 775 "${DEST}/uploads" 2>/dev/null || true
find "${DEST}/uploads" -type d -exec chmod 775 {} + 2>/dev/null || true

echo "Deployed httpdocs-ready to ${DEST} (data/ and uploads/ preserved)."
