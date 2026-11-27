import { PREFIX } from "../../config.js";
import { WarningError } from "../../errors/index.js";
import { getActivity } from "../../utils/activity.js";
import { onlyNumbers } from "../../utils/index.js";

const TITLES = [
  [0, "🥚 Novato"],
  [3, "🐣 Iniciante"],
  [6, "🐥 Participativo"],
  [10, "🦅 Veterano"],
  [15, "🔥 Lenda do grupo"],
  [20, "👑 Imortal"],
];

/** Nível = raiz quadrada de (mensagens / 10). Cada nível pede mais mensagens que o anterior. */
export function levelFromMessages(messages) {
  const level = Math.floor(Math.sqrt(messages / 10));
  const current = level ** 2 * 10;
  const next = (level + 1) ** 2 * 10;
  const title = [...TITLES].reverse().find(([min]) => level >= min)[1];

  return { level, title, progress: (messages - current) / (next - current), missing: next - messages };
}

export default {
  name: "nivel",
  description: "Mostra seu nível no grupo (sobe conforme você conversa).",
  commands: ["nivel", "nível", "level", "xp"],
  usage: `${PREFIX}nivel (ou ${PREFIX}nivel @pessoa)`,
  /**
   * @param {CommandHandleProps} props
   */
  handle: async ({ isGroup, remoteJid, userLid, args, isReply, replyLid, sendText, sendReact }) => {
    if (!isGroup) {
      throw new WarningError("Este comando só funciona em grupos.");
    }

    const target = isReply && replyLid ? replyLid : args[0] && onlyNumbers(args[0]) ? `${onlyNumbers(args[0])}@lid` : userLid;
    const { members } = getActivity(remoteJid);
    const messages = members[target] || 0;
    const { level, title, progress, missing } = levelFromMessages(messages);

    const filled = Math.round(progress * 10);
    const bar = "🟩".repeat(filled) + "⬜".repeat(10 - filled);

    await sendReact("⭐");
    await sendText(
      `⭐ *Nível de @${onlyNumbers(target)}*\n\n🎖️ Nível *${level}* — ${title}\n${bar} ${Math.round(progress * 100)}%\n💬 ${messages} mensagens\n⏫ Faltam *${missing}* mensagens para o nível ${level + 1}`,
      [target],
    );
  },
};
