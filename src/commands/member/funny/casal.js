import { randomInt } from "node:crypto";
import { PREFIX } from "../../../config.js";
import { WarningError } from "../../../errors/index.js";
import { onlyNumbers } from "../../../utils/index.js";

export default {
  name: "casal",
  description: "Sorteia o casal do dia entre os membros do grupo.",
  commands: ["casal-do-dia", "casaldodia", "formar-casal"],
  usage: `${PREFIX}casal-do-dia`,
  /**
   * @param {CommandHandleProps} props
   */
  handle: async ({ isGroup, getGroupParticipants, socket, sendText, sendReact }) => {
    if (!isGroup) {
      throw new WarningError("Este comando só funciona em grupos.");
    }

    const botId = socket.user?.lid?.replace(/:[0-9]+(?=@)/, "");
    const members = (await getGroupParticipants()).map((p) => p.id).filter((id) => id !== botId);

    if (members.length < 2) {
      throw new WarningError("Preciso de pelo menos 2 membros no grupo.");
    }

    const first = members.splice(randomInt(members.length), 1)[0];
    const second = members[randomInt(members.length)];
    const percent = randomInt(50, 101);

    await sendReact("💞");
    await sendText(
      `💞 *CASAL DO DIA* 💞\n\n@${onlyNumbers(first)} ❤️ @${onlyNumbers(second)}\n\nCompatibilidade: *${percent}%*`,
      [first, second],
    );
  },
};
