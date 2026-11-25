import { PREFIX } from "../../config.js";
import { WarningError } from "../../errors/index.js";
import { getGroupRules } from "../../utils/database.js";

export default {
  name: "regras",
  description: "Mostra as regras do grupo definidas pelos administradores.",
  commands: ["regras", "rules"],
  usage: `${PREFIX}regras`,
  /**
   * @param {CommandHandleProps} props
   */
  handle: async ({ isGroup, remoteJid, sendReply, sendReact }) => {
    if (!isGroup) {
      throw new WarningError("Este comando só funciona em grupos.");
    }

    const rules = getGroupRules(remoteJid);

    if (!rules) {
      throw new WarningError(
        `Este grupo ainda não tem regras. Um admin pode definir com ${PREFIX}set-regras <texto>`,
      );
    }

    await sendReact("📜");
    await sendReply(`📜 *REGRAS DO GRUPO*\n\n${rules}`);
  },
};
