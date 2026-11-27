import { PREFIX } from "../../config.js";
import { WarningError } from "../../errors/index.js";
import { getDisabledCommands } from "../../utils/database.js";

export default {
  name: "cmds-desativados",
  description: "Lista os comandos desativados neste grupo.",
  commands: ["cmds-desativados", "comandos-desativados", "bloqueados"],
  usage: `${PREFIX}cmds-desativados`,
  /**
   * @param {CommandHandleProps} props
   */
  handle: async ({ isGroup, remoteJid, sendReply }) => {
    if (!isGroup) {
      throw new WarningError("Este comando só deve ser usado em grupos!");
    }

    const disabled = getDisabledCommands(remoteJid);

    if (!disabled.length) {
      throw new WarningError("Nenhum comando desativado neste grupo.");
    }

    await sendReply(
      `🚫 *Comandos desativados (${disabled.length})*\n\n${disabled.map((name) => `▢ ${PREFIX}${name}`).join("\n")}\n\nReative com ${PREFIX}ativar-cmd nome`,
    );
  },
};
