import { PREFIX } from "../../config.js";
import { InvalidParameterError, WarningError } from "../../errors/index.js";
import {
  isActiveGroupRestriction,
  updateIsActiveGroupRestriction,
} from "../../utils/database.js";
import { isFalse, isTrue } from "../../utils/index.js";

export default {
  name: "anti-flood",
  description:
    "Ativa/desativa o anti-flood: avisa quem manda mensagens rápido demais e silencia se continuar (7 msgs em 10s = aviso, 12 = silenciado).",
  commands: ["anti-flood"],
  usage: `${PREFIX}anti-flood (1/0)`,
  /**
   * @param {CommandHandleProps} props
   */
  handle: async ({ remoteJid, isGroup, args, sendSuccessReply }) => {
    if (!isGroup) {
      throw new WarningError("Este comando só deve ser usado em grupos!");
    }

    const turnOn = isTrue(args[0]);
    const turnOff = isFalse(args[0]);

    if (!turnOn && !turnOff) {
      throw new InvalidParameterError("Você precisa digitar 1 ou 0 (ligar ou desligar)!");
    }

    if (turnOn === isActiveGroupRestriction(remoteJid, "anti-flood")) {
      throw new WarningError(
        `O Anti-flood já está ${turnOn ? "ativado" : "desativado"}!`,
      );
    }

    updateIsActiveGroupRestriction(remoteJid, "anti-flood", turnOn);

    await sendSuccessReply(
      `Anti-flood ${turnOn ? "ativado" : "desativado"} com sucesso!${turnOn ? `\n\nAdmins não são afetados.` : ""}`,
    );
  },
};
