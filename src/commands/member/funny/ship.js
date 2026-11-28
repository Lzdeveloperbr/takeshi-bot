import { createHash } from "node:crypto";
import { PREFIX } from "../../../config.js";
import { InvalidParameterError } from "../../../errors/index.js";
import { onlyNumbers } from "../../../utils/index.js";
import { getMentionedJids } from "../../../utils/mentions.js";

function toLid(value, domain = "lid") {
  const digits = onlyNumbers(value || "");
  return digits ? `${digits}@${domain}` : null;
}

// Resultado fixo para o mesmo casal (não muda a cada vez que roda).
function compatibility(a, b) {
  const [first, second] = [a, b].sort();
  const hash = createHash("sha256").update(`${first}|${second}|takeshi`).digest();
  return hash.readUInt16BE(0) % 101;
}

function verdict(percent) {
  if (percent >= 90) return "💍 Almas gêmeas! Já pode marcar o casamento!";
  if (percent >= 70) return "😍 Combinam muito! Rola um date!";
  if (percent >= 50) return "😊 Tem química, vale a tentativa!";
  if (percent >= 30) return "😅 Hmm... só amizade, talvez?";
  return "💔 Melhor nem tentar...";
}

export default {
  name: "ship",
  description: "Calcula a compatibilidade entre duas pessoas.",
  commands: ["ship", "casal", "compatibilidade"],
  usage: `${PREFIX}ship @pessoa1 @pessoa2 (ou responda a alguém com ${PREFIX}ship)`,
  /**
   * @param {CommandHandleProps} props
   */
  handle: async ({ fullArgs, userLid, replyLid, isReply, webMessage, sendText, sendReact }) => {
    // Prefere as menções reais do WhatsApp; senão, os "@número" digitados.
    const domain = userLid?.split("@")[1] || "lid";
    const fromMentions = getMentionedJids(webMessage);
    const mentioned = fromMentions.length
      ? fromMentions
      : (fullArgs?.match(/@\d{6,}/g) || []).map((m) => toLid(m, domain)).filter(Boolean);

    let first;
    let second;

    if (mentioned.length >= 2) {
      [first, second] = mentioned;
    } else if (mentioned.length === 1) {
      [first, second] = [userLid, mentioned[0]];
    } else if (isReply && replyLid) {
      [first, second] = [userLid, replyLid];
    } else {
      throw new InvalidParameterError(
        `Marque duas pessoas ou responda a alguém!\nExemplo: ${PREFIX}ship @pessoa1 @pessoa2`,
      );
    }

    const percent = compatibility(first, second);
    const filled = Math.round(percent / 10);
    const bar = "❤️".repeat(filled) + "🤍".repeat(10 - filled);

    await sendReact("💘");
    await sendText(
      `💘 *SHIP* 💘\n\n@${onlyNumbers(first)} ❤️ @${onlyNumbers(second)}\n\n${bar}\n*${percent}%* de compatibilidade\n\n${verdict(percent)}`,
      [first, second],
    );
  },
};
