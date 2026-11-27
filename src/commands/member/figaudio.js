import { execFile } from "node:child_process";
import fs from "node:fs";
import { BOT_EMOJI, BOT_NAME, PREFIX } from "../../config.js";
import { InvalidParameterError, WarningError } from "../../errors/index.js";
import {
  MAX_AUDIO_STICKER_SECONDS,
  sendAudioSticker,
} from "../../services/audioSticker.js";
import { getRandomName, getUserName, removeFileIfExists } from "../../utils/index.js";
import { errorLog } from "../../utils/logger.js";

// A imagem fica temporariamente associada ao autor e ao grupo até chegar o áudio.
const pendingImages = new Map();
const IMAGE_TTL_MS = 3 * 60 * 1000;

function getSessionKey(remoteJid, userLid, webMessage) {
  const sender = userLid || webMessage?.key?.participant || webMessage?.key?.participantAlt;
  if (!remoteJid || !sender) {
    throw new WarningError("Não consegui identificar o grupo e o autor da mídia.");
  }
  return `${remoteJid}:${sender}`;
}

function hasAudioStream(filePath) {
  return new Promise((resolve) => {
    execFile(
      "ffprobe",
      ["-v", "error", "-select_streams", "a", "-show_entries", "stream=index", "-of", "csv=p=0", filePath],
      (error, stdout) => resolve(!error && stdout.trim().length > 0),
    );
  });
}

function clearPendingImage(key) {
  const pending = pendingImages.get(key);
  if (!pending) return;
  clearTimeout(pending.timeout);
  removeFileIfExists(pending.path);
  pendingImages.delete(key);
}

export default {
  name: "figaudio",
  description: `Cria uma figurinha com som nativa do WhatsApp (até ${MAX_AUDIO_STICKER_SECONDS}s de som).`,
  commands: ["figaudio", "som", "figsom", "sticker-audio", "figurinha-audio"],
  usage: `${PREFIX}som (envie ou responda a um vídeo com som) ou ${PREFIX}som em uma imagem e depois em um áudio`,
  cooldownSeconds: 5,
  /**
   * Formas de uso:
   * - Vídeo com som: envie o vídeo com /som na legenda ou responda a ele com
   *   /som. O bot cria uma figurinha animada com o som do vídeo.
   * - Imagem + áudio: responda a uma imagem com /som e, em até 3 minutos,
   *   responda a um áudio com /som. O bot cria a figurinha com esse som.
   *
   * A figurinha é enviada no formato nativo de figurinha com som
   * (veja src/services/audioSticker.js), em uma única mensagem.
   */
  handle: async ({
    isImage,
    isAudio,
    isVideo,
    webMessage,
    remoteJid,
    userLid,
    downloadImage,
    downloadAudio,
    downloadVideo,
    sendReply,
    sendWaitReact,
    sendSuccessReact,
    socket,
  }) => {
    const key = getSessionKey(remoteJid, userLid, webMessage);

    const metadata = {
      username: getUserName(webMessage, userLid),
      botName: `${BOT_EMOJI} ${BOT_NAME}`,
    };

    // Vídeo com som: vira figurinha animada com o som do próprio vídeo,
    // tudo em uma única figurinha nativa (igual às criadas pelo WhatsApp).
    if (isVideo) {
      await sendWaitReact();
      let videoPath = null;

      try {
        try {
          videoPath = await downloadVideo(webMessage, getRandomName());
        } catch (error) {
          errorLog(`Erro ao baixar vídeo para figurinha com som: ${error.message}`);
        }

        if (!videoPath || !fs.existsSync(videoPath) || !fs.statSync(videoPath).size) {
          throw new WarningError(
            "Não consegui baixar esse vídeo do WhatsApp. Se ele for antigo ou encaminhado muitas vezes, envie o vídeo de novo com /som na legenda.",
          );
        }

        if (!(await hasAudioStream(videoPath))) {
          throw new WarningError(
            "Esse vídeo não tem som! Envie um vídeo com áudio para criar a figurinha com som.",
          );
        }

        await sendAudioSticker({
          socket,
          remoteJid,
          visualPath: videoPath,
          animated: true,
          audioPath: videoPath,
          metadata,
          quoted: webMessage,
        });
        await sendSuccessReact();
      } catch (error) {
        if (error instanceof WarningError) throw error;
        errorLog(`Erro ao criar figurinha com som: ${error.message}`);
        throw new WarningError(
          `Não consegui transformar esse vídeo em figurinha com som.\n\n📄 *Motivo:* falha ao ${error.message}`,
        );
      } finally {
        removeFileIfExists(videoPath);
      }
      return;
    }

    if (isImage && !isAudio) {
      await sendWaitReact();
      const imagePath = await downloadImage(webMessage, getRandomName());
      if (!imagePath || !fs.existsSync(imagePath)) {
        throw new WarningError("Não consegui baixar a imagem. Tente novamente.");
      }

      clearPendingImage(key);
      const pending = { path: imagePath, timeout: null };
      pending.timeout = setTimeout(() => {
        if (pendingImages.get(key) === pending) {
          removeFileIfExists(pending.path);
          pendingImages.delete(key);
        }
      }, IMAGE_TTL_MS);
      pending.timeout.unref?.();
      pendingImages.set(key, pending);

      await sendReply(
        `🖼️ Imagem guardada! Agora responda ao áudio desejado com ${PREFIX}som em até 3 minutos para criar a figurinha com som.`
      );
      return;
    }

    if (isAudio && !isImage) {
      const pending = pendingImages.get(key);
      if (!pending || !fs.existsSync(pending.path)) {
        throw new InvalidParameterError(
          `Primeiro responda a uma imagem com ${PREFIX}som. Depois responda ao áudio com ${PREFIX}som em até 3 minutos.`
        );
      }

      await sendWaitReact();
      let audioPath = null;

      try {
        audioPath = await downloadAudio(webMessage, getRandomName());
        if (!audioPath || !fs.existsSync(audioPath)) {
          throw new WarningError("Não consegui baixar o áudio. Tente outro arquivo.");
        }

        await sendAudioSticker({
          socket,
          remoteJid,
          visualPath: pending.path,
          animated: false,
          audioPath,
          metadata,
          quoted: webMessage,
        });
        await sendSuccessReact();
      } catch (error) {
        if (error instanceof WarningError) throw error;
        errorLog(`Erro ao criar figurinha com som: ${error.message}`);
        throw new WarningError(
          `Não consegui criar a figurinha com som.\n\n📄 *Motivo:* falha ao ${error.message}`,
        );
      } finally {
        clearPendingImage(key);
        removeFileIfExists(audioPath);
      }
      return;
    }

    throw new InvalidParameterError(
      `Envie ou responda a um vídeo com som usando ${PREFIX}som. Ou responda a uma imagem com ${PREFIX}som e depois a um áudio com ${PREFIX}som (a imagem fica guardada por 3 minutos).`
    );
  },
};
