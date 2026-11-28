import path from "node:path";
import { ASSETS_DIR, BOT_EMOJI, PREFIX } from "../../config.js";
import { menuMessage } from "../../menu.js";

export default {
  name: "menu",
  description: "Menu de comandos (para usar com botões, veja o painel)",
  commands: ["menu", "help"],
  usage: `${PREFIX}menu`,
  /**
   * @param {CommandHandleProps} props
   */
  handle: async ({ remoteJid, socket, webMessage, sendSuccessReact }) => {
    await sendSuccessReact();

    // Enviado pelo caminho do arquivo para o Baileys reaproveitar o upload
    // (o banner sobe uma vez só, os próximos /menu saem bem mais rápido).
    // O painel com botões fica separado no comando painel.
    await socket.sendMessage(
      remoteJid,
      {
        image: { url: path.join(ASSETS_DIR, "images", "takeshi-bot.png") },
        caption: `${BOT_EMOJI} \n\n${menuMessage(remoteJid)}`,
      },
      { quoted: JSON.parse(JSON.stringify(webMessage)) },
    );
  },
};
