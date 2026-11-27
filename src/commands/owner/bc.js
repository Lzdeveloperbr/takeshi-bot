import { delay } from "baileys";
import { BOT_NAME, PREFIX } from "../../config.js";
import { InvalidParameterError, WarningError } from "../../errors/index.js";
import { isActiveGroup } from "../../utils/database.js";
import { errorLog } from "../../utils/logger.js";

// Intervalo entre grupos: enviar para muitos grupos de uma vez aumenta o risco de banimento.
const DELAY_BETWEEN_GROUPS_MS = 4_000;

export default {
  name: "bc",
  description: "Envia um aviso para todos os grupos ativos do bot (com intervalo entre eles).",
  commands: ["bc", "broadcast", "transmitir", "aviso-geral"],
  usage: `${PREFIX}bc mensagem para todos os grupos`,
  /**
   * @param {CommandHandleProps} props
   */
  handle: async ({ fullMessage, socket, sendReply, sendSuccessReply }) => {
    const text = fullMessage?.replace(/^\S+\s?/, "").trim();

    if (!text) {
      throw new InvalidParameterError(`Escreva o aviso! Exemplo: ${PREFIX}bc Bot atualizado com novos comandos!`);
    }

    const groups = Object.values(await socket.groupFetchAllParticipating()).filter(
      (group) => isActiveGroup(group.id) && !group.announce,
    );

    if (!groups.length) {
      throw new WarningError("Nenhum grupo ativo para enviar.");
    }

    await sendReply(
      `📢 Enviando para ${groups.length} grupo(s)... vai levar uns ${Math.ceil((groups.length * DELAY_BETWEEN_GROUPS_MS) / 1000)}s.`,
    );

    let sent = 0;
    for (const group of groups) {
      try {
        await socket.sendMessage(group.id, { text: `📢 *Aviso do ${BOT_NAME}*\n\n${text}` });
        sent++;
      } catch (error) {
        errorLog(`Erro no broadcast para ${group.id}: ${error.message}`);
      }

      await delay(DELAY_BETWEEN_GROUPS_MS);
    }

    await sendSuccessReply(`Aviso enviado para ${sent} de ${groups.length} grupo(s).`);
  },
};
