import fs from "node:fs";
import path from "node:path";
import { ASSETS_DIR, BOT_NAME, PREFIX } from "../../config.js";
import { menuButtons } from "../../menu.js";
import { sendButtons } from "../../utils/buttons.js";

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

    await sendButtons({
      socket,
      remoteJid,
      image: fs.readFileSync(path.join(ASSETS_DIR, "images", "takeshi-bot.png")),
      text: `⚡ *Painel do ${BOT_NAME}*\n\nToque em *Escolher comando* e escolha o que quer fazer.\n\n_Os botões não aparecem no WhatsApp Business; nesse caso use ${PREFIX}menu._`,
      footer: BOT_NAME,
      buttons: menuButtons(remoteJid),
      quoted: webMessage,
    });
  },
};
