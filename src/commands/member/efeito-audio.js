import { PREFIX } from "../../config.js";
import { InvalidParameterError, WarningError } from "../../errors/index.js";
import { applyEffect, EFFECTS, findEffect, MAX_INPUT_SECONDS } from "../../services/audioEffects.js";
import { getPrefix } from "../../utils/database.js";
import { getRandomName, removeFileIfExists } from "../../utils/index.js";
import { errorLog } from "../../utils/logger.js";

const EFFECT_ALIASES = Object.entries(EFFECTS).flatMap(([key, effect]) => [key, ...effect.aliases]);

export default {
  name: "efeito-audio",
  description: "Edita áudios: grave, lento, rápido, nightcore, 8D, eco, voz de esquilo/robô e mais.",
  commands: ["efeito", "efeitos", "efeito-audio", ...EFFECT_ALIASES],
  usage: `Responda a um áudio ou vídeo com ${PREFIX}grave, ${PREFIX}lento, ${PREFIX}nightcore, ${PREFIX}8d... (veja todos com ${PREFIX}efeitos)`,
  cooldownSeconds: 5,
  /**
   * @param {CommandHandleProps} props
   */
  handle: async ({
    commandName,
    args,
    remoteJid,
    isAudio,
    isVideo,
    webMessage,
    downloadAudio,
    downloadVideo,
    sendReply,
    sendAudioFromFile,
    sendWaitReact,
    sendSuccessReact,
  }) => {
    const prefix = getPrefix(remoteJid);
    const isGeneric = ["efeito", "efeitos", "efeitoaudio"].includes(commandName);
    const effect = findEffect(isGeneric ? args[0] : commandName);

    if (!effect) {
      const list = Object.entries(EFFECTS)
        .map(([key, { label }]) => `▢ ${prefix}${key} — ${label}`)
        .join("\n");

      await sendReply(
        `🎛️ *EFEITOS DE ÁUDIO*\n\nResponda a um áudio (ou vídeo) com o efeito:\n\n${list}\n\n_Até ${MAX_INPUT_SECONDS / 60} minutos de áudio._`,
      );
      return;
    }

    if (!isAudio && !isVideo) {
      throw new InvalidParameterError(`Responda a um áudio ou vídeo com ${prefix}${effect.key}`);
    }

    await sendWaitReact();

    let inputPath = null;
    let outputPath = null;

    try {
      inputPath = isAudio
        ? await downloadAudio(webMessage, getRandomName())
        : await downloadVideo(webMessage, getRandomName());

      outputPath = await applyEffect(inputPath, effect);

      await sendAudioFromFile(outputPath, effect.voice);
      await sendSuccessReact();
    } catch (error) {
      errorLog(`Erro no efeito ${effect.key}: ${error.message}`);
      throw new WarningError(
        `Não consegui aplicar o efeito ${effect.label}. Confira se o áudio/vídeo tem som e tente de novo.`,
      );
    } finally {
      removeFileIfExists(inputPath);
      removeFileIfExists(outputPath);
    }
  },
};
