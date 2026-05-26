#!/usr/bin/env bash
# Local build + push to GHCR (use when GHA is unavailable)
# Usage: bash scripts/build-and-push.sh [--push]
set -euo pipefail

REGISTRY="ghcr.io"
IMAGE="ghcr.io/oudouusa/magazine-review-site"
COMMIT=$(git rev-parse --short HEAD)
TAG="${IMAGE}:${COMMIT}"
LATEST="${IMAGE}:main"

echo "=== Building ${TAG} ==="
docker build -t "${TAG}" -t "${LATEST}" .

if [[ "${1:-}" == "--push" ]]; then
  echo "=== Pushing ${TAG} ==="
  docker push "${TAG}"
  docker push "${LATEST}"

  echo "=== Done. Update vps-infra with: ==="
  echo "MAGAZINE_REVIEW_SITE_REF=${TAG}"
fi
