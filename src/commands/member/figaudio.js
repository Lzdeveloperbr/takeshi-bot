import fs from "node:fs";
import path from "node:path";
import { exec } from "node:child_process";
import { PREFIX, BOT_EMOJI, BOT_NAME, TEMP_DIR } from "../../config.js";
import { InvalidParameterError, WarningError } from "../../errors/index.js";
import { processStaticSticker } from "../../services/sticker.js";
import { getRandomName, getUserName, removeFileIfExists } from "../../utils/index.js";

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

function clearPendingImage(key) {
  const pending = pendingImages.get(key);
  if (!pending) return;
  clearTimeout(pending.timeout);
  removeFileIfExists(pending.path);
  pendingImages.delete(key);
}

export default {
  name: "figaudio",
  description: "Cria uma figurinha e envia o áudio correspondente em seguida.",
  commands: ["figaudio", "sticker-audio", "figurinha-audio"],
  usage: `${PREFIX}figaudio (envie um vídeo com áudio ou responda primeiro à imagem e depois ao áudio)`,
  /**
   * Fluxo em duas etapas:
   * 1. Responda a uma imagem com /figaudio.
   * 2. Responda a um áudio com /figaudio dentro de até 3 minutos.
   *
   * Baileys ainda não implementa o novo contêiner nativo de figurinha sonora;
   * por isso o bot envia a figurinha e o áudio como duas mensagens consecutivas.
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
    sendStickerFromFile,
    sendAudioFromFile,
  }) => {
    const key = getSessionKey(remoteJid, userLid, webMessage);

    // Um único vídeo com imagem e áudio: extrai um quadro para a figurinha
    // e a faixa sonora para enviar as duas mídias em sequência.
    if (isVideo) {
      await sendWaitReact();
      let videoPath = null;
      let imagePath = null;
      let audioPath = null;
      let stickerPath = null;

      const runFfmpeg = (command) =>
        new Promise((resolve, reject) => {
          exec(command, (error, _stdout, stderr) => {
            if (error) {
              reject(new Error(stderr || error.message));
            } else {
              resolve();
            }
          });
        });

      try {
        videoPath = await downloadVideo(webMessage, getRandomName("mp4"));
        if (!videoPath || !fs.existsSync(videoPath)) {
          throw new WarningError("Não consegui baixar o vídeo. Tente novamente.");
        }

        imagePath = path.resolve(TEMP_DIR, getRandomName("png"));
        audioPath = path.resolve(TEMP_DIR, getRandomName("mp3"));

        await runFfmpeg(
          `ffmpeg -y -i "${videoPath}" -frames:v 1 -q:v 2 "${imagePath}"`,
        );
        await runFfmpeg(
          `ffmpeg -y -i "${videoPath}" -vn -c:a libmp3lame -q:a 4 "${audioPath}"`,
        );

        if (!fs.existsSync(imagePath) || !fs.existsSync(audioPath)) {
          throw new WarningError(
            "O vídeo precisa conter imagem e áudio. Envie outro vídeo.",
          );
        }

        const metadata = {
          username: getUserName(webMessage, userLid),
          botName: `${BOT_EMOJI} ${BOT_NAME}`,
        };
        stickerPath = await processStaticSticker(imagePath, metadata);
        await sendStickerFromFile(stickerPath, true);
        await sendAudioFromFile(audioPath, false);
        await sendSuccessReact();
      } catch (error) {
        if (error instanceof WarningError) throw error;
        throw new WarningError(
          "Não consegui transformar esse vídeo em figurinha com áudio. Confira se ele tem som e tente novamente.",
        );
      } finally {
        removeFileIfExists(videoPath);
        removeFileIfExists(imagePath);
        removeFileIfExists(audioPath);
        removeFileIfExists(stickerPath);
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
        "🖼️ Imagem guardada! Agora responda ao áudio desejado com /figaudio em até 3 minutos. Vou enviar a figurinha e, logo depois, o áudio."
      );
      return;
    }

    if (isAudio && !isImage) {
      const pending = pendingImages.get(key);
      if (!pending || !fs.existsSync(pending.path)) {
        throw new InvalidParameterError(
          "Primeiro responda a uma imagem com /figaudio. Depois responda ao áudio com /figaudio em até 3 minutos."
        );
      }

      await sendWaitReact();
      let audioPath = null;
      let stickerPath = null;

      try {
        audioPath = await downloadAudio(webMessage, getRandomName());
        if (!audioPath || !fs.existsSync(audioPath)) {
          throw new WarningError("Não consegui baixar o áudio. Tente outro arquivo.");
        }

        const metadata = {
          username: getUserName(webMessage, userLid),
          botName: `${BOT_EMOJI} ${BOT_NAME}`,
        };
        stickerPath = await processStaticSticker(pending.path, metadata);

        // As duas mídias são enviadas em sequência, não como um sticker sonoro nativo.
        await sendStickerFromFile(stickerPath, true);
        await sendAudioFromFile(audioPath, false);
        await sendSuccessReact();
      } finally {
        clearPendingImage(key);
        removeFileIfExists(audioPath);
        removeFileIfExists(stickerPath);
      }
      return;
    }

    throw new InvalidParameterError(
      "Use em duas etapas: responda primeiro a uma imagem com /figaudio; depois responda ao áudio com /figaudio. A imagem fica guardada por 3 minutos."
    );
  },
};
