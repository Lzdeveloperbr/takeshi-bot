/**
 * Testes das alternativas gratuitas (sem internet: usa um yt-dlp falso).
 */
import assert from "node:assert";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { after, describe, it } from "node:test";

const fakeDir = fs.mkdtempSync(path.join(os.tmpdir(), "fake-ytdlp-"));
const fakeYtDlp = path.join(fakeDir, "yt-dlp");

// Simula o yt-dlp: imprime os metadados e cria o arquivo de saída.
fs.writeFileSync(
  fakeYtDlp,
  `#!/usr/bin/env node
const fs = require("node:fs");
const args = process.argv.slice(2);
const target = args.at(-1);
if (target.includes("erro")) {
  console.error("ERROR: [generic] Video unavailable");
  process.exit(1);
}
if (args.includes("--flat-playlist")) {
  console.log(JSON.stringify({ entries: [
    { id: "abc", title: "Música 1", duration: 185, view_count: 1234567 },
  ] }));
  process.exit(0);
}
const template = args[args.indexOf("-o") + 1];
const ext = args.includes("-x") ? "mp3" : "mp4";
const file = template.replace("%(ext)s", ext);
fs.writeFileSync(file, "fake");
console.log(JSON.stringify({ title: "Vídeo teste", description: "desc", duration: 61.4, uploader: "Canal X", thumbnail: "https://img/t.jpg" }));
console.log(file);
`,
  { mode: 0o755 },
);

process.env.YT_DLP_PATH = fakeYtDlp;

const free = await import("../services/free-api.js");
const spider = await import("../services/spider-x-api.js");

describe("alternativas gratuitas", () => {
  const created = [];

  after(() => {
    for (const file of created) fs.rmSync(file, { force: true });
    fs.rmSync(fakeDir, { recursive: true, force: true });
  });

  it("baixa vídeo pelo yt-dlp no formato da Spider X", async () => {
    const data = await free.ytDlpDownload("https://youtu.be/x");
    created.push(data.url);

    assert.ok(fs.existsSync(data.url));
    assert.match(data.url, /\.mp4$/);
    assert.strictEqual(data.download_link, data.url);
    assert.strictEqual(data.title, "Vídeo teste");
    assert.strictEqual(data.total_duration_in_seconds, 61);
    assert.strictEqual(data.channel.name, "Canal X");
  });

  it("sem token, download() da Spider usa o yt-dlp (áudio em mp3)", async () => {
    const data = await spider.download("yt-mp3", "https://youtu.be/x");
    created.push(data.url);
    assert.match(data.url, /\.mp3$/);
  });

  it("pesquisa no YouTube", async () => {
    const [first] = await spider.search("youtube", "musica");
    assert.strictEqual(first.title, "Música 1");
    assert.strictEqual(first.duration, "3:05");
    assert.strictEqual(first.url, "https://www.youtube.com/watch?v=abc");
  });

  it("mostra o erro do yt-dlp de forma legível", async () => {
    await assert.rejects(free.ytDlpDownload("https://erro"), /Video unavailable/);
  });

  it("imagem por IA gratuita gera um link do Pollinations", async () => {
    const data = await spider.imageAI("gato astronauta");
    assert.match(data.image, /^https:\/\/image\.pollinations\.ai\/prompt\/gato%20astronauta/);
  });

  it("divide o texto do TTS em partes de até 200 caracteres", () => {
    const parts = free.splitText("palavra ".repeat(100));
    assert.ok(parts.length > 1);
    assert.ok(parts.every((part) => part.length <= 200));
    assert.strictEqual(parts.join(" "), "palavra ".repeat(100).trim());
  });
});
