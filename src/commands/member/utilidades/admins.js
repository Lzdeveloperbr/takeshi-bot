import { PREFIX } from "../../../config.js";
import { WarningError } from "../../../errors/index.js";
import { onlyNumbers } from "../../../utils/index.js";

export default {
  name: "admins",
  description: "Lista e marca os administradores do grupo (use para chamar um admin).",
  commands: ["admins", "adms", "chamar-adm"],
  usage: `${PREFIX}admins motivo`,
  /**
   * @param {CommandHandleProps} props
   */
  handle: async ({ isGroup, getGroupAdmins, fullArgs, sendText, sendReact }) => {
    if (!isGroup) {
      throw new WarningError("Este comando só funciona em grupos.");
    }

    const admins = await getGroupAdmins();

    if (!admins.length) {
      throw new WarningError("Não encontrei administradores neste grupo.");
    }

    const list = admins.map((id) => `▢ • @${onlyNumbers(id)}`).join("\n");
    const reason = fullArgs?.trim() ? `\n\n📝 *Motivo:* ${fullArgs.trim()}` : "";

    await sendReact("👮");
    await sendText(`👮 *Administradores do grupo (${admins.length})*\n\n${list}${reason}`, admins);
  },
};
