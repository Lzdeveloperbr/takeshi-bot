import { PREFIX } from "../../config.js";
import { InvalidParameterError, WarningError } from "../../errors/index.js";
import { onlyNumbers } from "../../utils/index.js";
import { errorLog } from "../../utils/logger.js";

const STATUS_MESSAGES = {
  403: "não permite ser adicionado por privacidade. Mandei o link do grupo para ele no privado.",
  408: "saiu do grupo há pouco tempo e não pode ser adicionado agora.",
  409: "já está no grupo.",
  401: "bloqueou o bot.",
  500: "não pôde ser adicionado (o grupo está cheio?).",
};

export default {
  name: "add",
  description: "Adiciona alguém ao grupo pelo número (com DDD e código do país).",
  commands: ["add", "adicionar"],
  usage: `${PREFIX}add 5511999999999`,
  /**
   * @param {CommandHandleProps} props
   */
  handle: async ({ fullArgs, remoteJid, isGroup, socket, sendSuccessReply, sendWarningReply }) => {
    if (!isGroup) {
      throw new WarningError("Este comando só deve ser usado em grupos!");
    }

    let number = onlyNumbers(fullArgs || "");

    if (number.length === 10 || number.length === 11) {
      number = `55${number}`;
    }

    if (number.length < 12 || number.length > 15) {
      throw new InvalidParameterError(
        `Informe o número com DDD! Exemplo: ${PREFIX}add 11999999999 ou ${PREFIX}add 5511999999999`,
      );
    }

    const [exists] = await socket.onWhatsApp(number).catch(() => []);

    if (exists && !exists.exists) {
      throw new WarningError("Esse número não tem WhatsApp.");
    }

    const jid = exists?.jid || `${number}@s.whatsapp.net`;

    let result;
    try {
      [result] = await socket.groupParticipantsUpdate(remoteJid, [jid], "add");
    } catch (error) {
      errorLog(`Erro ao adicionar membro: ${error.message}`);
      throw new WarningError("Não consegui adicionar. Verifique se eu sou administrador do grupo!");
    }

    const status = Number(result?.status);

    if (!status || status === 200) {
      await sendSuccessReply(`+${number} foi adicionado ao grupo!`);
      return;
    }

    if (status === 403) {
      try {
        const code = await socket.groupInviteCode(remoteJid);
        await socket.sendMessage(jid, {
          text: `Olá! Você foi convidado para entrar no grupo:\nhttps://chat.whatsapp.com/${code}`,
        });
      } catch (error) {
        errorLog(`Erro ao enviar convite: ${error.message}`);
      }
    }

    await sendWarningReply(`+${number} ${STATUS_MESSAGES[status] || `não pôde ser adicionado (código ${status}).`}`);
  },
};
