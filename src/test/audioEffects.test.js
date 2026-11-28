/**
 * Testes dos efeitos de áudio (usa o ffmpeg de verdade).
 */
import assert from "node:assert";
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { after, before, describe, it } from "node:test";
import efeito from "../commands/member/efeito-audio.js";
import { EFFECTS, findEffect } from "../services/audioEffects.js";
import { InvalidParameterError } from "../errors/index.js";

const dir = fs.mkdtempSync(path.join(os.tmpdir(), "efeitos-"));
const sample = path.join(dir, "amostra.mp3");

const duration = (file) =>
  Number(execFileSync("ffprobe", ["-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", file]).toString());
const channels = (file) =>
  Number(execFileSync("ffprobe", ["-v", "error", "-show_entries", "stream=channels", "-of", "csv=p=0", file]).toString());

before(() => {
  execFileSync("ffmpeg", ["-v", "error", "-y", "-f", "lavfi", "-i", "sine=f=220:d=4", sample]);
});

after(() => fs.rmSync(dir, { recursive: true, force: true }));

async function run(commandName, args = []) {
  const result = { replies: [], audio: null };
  await efeito.handle({
    commandName,
    args,
    remoteJid: "efeitos@g.us",
    isAudio: true,
    isVideo: false,
    webMessage: {},
    downloadAudio: async () => {
      const copy = path.join(dir, `entrada-${Math.random()}.mp3`);
      fs.copyFileSync(sample, copy);
      return copy;
    },
    sendReply: async (text) => result.replies.push(text),
    sendAudioFromFile: async (file, asVoice) => {
      result.audio = { duration: duration(file), channels: channels(file), asVoice };
    },
    sendWaitReact: async () => {},
    sendSuccessReact: async () => {},
  });
  return result;
}

describe("efeitos de áudio", () => {
  it("acha efeitos por nome, apelido e sem acento", () => {
    assert.strictEqual(findEffect("bass").key, "grave");
    assert.strictEqual(findEffect("Rápido").key, "rapido");
    assert.strictEqual(findEffect("8D").key, "8d");
    assert.strictEqual(findEffect("naoexiste"), null);
  });

  it("todos os efeitos funcionam no ffmpeg", async () => {
    for (const key of Object.keys(EFFECTS)) {
      const { audio } = await run(key.replace(/-/g, ""));
      assert.ok(audio && audio.duration > 1, `efeito ${key} não gerou áudio`);
    }
  });

  it("lento fica mais longo, rápido mais curto, 8D em estéreo e como áudio normal", async () => {
    assert.ok((await run("lento")).audio.duration > 4.5);
    assert.ok((await run("rapido")).audio.duration < 3.5);

    const eightD = (await run("8d")).audio;
    assert.strictEqual(eightD.channels, 2);
    assert.strictEqual(eightD.asVoice, false);
    assert.strictEqual((await run("grave")).audio.asVoice, true);
  });

  it("/efeito nome funciona e /efeitos lista tudo", async () => {
    assert.ok((await run("efeito", ["nightcore"])).audio);
    const { replies } = await run("efeitos");
    assert.match(replies[0], /EFEITOS DE ÁUDIO/);
    assert.match(replies[0], /\/grave/);
  });

  it("pede para responder a um áudio", async () => {
    await assert.rejects(
      efeito.handle({ commandName: "grave", args: [], remoteJid: "x@g.us", isAudio: false, isVideo: false }),
      InvalidParameterError,
    );
  });
});
