import fs from "node:fs";
import { PREFIX } from "../../config.js";
import { InvalidParameterError, WarningError } from "../../errors/index.js";
import { getRandomName, removeFileIfExists } from "../../utils/index.js";
import { errorLog } from "../../utils/logger.js";

export default {
  name: "set-foto",
  description: "Muda a foto do grupo (envie ou responda a uma imagem).",
  commands: ["set-foto", "foto-grupo", "mudar-foto", "set-group-photo"],
  usage: `${PREFIX}set-foto (envie ou responda a uma imagem)`,
  /**
   * @param {CommandHandleProps} props
   */
  handle: async ({ isImage, isGroup, webMessage, remoteJid, socket, downloadImage, sendWaitReact, sendSuccessReply }) => {
    if (!isGroup) {
      throw new WarningError("Este comando só deve ser usado em grupos!");
    }

    if (!isImage) {
      throw new InvalidParameterError("Envie ou responda a uma imagem com o comando!");
    }

    await sendWaitReact();

    let imagePath;
    try {
      imagePath = await downloadImage(webMessage, getRandomName());
      await socket.updateProfilePicture(remoteJid, fs.readFileSync(imagePath));
    } catch (error) {
      errorLog(`Erro ao mudar foto do grupo: ${error.message}`);
      throw new WarningError("Não consegui mudar a foto. Verifique se eu sou administrador!");
    } finally {
      removeFileIfExists(imagePath);
    }

    await sendSuccessReply("Foto do grupo atualizada!");
  },
};
