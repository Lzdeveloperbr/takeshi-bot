import path from "node:path";
import { ASSETS_DIR, BOT_EMOJI, BOT_NAME, PREFIX } from "../../config.js";
import { menuButtons, menuMessage } from "../../menu.js";
import { sendButtons } from "../../utils/buttons.js";
import { errorLog } from "../../utils/logger.js";

export default {
  name: "menu",
  description: "Menu de comandos (com painel de botões)",
  commands: ["menu", "help"],
  usage: `${PREFIX}menu`,
  /**
   * @param {CommandHandleProps} props
   */
  handle: async ({ remoteJid, socket, webMessage, sendSuccessReact }) => {
    await sendSuccessReact();

    // Menu em texto: aparece para todos, inclusive no WhatsApp Business.
    // Enviado pelo caminho do arquivo para o Baileys reaproveitar o upload
    // (o banner sobe uma vez só, os próximos /menu saem bem mais rápido).
    await socket.sendMessage(
      remoteJid,
      {
        image: { url: path.join(ASSETS_DIR, "images", "takeshi-bot.png") },
        caption: `${BOT_EMOJI} \n\n${menuMessage(remoteJid)}`,
      },
      { quoted: JSON.parse(JSON.stringify(webMessage)) },
    );

    // Painel com botões logo abaixo (não aparece no WhatsApp Business).
    try {
      await sendButtons({
        socket,
        remoteJid,
        text: `⚡ *Atalhos do ${BOT_NAME}*\n\nToque em *Escolher comando* para usar o bot sem digitar.`,
        footer: BOT_NAME,
        buttons: menuButtons(remoteJid),
        quoted: webMessage,
      });
    } catch (error) {
      errorLog(`Não consegui enviar o painel de botões: ${error.message}`);
    }
  },
};
