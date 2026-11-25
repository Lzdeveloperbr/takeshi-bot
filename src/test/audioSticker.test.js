/**
 * Testes da codificação de figurinhas com som (audioStickerMessage).
 */
import { proto } from "baileys";
import assert from "node:assert";
import { describe, it } from "node:test";
import { installAudioStickerProto } from "../services/audioSticker.js";

function readField(bytes, fieldNumber) {
  const reader = bytes;
  let pos = 0;
  const readVarint = () => {
    let result = 0;
    let shift = 0;
    let byte;
    do {
      byte = reader[pos++];
      result += (byte & 0x7f) * 2 ** shift;
      shift += 7;
    } while (byte & 0x80);
    return result;
  };

  while (pos < reader.length) {
    const tag = readVarint();
    const wireType = tag & 7;
    const field = Math.floor(tag / 8);

    if (wireType === 2) {
      const length = readVarint();
      const value = reader.subarray(pos, pos + length);
      pos += length;
      if (field === fieldNumber) return value;
    } else if (wireType === 0) {
      readVarint();
    } else if (wireType === 1) {
      pos += 8;
    } else if (wireType === 5) {
      pos += 4;
    } else {
      throw new Error(`wire type ${wireType} não suportado`);
    }
  }

  return null;
}

describe("audioSticker", () => {
  installAudioStickerProto();
  installAudioStickerProto(); // idempotente

  const message = {
    audioStickerMessage: {
      message: {
        stickerMessage: {
          url: "https://mmg.whatsapp.net/sticker",
          mimetype: "image/webp",
          isAnimated: true,
          audioMessage: {
            url: "https://mmg.whatsapp.net/audio",
            mimetype: "audio/ogg; codecs=opus",
            seconds: 7,
            ptt: false,
          },
        },
      },
    },
  };

  const bytes = proto.Message.encode(message).finish();

  it("coloca audioStickerMessage no campo 134 da Message", () => {
    assert.ok(readField(bytes, 134));
  });

  it("embute o áudio no campo 26 da StickerMessage", () => {
    const fpm = readField(bytes, 134);
    const innerMessage = readField(fpm, 1);
    const sticker = readField(innerMessage, 26);
    const audio = proto.Message.AudioMessage.decode(readField(sticker, 26));

    assert.strictEqual(audio.mimetype, "audio/ogg; codecs=opus");
    assert.strictEqual(audio.seconds, 7);

    const decodedSticker = proto.Message.StickerMessage.decode(sticker);
    assert.strictEqual(decodedSticker.url, "https://mmg.whatsapp.net/sticker");
    assert.strictEqual(decodedSticker.isAnimated, true);
  });

  it("não altera mensagens comuns", () => {
    const plain = { conversation: "oi" };
    const encoded = proto.Message.encode(plain).finish();
    assert.strictEqual(proto.Message.decode(encoded).conversation, "oi");
    assert.strictEqual(readField(encoded, 134), null);
  });
});
