import { PREFIX } from "../../config.js";
import { InvalidParameterError, WarningError } from "../../errors/index.js";
import { setCommandDisabled } from "../../utils/database.js";
import { findCommandImport, formatCommand } from "../../utils/index.js";

export default {
  name: "desativar-cmd",
  description: "Desativa um comando de membro neste grupo (admins ainda podem usar).",
  commands: ["desativar-cmd", "desativar-comando", "bloquear-cmd"],
  usage: `${PREFIX}desativar-cmd apostar`,
  /**
   * @param {CommandHandleProps} props
   */
  handle: async ({ args, isGroup, remoteJid, sendSuccessReply }) => {
    if (!isGroup) {
      throw new WarningError("Este comando só deve ser usado em grupos!");
    }

    const name = (args[0] || "").trim().replace(/^\W+/, "");

    if (!name) {
      throw new InvalidParameterError(`Informe o comando! Exemplo: ${PREFIX}desativar-cmd apostar`);
    }

    const { type, command } = await findCommandImport(formatCommand(name));

    if (!command) {
      throw new WarningError(`O comando "${name}" não existe.`);
    }

    if (type !== "member") {
      throw new WarningError("Só dá para desativar comandos de membros (não os de admin ou do dono).");
    }

    if (!setCommandDisabled(remoteJid, command.name, true)) {
      throw new WarningError(`O comando ${command.name} já está ${true ? "desativado" : "ativado"} neste grupo.`);
    }

    await sendSuccessReply(`Comando *${command.name}* desativado neste grupo.`);
  },
};
