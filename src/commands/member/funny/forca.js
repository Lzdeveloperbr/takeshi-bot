import { randomInt } from "node:crypto";
import { PREFIX } from "../../../config.js";
import { FORCA } from "../../../data/diversao.js";
import { getPrefix } from "../../../utils/database.js";
import { addCoins, formatCoins } from "../../../utils/economy.js";
import { addPoint, endGame, getGame, startGame } from "../../../utils/games.js";
import { onlyNumbers } from "../../../utils/index.js";

const MAX_ERRORS = 6;
const REWARD = 80;

const STAGES = [
  ["  ", "  ", "  "],
  [" O", "  ", "  "],
  [" O", " |", "  "],
  [" O", "/|", "  "],
  [" O", "/|\\", "  "],
  [" O", "/|\\", "/ "],
  [" O", "/|\\", "/ \\"],
];

const normalize = (text) =>
  text.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").trim();

export function maskWord(word, guessed) {
  return [...word].map((letter) => (/[a-z]/.test(letter) && !guessed.has(letter) ? "_" : letter)).join(" ");
}

function board(game) {
  const [head, body, legs] = STAGES[game.errors];
  const wrong = [...game.wrongLetters].join(" ").toUpperCase() || "-";

  return `\`\`\`
 +---+
 |  ${head}
 |  ${body}
 |  ${legs}
===
\`\`\`
🏷️ Dica: *${game.category}*
🔤 ${maskWord(game.word, game.guessed).toUpperCase()}
❌ Erradas: ${wrong} (${game.errors}/${MAX_ERRORS})`;
}

/**
 * Aplica um palpite (letra ou palavra inteira).
 * @returns {"repeated" | "hit" | "miss" | "won" | "lost"}
 */
export function guess(game, input) {
  const attempt = normalize(input);

  if (attempt.length > 1) {
    if (attempt === game.word) {
      for (const letter of game.word) game.guessed.add(letter);
      return "won";
    }

    game.errors = Math.min(MAX_ERRORS, game.errors + 2);
    return game.errors >= MAX_ERRORS ? "lost" : "miss";
  }

  if (game.guessed.has(attempt) || game.wrongLetters.has(attempt)) {
    return "repeated";
  }

  if (game.word.includes(attempt)) {
    game.guessed.add(attempt);
    return [...game.word].every((letter) => !/[a-z]/.test(letter) || game.guessed.has(letter)) ? "won" : "hit";
  }

  game.wrongLetters.add(attempt);
  game.errors++;
  return game.errors >= MAX_ERRORS ? "lost" : "miss";
}

export default {
  name: "forca",
  description: "Jogo da forca: adivinhe a palavra letra por letra.",
  commands: ["forca", "hangman"],
  usage: `${PREFIX}forca (começa) | ${PREFIX}forca a (letra) | ${PREFIX}forca palavra (chuta a palavra)`,
  cooldownSeconds: 1,
  /**
   * @param {CommandHandleProps} props
   */
  handle: async ({ fullArgs, remoteJid, userLid, sendReply, sendText, sendReact }) => {
    const prefix = getPrefix(remoteJid);
    const input = (fullArgs || "").trim();
    let game = getGame(remoteJid, "forca");

    if (!game) {
      const categories = Object.keys(FORCA);
      const category = categories[randomInt(categories.length)];
      const words = FORCA[category];

      game = startGame(remoteJid, "forca", {
        category,
        word: normalize(words[randomInt(words.length)]),
        guessed: new Set(),
        wrongLetters: new Set(),
        errors: 0,
      });

      // Um chute sem jogo valendo não é aplicado à palavra nova (ninguém a viu ainda).
      const notice = input
        ? "Não havia jogo valendo (um jogo termina após 5 minutos sem jogadas). Comecei um novo!\n\n"
        : "";

      await sendReact("🪢");
      await sendReply(
        `${notice}🪢 *JOGO DA FORCA*\n\n${board(game)}\n\nChute uma letra com *${prefix}forca a* ou a palavra inteira com *${prefix}forca palavra*.\nErrar a palavra inteira conta 2 erros. Quem completar ganha *${REWARD}* moedas!`,
      );
      return;
    }

    if (!input) {
      await sendReply(`🪢 Jogo em andamento:\n\n${board(game)}`);
      return;
    }

    if (!/^[\p{L}-]+$/u.test(input)) {
      await sendReply(`Chute só letras! Exemplo: ${prefix}forca a`);
      return;
    }

    const result = guess(game, input);

    if (result === "repeated") {
      await sendReply(`Essa letra já foi! 😅\n\n${board(game)}`);
      return;
    }

    if (result === "won") {
      endGame(remoteJid, "forca");
      const points = addPoint(remoteJid, userLid, 2);
      addCoins(remoteJid, userLid, REWARD);

      await sendReact("🎉");
      await sendText(
        `🎉 @${onlyNumbers(userLid)} acertou! A palavra era *${game.word.toUpperCase()}*\n🏅 Pontos: *${points}* | 💰 +${formatCoins(REWARD)}`,
        [userLid],
      );
      return;
    }

    if (result === "lost") {
      endGame(remoteJid, "forca");
      await sendReact("💀");
      await sendReply(`${board(game)}\n\n💀 *Enforcado!* A palavra era *${game.word.toUpperCase()}*.\nJogue de novo com ${prefix}forca`);
      return;
    }

    await sendReact(result === "hit" ? "✅" : "❌");
    await sendReply(board(game));
  },
};
