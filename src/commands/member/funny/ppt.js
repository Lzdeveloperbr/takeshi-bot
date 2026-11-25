import { randomInt } from "node:crypto";
import { PREFIX } from "../../../config.js";
import { InvalidParameterError } from "../../../errors/index.js";

const MOVES = {
  pedra: { emoji: "🪨", beats: "tesoura" },
  papel: { emoji: "📄", beats: "pedra" },
  tesoura: { emoji: "✂️", beats: "papel" },
};

const ALIASES = { pedra: "pedra", rock: "pedra", papel: "papel", paper: "papel", tesoura: "tesoura", scissors: "tesoura" };

export default {
  name: "ppt",
  description: "Jogue pedra, papel ou tesoura contra o bot.",
  commands: ["ppt", "pedra-papel-tesoura", "jokenpo"],
  usage: `${PREFIX}ppt pedra | papel | tesoura`,
  /**
   * @param {CommandHandleProps} props
   */
  handle: async ({ args, sendReply, sendReact }) => {
    const player = ALIASES[(args[0] || "").trim().toLowerCase()];

    if (!player) {
      throw new InvalidParameterError(`Escolha pedra, papel ou tesoura!\nExemplo: ${PREFIX}ppt pedra`);
    }

    const names = Object.keys(MOVES);
    const bot = names[randomInt(names.length)];

    let result;
    let reaction;
    if (player === bot) {
      result = "🤝 *Empate!*";
      reaction = "🤝";
    } else if (MOVES[player].beats === bot) {
      result = "🏆 *Você ganhou!*";
      reaction = "🏆";
    } else {
      result = "😎 *Eu ganhei!*";
      reaction = "😎";
    }

    await sendReact(reaction);
    await sendReply(
      `Você: ${MOVES[player].emoji} ${player}\nBot: ${MOVES[bot].emoji} ${bot}\n\n${result}`,
    );
  },
};
