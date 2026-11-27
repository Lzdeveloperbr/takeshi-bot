import { OWNER_LID, PREFIX } from "../../config.js";
import { InvalidParameterError, WarningError } from "../../errors/index.js";
import { onlyNumbers } from "../../utils/index.js";

const PLACEHOLDER_LID = "12345678901234567890@lid";

export default {
  name: "report",
  description: "Envia uma mensagem para o dono do bot (bugs, sugestões, denúncias).",
  commands: ["report", "reportar", "bug", "sugestao", "sugestão", "falar-com-dono"],
  usage: `${PREFIX}report o comando play não está funcionando`,
  cooldownSeconds: 30,
  /**
   * @param {CommandHandleProps} props
   */
  handle: async ({ fullArgs, userLid, remoteJid, isGroup, webMessage, socket, getGroupMetadata, sendSuccessReply }) => {
    const text = fullArgs?.trim();

    if (!text || text.length < 5) {
      throw new InvalidParameterError(`Escreva sua mensagem! Exemplo: ${PREFIX}report o comando play não funciona`);
    }

    if (!OWNER_LID || OWNER_LID === PLACEHOLDER_LID) {
      throw new WarningError("O dono do bot ainda não configurou o número dele (OWNER_LID no config.js).");
    }

    let place = "conversa privada";
    if (isGroup) {
      const metadata = await getGroupMetadata().catch(() => null);
      place = `grupo *${metadata?.subject || remoteJid}*`;
    }

    await socket.sendMessage(OWNER_LID, {
      text: `📨 *Nova mensagem para o dono*\n\n👤 De: @${onlyNumbers(userLid)} (${webMessage?.pushName || "sem nome"})\n📍 Em: ${place}\n🆔 ${remoteJid}\n\n💬 ${text.slice(0, 2000)}`,
      mentions: [userLid],
    });

    await sendSuccessReply("Mensagem enviada ao dono do bot! Obrigado 💙");
  },
};
