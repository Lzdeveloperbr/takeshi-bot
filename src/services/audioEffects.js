/**
 * Efeitos de áudio com o ffmpeg (grave, lento, nightcore, 8D...).
 *
 * Cada efeito tem um filtro do ffmpeg. Para criar um novo, é só adicionar
 * um item em EFFECTS (e o nome dele nos apelidos do comando efeito-audio).
 */
import { execFile } from "node:child_process";
import path from "node:path";
import { TEMP_DIR } from "../config.js";
import { getRandomName } from "../utils/index.js";

// Taxas usadas nos efeitos que mudam o tom (44,1 kHz x fator).
const rate = (factor) => Math.round(44100 * factor);
const pitch = (factor, tempoFix = 1) =>
  `aresample=44100,asetrate=${rate(factor)},aresample=44100${tempoFix !== 1 ? `,atempo=${tempoFix}` : ""}`;

/** nome -> { label, filter, voice (envia como áudio de voz), aliases } */
export const EFFECTS = {
  grave: { label: "🔊 Grave aumentado", filter: "bass=g=12:f=110:w=0.6,alimiter=limit=0.95", aliases: ["bass"] },
  graveforte: { label: "💥 Grave muito forte", filter: "bass=g=20:f=90:w=0.7,volume=0.9,alimiter=limit=0.95", aliases: ["bassboost", "grave-forte"] },
  lento: { label: "🐢 Lento", filter: "atempo=0.8", aliases: ["slow"] },
  rapido: { label: "⚡ Rápido", filter: "atempo=1.4", aliases: ["rápido", "fast", "acelerar"] },
  nightcore: { label: "🌙 Nightcore", filter: pitch(1.25), aliases: [] },
  esquilo: { label: "🐿️ Voz de esquilo", filter: pitch(1.5, 0.6667), aliases: ["fina", "voz-fina"] },
  grossa: { label: "👹 Voz grossa", filter: pitch(0.75, 1.3333), aliases: ["voz-grossa", "monstro"] },
  vaporwave: { label: "🌴 Vaporwave", filter: `${pitch(0.8)},aecho=0.8:0.88:60:0.4`, aliases: ["slowed"] },
  eco: { label: "🏔️ Eco", filter: "aecho=0.8:0.9:500:0.3", aliases: ["echo"] },
  reverb: { label: "⛪ Reverb", filter: "aecho=0.8:0.88:40|80|120:0.4|0.3|0.2", aliases: ["reverberacao"] },
  "8d": { label: "🎧 Áudio 8D (use fone!)", filter: "aformat=channel_layouts=stereo,apulsator=hz=0.125", voice: false, aliases: ["audio8d"] },
  "reverso-audio": { label: "🔁 Ao contrário", filter: "areverse", aliases: ["audio-reverso", "ao-contrario"] },
  robo: { label: "🤖 Voz de robô", filter: "afftfilt=real='hypot(re,im)*sin(0)':imag='hypot(re,im)*cos(0)':win_size=512:overlap=0.75", aliases: ["robô", "robot"] },
  radio: { label: "📻 Rádio / telefone", filter: "highpass=f=300,lowpass=f=3400,volume=1.6,alimiter=limit=0.95", aliases: ["rádio", "telefone"] },
  abafado: { label: "🫧 Abafado", filter: "lowpass=f=450,volume=1.3", aliases: ["embaixo-dagua"] },
  alto: { label: "📢 Volume alto", filter: "volume=2.5,alimiter=limit=0.95", aliases: ["aumentar-volume"] },
};

export const MAX_INPUT_SECONDS = 300;

const normalize = (text) =>
  String(text || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]/g, "");

/** Acha o efeito pelo nome ou apelido (ignora acentos, hífens e maiúsculas). */
export function findEffect(name) {
  const wanted = normalize(name);
  if (!wanted) return null;

  for (const [key, effect] of Object.entries(EFFECTS)) {
    if ([key, ...effect.aliases].some((alias) => normalize(alias) === wanted)) {
      return { key, ...effect, voice: effect.voice ?? true };
    }
  }

  return null;
}

/** Aplica o efeito e devolve o caminho do mp3 gerado. */
export function applyEffect(inputPath, effect) {
  const outputPath = path.resolve(TEMP_DIR, getRandomName("mp3"));

  return new Promise((resolve, reject) => {
    execFile(
      "ffmpeg",
      [
        "-y", "-hide_banner", "-loglevel", "error",
        "-i", inputPath,
        "-t", String(MAX_INPUT_SECONDS),
        "-vn",
        "-af", effect.filter,
        "-c:a", "libmp3lame", "-q:a", "4",
        outputPath,
      ],
      { timeout: 120_000 },
      (error, _stdout, stderr) => {
        if (error) reject(new Error(stderr?.split("\n").filter(Boolean).pop() || error.message));
        else resolve(outputPath);
      },
    );
  });
}
