import { OWNER_LID, PREFIX } from "../../config.js";
import { readAllDatabaseFiles } from "../../utils/database.js";

export default {
  name: "backup",
  description: "Envia no seu privado um backup de todos os dados do bot (configurações dos grupos, moedas, regras...).",
  commands: ["backup", "fazer-backup"],
  usage: `${PREFIX}backup`,
  /**
   * @param {CommandHandleProps} props
   */
  handle: async ({ socket, userLid, sendSuccessReply }) => {
    const data = readAllDatabaseFiles();

    // Nunca inclui tokens/chaves no backup enviado pelo WhatsApp.
    if (data["config.json"] && typeof data["config.json"] === "object") {
      for (const key of Object.keys(data["config.json"])) {
        if (/token|key|secret/i.test(key)) data["config.json"][key] = "(oculto)";
      }
    }

    const date = new Date().toISOString().slice(0, 10);

    await socket.sendMessage(userLid || OWNER_LID, {
      document: Buffer.from(JSON.stringify({ createdAt: new Date().toISOString(), files: data }, null, 2)),
      fileName: `backup-bot-${date}.json`,
      mimetype: "application/json",
      caption: `💾 Backup dos dados do bot (${Object.keys(data).length} arquivos).\nTokens e chaves foram ocultados.`,
    });

    await sendSuccessReply("Backup enviado no seu privado!");
  },
};
