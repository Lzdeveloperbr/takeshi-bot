import { PREFIX } from "../../config.js";
import { InvalidParameterError, WarningError } from "../../errors/index.js";
import { setCommandDisabled } from "../../utils/database.js";
import { findCommandImport, formatCommand } from "../../utils/index.js";

export default {
  name: "ativar-cmd",
  description: "Reativa um comando que foi desativado neste grupo.",
  commands: ["ativar-cmd", "ativar-comando", "liberar-cmd"],
  usage: `${PREFIX}ativar-cmd apostar`,
  /**
   * @param {CommandHandleProps} props
   */
  handle: async ({ args, isGroup, remoteJid, sendSuccessReply }) => {
    if (!isGroup) {
      throw new WarningError("Este comando só deve ser usado em grupos!");
    }

    const name = (args[0] || "").trim().replace(/^\W+/, "");

    if (!name) {
      throw new InvalidParameterError(`Informe o comando! Exemplo: ${PREFIX}ativar-cmd apostar`);
    }

    const { type, command } = await findCommandImport(formatCommand(name));

    if (!command) {
      throw new WarningError(`O comando "${name}" não existe.`);
    }

    if (type !== "member") {
      throw new WarningError("Só dá para desativar comandos de membros (não os de admin ou do dono).");
    }

    if (!setCommandDisabled(remoteJid, command.name, false)) {
      throw new WarningError(`O comando ${command.name} já está ${false ? "desativado" : "ativado"} neste grupo.`);
    }

    await sendSuccessReply(`Comando *${command.name}* ativado de novo neste grupo.`);
  },
};
