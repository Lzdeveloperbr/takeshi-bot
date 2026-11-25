/**
 * Figurinhas com som (sound stickers) nativas do WhatsApp.
 *
 * Formato no protocolo:
 *
 *   Message.audioStickerMessage (campo 134) -> FutureProofMessage
 *     .message (campo 1) -> Message
 *       .stickerMessage (campo 26) -> StickerMessage
 *         .audioMessage (campo 26, oneof "audio") -> AudioMessage
 *
 * O proto do Baileys 7.0.0-rc14 ainda não conhece esses dois campos, então
 * os codificadores de `Message` e `StickerMessage` são estendidos em tempo
 * de execução (sem alterar node_modules). Quando o Baileys passar a trazer
 * esses campos, basta remover `installAudioStickerProto()`.
 *
 * A figurinha e o áudio são enviados criptografados separadamente (cada um
 * com sua própria mediaKey) e o áudio vai embutido dentro da figurinha.
 */
import { generateMessageIDV2, prepareWAMessageMedia, proto } from "baileys";
import { execFile } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import webp from "node-webpmux";
import { TEMP_DIR } from "../config.js";
import { getRandomName, getRandomNumber, removeFileIfExists } from "../utils/index.js";

const AUDIO_STICKER_MESSAGE_FIELD = 134;
const STICKER_AUDIO_MESSAGE_FIELD = 26;
const LENGTH_DELIMITED = 2;

// Limites usados pelo próprio WhatsApp ao criar figurinhas com som.
export const MAX_AUDIO_STICKER_SECONDS = 10;
const MAX_STICKER_BYTES = 1024 * 1024;

const INSTALLED = Symbol.for("takeshi.audioStickerProto");

export function installAudioStickerProto() {
  if (proto.Message[INSTALLED]) {
    return;
  }

  const originalMessageEncode = proto.Message.encode;
  proto.Message.encode = function encode(message, writer) {
    const w = originalMessageEncode.call(this, message, writer);

    if (message?.audioStickerMessage) {
      proto.Message.FutureProofMessage.encode(
        message.audioStickerMessage,
        w.uint32((AUDIO_STICKER_MESSAGE_FIELD << 3) | LENGTH_DELIMITED).fork(),
      ).ldelim();
    }

    return w;
  };

  const originalStickerEncode = proto.Message.StickerMessage.encode;
  proto.Message.StickerMessage.encode = function encode(message, writer) {
    const w = originalStickerEncode.call(this, message, writer);

    if (message?.audioMessage) {
      proto.Message.AudioMessage.encode(
        message.audioMessage,
        w.uint32((STICKER_AUDIO_MESSAGE_FIELD << 3) | LENGTH_DELIMITED).fork(),
      ).ldelim();
    }

    return w;
  };

  proto.Message[INSTALLED] = true;
}

function runFfmpeg(args) {
  return new Promise((resolve, reject) => {
    execFile("ffmpeg", ["-y", "-hide_banner", "-loglevel", "error", ...args], (error, _stdout, stderr) => {
      if (error) {
        reject(new Error(stderr || error.message));
      } else {
        resolve();
      }
    });
  });
}

function probeDuration(filePath) {
  return new Promise((resolve) => {
    execFile(
      "ffprobe",
      ["-v", "error", "-show_entries", "format=duration", "-of", "default=nw=1:nk=1", filePath],
      (error, stdout) => {
        const seconds = Number.parseFloat(stdout);
        resolve(error || !Number.isFinite(seconds) ? 0 : seconds);
      },
    );
  });
}

async function addExif(buffer, metadata) {
  const img = new webp.Image();
  await img.load(buffer);

  const json = {
    "sticker-pack-id": `${getRandomNumber(10_000, 99_999)}`,
    "sticker-pack-name": metadata.username,
    "sticker-pack-publisher": metadata.botName,
    emojis: ["🔊"],
  };

  const exifAttr = Buffer.from([
    0x49, 0x49, 0x2a, 0x00, 0x08, 0x00, 0x00, 0x00, 0x01, 0x00, 0x41, 0x57,
    0x07, 0x00, 0x00, 0x00, 0x00, 0x00, 0x16, 0x00, 0x00, 0x00,
  ]);
  const jsonBuff = Buffer.from(JSON.stringify(json), "utf-8");
  const exif = Buffer.concat([exifAttr, jsonBuff]);
  exif.writeUIntLE(jsonBuff.length, 14, 4);

  img.exif = exif;

  return await img.save(null);
}

const SQUARE_FILTER =
  "scale=512:512:force_original_aspect_ratio=decrease," +
  "pad=512:512:(ow-iw)/2:(oh-ih)/2:color=0x00000000,setsar=1";

/**
 * Converte uma imagem ou vídeo em figurinha WebP 512x512.
 * Vídeos viram figurinha animada (tenta qualidades menores até caber).
 */
