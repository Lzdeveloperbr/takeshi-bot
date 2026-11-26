#!/usr/bin/env bash
#
# Mantém o bot ligado: reinicia automaticamente se ele cair ou travar.
# Útil em hospedagens sem systemd (em VPS prefira scripts/setup-vps.sh).
# Se rodar no Termux, também ativa o termux-wake-lock.
#
# Uso: npm run start:24h   (ou: bash scripts/start-24h.sh)
# Para parar: Ctrl + C

cd "$(dirname "$0")/.." || exit 1

RESTART_DELAY_SECONDS=5
LOG_FILE="assets/temp/24h.log"
mkdir -p assets/temp

log() {
  echo "[$(date '+%d/%m/%Y %H:%M:%S')] $1" | tee -a "$LOG_FILE"
}

if command -v termux-wake-lock > /dev/null 2>&1; then
  termux-wake-lock
  log "Wake lock ativado (o Android não vai suspender o Termux)."
fi

stop() {
  log "Bot parado manualmente."
  if command -v termux-wake-unlock > /dev/null 2>&1; then
    termux-wake-unlock
  fi
  exit 0
}

trap stop INT TERM

while true; do
  log "Iniciando o bot..."
  node ./src/index.js
  code=$?
  log "O bot encerrou (código $code). Reiniciando em ${RESTART_DELAY_SECONDS}s..."
  sleep "$RESTART_DELAY_SECONDS"
done
