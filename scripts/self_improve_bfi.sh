#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")/.."

LOOPS="${BFI_LOOPS:-${1:-2}}"
TARGET="${BFI_QUALITY_TARGET:-95}"

if ! [[ "$LOOPS" =~ ^[0-9]+$ ]] || [[ "$LOOPS" -lt 1 ]]; then
  echo "LOOPS must be a positive integer." >&2
  exit 2
fi

for iteration in $(seq 1 "$LOOPS"); do
  echo "=== BFI loop ${iteration}/${LOOPS}: lint ==="
  npm run lint

  echo "=== BFI loop ${iteration}/${LOOPS}: PWA ==="
  npm run check:pwa

  echo "=== BFI loop ${iteration}/${LOOPS}: build ==="
  npm run build

  echo "=== BFI loop ${iteration}/${LOOPS}: BFI quality >= ${TARGET}% ==="
  BFI_QUALITY_TARGET="$TARGET" npm run quality:bfi

  echo "=== BFI loop ${iteration}/${LOOPS}: retained BR3N dashboard quality ==="
  npm run quality:dashboard
done

echo "BFI self-improvement validation loop completed ${LOOPS} clean iteration(s)."
