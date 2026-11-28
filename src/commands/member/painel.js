import path from "node:path";
import { ASSETS_DIR, BOT_NAME, PREFIX } from "../../config.js";
import { menuButtons } from "../../menu.js";
import { sendButtons } from "../../utils/buttons.js";
import { errorLog } from "../../utils/logger.js";

export default {
  name: "painel",
  description: "Abre o painel com botões para usar o bot sem digitar comandos.",
  commands: ["painel", "botoes", "botões", "atalhos"],
  usage: `${PREFIX}painel`,
  /**
   * @param {CommandHandleProps} props
   */
  handle: async ({ remoteJid, socket, webMessage, sendReact }) => {
    await sendReact("⚡");

    const imagePath = path.join(ASSETS_DIR, "images", "takeshi-bot.png");

    // Imagem e texto em mensagem normal (aparece até no WhatsApp Business)...
    await socket.sendMessage(
      remoteJid,
      {
        image: { url: imagePath },
        caption: `⚡ *Painel do ${BOT_NAME}*\n\nToque em *Escolher comando* logo abaixo e escolha o que quer fazer.\n\n_Se os botões não aparecerem (WhatsApp Business), use ${PREFIX}menu._`,
      },
      { quoted: JSON.parse(JSON.stringify(webMessage)) },
    );

    // ...e os botões em seguida.
    try {
      await sendButtons({
        socket,
        remoteJid,
        text: "📋 Atalhos:",
        footer: BOT_NAME,
        buttons: menuButtons(remoteJid),
      });
    } catch (error) {
      errorLog(`Não consegui enviar os botões do painel: ${error.message}`);
    }
  },
};
