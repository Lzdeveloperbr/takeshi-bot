import { PREFIX } from "../../config.js";
import { InvalidParameterError } from "../../errors/index.js";

export default {
  name: "enquete",
  description: "Cria uma enquete (votação) no grupo.",
  commands: ["enquete", "votacao", "votação", "poll"],
  usage: `${PREFIX}enquete Pergunta | opção 1 | opção 2 | opção 3`,
  /**
   * @param {CommandHandleProps} props
   */
  handle: async ({ fullArgs, socket, remoteJid }) => {
    // Separa só por "|" (a barra "/" pode fazer parte do texto).
    const [question, ...options] = (fullArgs || "")
      .split("|")
      .map((part) => part.trim())
      .filter(Boolean);

    const uniqueOptions = [...new Set(options)];

    if (!question || uniqueOptions.length < 2) {
      throw new InvalidParameterError(
        `Use: ${PREFIX}enquete Pergunta | opção 1 | opção 2\nExemplo: ${PREFIX}enquete Pizza ou hambúrguer? | Pizza | Hambúrguer`,
      );
    }

    if (uniqueOptions.length > 12) {
      throw new InvalidParameterError("A enquete pode ter no máximo 12 opções.");
    }

    await socket.sendMessage(remoteJid, {
      poll: {
        name: question.slice(0, 255),
        values: uniqueOptions.map((option) => option.slice(0, 100)),
        selectableCount: 1,
      },
    });
  },
};
