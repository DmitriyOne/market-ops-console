#!/usr/bin/env bash
# Renders the bitmap icons from app/icon.svg (0.13.0, ADR 0018). Run by hand
# after changing the SVG and commit the results; the build needs no tool.
# Needs rsvg-convert (librsvg) and ImageMagick (`brew install librsvg imagemagick`).
set -euo pipefail
cd "$(dirname "$0")/.."
tmp="$(mktemp -d)"
trap 'rm -rf "$tmp"' EXIT

# The light look only: bitmaps cannot follow the colour scheme.
sed '/@media/,/^    }$/d' app/icon.svg > "$tmp/light.svg"
# iOS rounds the corners itself and fills transparent ones black: a full square.
sed 's/ rx="8"//' "$tmp/light.svg" > "$tmp/square.svg"

rsvg-convert -w 180 -h 180 "$tmp/square.svg" -o app/apple-icon.png
rsvg-convert -w 16 -h 16 "$tmp/light.svg" -o "$tmp/16.png"
rsvg-convert -w 32 -h 32 "$tmp/light.svg" -o "$tmp/32.png"
magick "$tmp/16.png" "$tmp/32.png" app/favicon.ico
echo "app/apple-icon.png and app/favicon.ico written"
