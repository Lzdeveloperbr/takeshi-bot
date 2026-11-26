import { randomInt } from "node:crypto";
import { PREFIX } from "../../../config.js";
import { InvalidParameterError, WarningError } from "../../../errors/index.js";
import { onlyNumbers } from "../../../utils/index.js";

const MEDALS = ["🥇", "🥈", "🥉", "4️⃣", "5️⃣"];

export default {
  name: "top5",
  description: "Sorteia um top 5 do grupo com o tema que você escolher.",
  commands: ["top5", "top-5"],
  usage: `${PREFIX}top5 mais dorminhocos`,
  /**
   * @param {CommandHandleProps} props
   */
  handle: async ({ fullArgs, isGroup, getGroupParticipants, socket, sendText, sendReact }) => {
    if (!isGroup) {
      throw new WarningError("Este comando só funciona em grupos.");
    }

    const theme = fullArgs?.trim().slice(0, 80);

    if (!theme) {
      throw new InvalidParameterError(`Escolha um tema! Exemplo: ${PREFIX}top5 mais dorminhocos`);
    }

    const botId = socket.user?.lid?.replace(/:[0-9]+(?=@)/, "");
    const members = (await getGroupParticipants()).map((p) => p.id).filter((id) => id !== botId);

    for (let i = members.length - 1; i > 0; i--) {
      const j = randomInt(i + 1);
      [members[i], members[j]] = [members[j], members[i]];
    }

    const top = members.slice(0, 5);

    await sendReact("🏆");
    await sendText(
      `🏆 *TOP ${top.length} ${theme.toUpperCase()}*\n\n${top.map((id, i) => `${MEDALS[i]} @${onlyNumbers(id)}`).join("\n")}\n\n_É só brincadeira! 😄_`,
      top,
    );
  },
};
