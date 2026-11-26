import { PREFIX } from "../../config.js";
import { WarningError } from "../../errors/index.js";
import { getActivity } from "../../utils/activity.js";
import { onlyNumbers } from "../../utils/index.js";

const MEDALS = ["🥇", "🥈", "🥉"];

export default {
  name: "rank",
  description: "Mostra os 10 membros que mais mandaram mensagens no grupo.",
  commands: ["rank", "ranking", "top", "ativos"],
  usage: `${PREFIX}rank`,
  /**
   * @param {CommandHandleProps} props
   */
  handle: async ({ isGroup, remoteJid, userLid, sendText, sendReact }) => {
    if (!isGroup) {
      throw new WarningError("Este comando só funciona em grupos.");
    }

    const { since, members } = getActivity(remoteJid);
    const ranking = Object.entries(members).sort(([, a], [, b]) => b - a);

    if (!ranking.length) {
      throw new WarningError(
        "Ainda não tenho mensagens contadas neste grupo. A contagem começa a partir de agora!",
      );
    }

    const top = ranking.slice(0, 10);
    const lines = top.map(
      ([id, count], i) => `${MEDALS[i] || `${i + 1}º`} @${onlyNumbers(id)} — *${count}* msg`,
    );

    const myPosition = ranking.findIndex(([id]) => id === userLid);
    const footer =
      myPosition >= 10
        ? `\n\n📍 Sua posição: *${myPosition + 1}º* (${ranking[myPosition][1]} msg)`
        : "";

    const total = ranking.reduce((sum, [, count]) => sum + count, 0);

    await sendReact("🏆");
    await sendText(
      `🏆 *RANKING DE ATIVOS*\n\n${lines.join("\n")}${footer}\n\n💬 Total: ${total} mensagens\n📅 Contando desde ${new Date(since).toLocaleDateString("pt-BR")}`,
      top.map(([id]) => id),
    );
  },
};
