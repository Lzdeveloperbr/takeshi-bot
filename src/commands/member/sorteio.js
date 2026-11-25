import { randomInt } from "node:crypto";
import { PREFIX } from "../../config.js";
import { InvalidParameterError, WarningError } from "../../errors/index.js";

function normalizeJid(id) {
  return id.split(":")[0].split("@")[0];
}

function shuffle(items) {
  const result = [...items];

  for (let index = result.length - 1; index > 0; index -= 1) {
    const randomIndex = randomInt(index + 1);
    [result[index], result[randomIndex]] = [result[randomIndex], result[index]];
  }

  return result;
}

export default {
  name: "sorteio",
  description: "Sorteia um ou mais participantes do grupo sem repetir vencedores.",
  commands: ["sorteio", "sortear"],
  usage: `${PREFIX}sorteio [quantidade de ganhadores, máximo 10]`,
  /**
   * @param {CommandHandleProps} props
   */
  handle: async ({ args, isGroup, remoteJid, socket, sendReply }) => {
    if (!isGroup) {
      throw new WarningError("Use este comando dentro de um grupo.");
    }

    const quantity = args[0] === undefined ? 1 : Number(args[0]);

    if (!Number.isInteger(quantity) || quantity < 1 || quantity > 10) {
      throw new InvalidParameterError(
        "Informe uma quantidade válida entre 1 e 10. Exemplo: /sorteio 3",
      );
    }

    const metadata = await socket.groupMetadata(remoteJid);
    const botIds = new Set(
      [socket.user?.id, socket.user?.lid]
        .filter(Boolean)
        .map(normalizeJid),
    );

    const participants = (metadata.participants || [])
      .filter((participant) => participant?.id)
      .filter((participant) => !botIds.has(normalizeJid(participant.id)));

    if (participants.length < quantity) {
      throw new WarningError(
        `O grupo tem apenas ${participants.length} participante(s) elegível(is) para esse sorteio.`,
      );
    }

    const winners = shuffle(participants).slice(0, quantity);
    const mentions = winners.map((participant) => participant.id);
    const winnerLines = winners.map(
      (participant, index) => `${index + 1}. @${participant.id.split("@")[0]}`,
    );

    await sendReply(
      `🎉 *SORTEIO REALIZADO!*

🏆 *${quantity === 1 ? "Ganhador" : "Ganhadores"}:*
${winnerLines.join("\n")}

👥 Participantes elegíveis: ${participants.length}
🍀 Boa sorte e parabéns!`,
      mentions,
    );
  },
};
