import { randomInt } from "node:crypto";
import { PREFIX } from "../../../config.js";
import { InvalidParameterError } from "../../../errors/index.js";

const ANSWERS = [
  "Com certeza! ✅",
  "Sim! 😄",
  "Pode apostar! 💯",
  "Os sinais apontam que sim. 🔮",
  "Provavelmente sim. 🙂",
  "Talvez... 🤔",
  "Pergunte de novo mais tarde. ⏳",
  "Melhor não te dizer agora. 🤐",
  "Não conte com isso. 😬",
  "Acho que não. 🙃",
  "Não! ❌",
  "De jeito nenhum! 🚫",
];

export default {
  name: "pergunta",
  description: "Faça uma pergunta de sim ou não e o bot responde (bola 8 mágica).",
  commands: ["pergunta", "8ball", "bola8", "responda"],
  usage: `${PREFIX}pergunta vou ficar rico?`,
  /**
   * @param {CommandHandleProps} props
   */
  handle: async ({ fullArgs, sendReply, sendReact }) => {
    const question = fullArgs?.trim();

    if (!question) {
      throw new InvalidParameterError(`Faça uma pergunta! Exemplo: ${PREFIX}pergunta vou ficar rico?`);
    }

    await sendReact("🎱");
    await sendReply(`🎱 *Pergunta:* ${question}\n\n*Resposta:* ${ANSWERS[randomInt(ANSWERS.length)]}`);
  },
};