async function buildStickerWebp(inputPath, { animated, seconds }) {
  const outputPath = path.resolve(TEMP_DIR, getRandomName("webp"));

  try {
    if (!animated) {
      await runFfmpeg([
        "-i", inputPath,
        "-vf", SQUARE_FILTER,
        "-frames:v", "1",
        "-c:v", "libwebp",
        "-quality", "90",
        outputPath,
      ]);

      return fs.readFileSync(outputPath);
    }

    const attempts = [
      { fps: 15, quality: 70 },
      { fps: 12, quality: 50 },
      { fps: 10, quality: 35 },
      { fps: 8, quality: 25 },
    ];

    let buffer = null;

    for (const { fps, quality } of attempts) {
      await runFfmpeg([
        "-t", String(seconds),
        "-i", inputPath,
        "-vf", `fps=${fps},${SQUARE_FILTER}`,
        "-c:v", "libwebp",
        "-loop", "0",
        "-an",
        "-quality", String(quality),
        "-compression_level", "6",
        "-preset", "default",
        "-f", "webp",
        outputPath,
      ]);

      buffer = fs.readFileSync(outputPath);

      if (buffer.length <= MAX_STICKER_BYTES) {
        break;
      }
    }

    return buffer;
  } finally {
    removeFileIfExists(outputPath);
  }
}

/**
 * Converte o áudio para OGG/Opus mono 48 kHz. As opções extras de Opus são
 * necessárias para o som tocar no celular (sem elas a figurinha aparece,
 * mas o som não toca).
 */
async function buildStickerAudio(inputPath, seconds) {
  const outputPath = path.resolve(TEMP_DIR, getRandomName("ogg"));

  try {
    await runFfmpeg([
      "-t", String(seconds),
      "-i", inputPath,
      "-vn",
      "-map", "0:a:0",
      "-ac", "1",
      "-ar", "48000",
      "-c:a", "libopus",
      "-b:a", "64k",
      "-vbr", "on",
      "-compression_level", "10",
      "-frame_duration", "20",
      "-avoid_negative_ts", "make_zero",
      "-f", "ogg",
      outputPath,
    ]);

    return fs.readFileSync(outputPath);
  } finally {
    removeFileIfExists(outputPath);
  }
}

/**
 * Envia uma figurinha com som nativa.
 *
 * @param {object} params
 * @param {import("baileys").WASocket} params.socket
 * @param {string} params.remoteJid
 * @param {string} params.visualPath   Imagem ou vídeo usado na figurinha.
 * @param {boolean} params.animated    Se a figurinha deve ser animada (vídeo).
 * @param {string} params.audioPath    Arquivo com o som (pode ser o próprio vídeo).
 * @param {{ username: string, botName: string }} params.metadata
 * @param {object} [params.quoted]     Mensagem a ser respondida.
 */
export async function sendAudioSticker({
  socket,
  remoteJid,
  visualPath,
  animated,
  audioPath,
  metadata,
  quoted,
}) {
  installAudioStickerProto();

  const audioDuration = await probeDuration(audioPath);
  const seconds = Math.max(
    1,
    Math.min(MAX_AUDIO_STICKER_SECONDS, audioDuration || MAX_AUDIO_STICKER_SECONDS),
  );

  const [stickerRaw, audioBuffer] = await Promise.all([
    buildStickerWebp(visualPath, { animated, seconds }),
    buildStickerAudio(audioPath, seconds),
  ]);

  const stickerBuffer = await addExif(stickerRaw, metadata);
  const upload = socket.waUploadToServer;

  const [{ stickerMessage }, { audioMessage }] = await Promise.all([
    prepareWAMessageMedia({ sticker: stickerBuffer }, { upload }),
    prepareWAMessageMedia(
      { audio: audioBuffer, mimetype: "audio/ogg; codecs=opus", ptt: false, seconds: Math.round(seconds) },
      { upload },
    ),
  ]);

  stickerMessage.isAnimated = animated && stickerBuffer.includes(Buffer.from("ANIM"));
  stickerMessage.mimetype = "image/webp";
  stickerMessage.width = 512;
  stickerMessage.height = 512;
  audioMessage.seconds = Math.round(seconds);
  stickerMessage.audioMessage = audioMessage;

  if (quoted?.key?.id && quoted?.message) {
    stickerMessage.contextInfo = {
      stanzaId: quoted.key.id,
      participant: quoted.key.participant || quoted.key.remoteJid,
      quotedMessage: quoted.message,
    };
  }

  const message = {
    audioStickerMessage: {
      message: { stickerMessage },
    },
  };

  const messageId = generateMessageIDV2(socket.user?.id);

  await socket.relayMessage(remoteJid, message, { messageId });

  return { messageId, seconds };
}
