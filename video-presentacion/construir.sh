#!/usr/bin/env bash
# Arma el video de presentación con HyperFrames y lo entrega.
# Uso (Git Bash, desde cualquier carpeta):  bash "<carpeta-video>/construir.sh"
# Requiere Node y FFmpeg. HyperFrames se usa con npx en una versión fija, sin package.json.
set -euo pipefail

SLUG="project-charter"   # la skill lo reemplaza al copiar la plantilla
AQUI="$(cd "$(dirname "$0")" && pwd)"
SKILL="$HOME/.claude/skills/video-proyecto"
HF="npx -y hyperframes@0.9.16"

for d in "/c/Program Files/nodejs" "${LOCALAPPDATA:-}"/Microsoft/WinGet/Packages/Gyan.FFmpeg_*/ffmpeg-*/bin; do
  [ -d "$d" ] && PATH="$PATH:$d"
done
command -v npx >/dev/null || { echo "Falta Node (npx)" >&2; exit 1; }
command -v ffmpeg >/dev/null || { echo "Falta FFmpeg" >&2; exit 1; }

mkdir -p "$AQUI/salida"
cd "$AQUI/proyecto"
echo "== 1/3 Revisión (lint y check)"
$HF lint
$HF check
echo "== 2/3 Render"
$HF render --quality delivery -o "$AQUI/salida/sin-logo.mp4"
echo "== 3/3 Entrega"
bash "$SKILL/scripts/entregar.sh" "$AQUI/salida/sin-logo.mp4" "$AQUI" "$SLUG" "$@"
