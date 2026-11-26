#!/usr/bin/env bash
#
# Instala tudo que o bot precisa em uma VPS Ubuntu/Debian (ex.: Oracle Cloud
# Always Free) e deixa o bot rodando 24h como serviço do sistema:
# liga sozinho quando o servidor reinicia e volta sozinho se cair.
#
# Uso (dentro da pasta do bot):  bash scripts/setup-vps.sh
#
# Comandos úteis depois:
#   sudo systemctl status scarlett-bot     -> ver se está rodando
#   sudo journalctl -u scarlett-bot -f     -> ver os logs ao vivo
#   sudo systemctl restart scarlett-bot    -> reiniciar
#   sudo systemctl stop scarlett-bot       -> parar

set -euo pipefail

SERVICE_NAME="scarlett-bot"
BOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
CREDS_FILE="$BOT_DIR/assets/auth/baileys/creds.json"

echo "📦 Instalando pacotes do sistema (git, ffmpeg, python)..."
sudo apt-get update -y
sudo apt-get install -y git ffmpeg python3 curl ca-certificates

if ! node -v 2>/dev/null | grep -qE '^v(2[2-9]|[3-9][0-9])\.'; then
  echo "📦 Instalando Node.js 22..."
  curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
  sudo apt-get install -y nodejs
fi

echo "📦 Instalando/atualizando o yt-dlp (downloads grátis)..."
sudo curl -fsSL https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp \
  -o /usr/local/bin/yt-dlp
sudo chmod a+rx /usr/local/bin/yt-dlp

echo "📦 Instalando dependências do bot..."
cd "$BOT_DIR"
npm install

echo "⚙️  Criando o serviço $SERVICE_NAME..."
sudo tee "/etc/systemd/system/$SERVICE_NAME.service" > /dev/null <<SERVICE
[Unit]
Description=Scarlett Bot (WhatsApp)
After=network-online.target
Wants=network-online.target

[Service]
Type=simple
User=$USER
WorkingDirectory=$BOT_DIR
ExecStart=$(command -v node) ./src/index.js
Restart=always
RestartSec=5
Environment=NODE_ENV=production

[Install]
WantedBy=multi-user.target
SERVICE

sudo systemctl daemon-reload

if [ ! -f "$CREDS_FILE" ]; then
  echo ""
  echo "⚠️  O bot ainda não está conectado ao WhatsApp."
  echo "   1. Rode: npm start"
  echo "   2. Digite o número do bot e coloque o código no WhatsApp"
  echo "      (Aparelhos conectados > Conectar com número de telefone)"
  echo "   3. Quando aparecer 'Bot iniciado com sucesso', aperte Ctrl + C"
  echo "   4. Rode de novo: bash scripts/setup-vps.sh"
  exit 0
fi

sudo systemctl enable --now "$SERVICE_NAME"
sudo systemctl restart "$SERVICE_NAME"

echo ""
echo "✅ Pronto! O bot está rodando 24h como serviço."
echo "   Ver logs:   sudo journalctl -u $SERVICE_NAME -f"
echo "   Reiniciar:  sudo systemctl restart $SERVICE_NAME"
