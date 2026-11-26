import path from "node:path";
import { ASSETS_DIR, BOT_NAME, PREFIX } from "../../config.js";
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
  handle: async ({ remoteJid, socket, webMessage, sendSuccessReact, sendImageFromFile }) => {
    await sendSuccessReact();

    // Menu em texto: aparece para todos, inclusive no WhatsApp Business.
    await sendImageFromFile(
      path.join(ASSETS_DIR, "images", "takeshi-bot.png"),
      `\n\n${menuMessage(remoteJid)}`,
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
