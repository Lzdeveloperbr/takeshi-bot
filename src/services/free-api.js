/**
 * Alternativas GRATUITAS (sem token) para os recursos da Spider X API.
 *
 * São usadas automaticamente quando o token da Spider X não está
 * configurado ou quando a Spider X falha (veja spider-x-api.js).
 *
 * - Downloads e pesquisa (YouTube, TikTok, Instagram, Facebook, X):
 *   yt-dlp, programa gratuito que roda na sua máquina.
 *   Termux: pkg install python python-pip && pip install -U yt-dlp
 * - IA de texto e de imagem: Pollinations.AI (gratuito, sem cadastro).
 * - Texto para voz: Google Tradutor.
 *
 * Os serviços gratuitos têm limites de uso e podem mudar sem aviso.
 */
import axios from "axios";
import { execFile } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { TEMP_DIR } from "../config.js";
import { getRandomName } from "../utils/index.js";

const YT_DLP = process.env.YT_DLP_PATH || "yt-dlp";
const DOWNLOAD_TIMEOUT_MS = 4 * 60 * 1000;
const FILE_TTL_MS = 10 * 60 * 1000;
const MAX_FILE_SIZE = "100M";

const AI_SYSTEM_PROMPT =
  "Você é um assistente útil em um grupo de WhatsApp. Responda sempre em português do Brasil, " +
  "de forma clara e objetiva. Use a formatação do WhatsApp (*negrito*, _itálico_) em vez de Markdown.";

export class FreeApiError extends Error {}

function scheduleCleanup(filePath) {
  setTimeout(() => {
    fs.promises.unlink(filePath).catch(() => {});
  }, FILE_TTL_MS).unref?.();
}

function runYtDlp(args) {
  return new Promise((resolve, reject) => {
    execFile(
      YT_DLP,
      ["--no-warnings", "--no-playlist", ...args],
      { timeout: DOWNLOAD_TIMEOUT_MS, maxBuffer: 64 * 1024 * 1024 },
      (error, stdout, stderr) => {
        if (error?.code === "ENOENT") {
          reject(
            new FreeApiError(
              "O yt-dlp não está instalado! Ele é gratuito e faz os downloads sem token.\n\n" +
                "Termux: pkg install python python-pip && pip install -U yt-dlp\nVPS/Linux: pip install -U yt-dlp",
            ),
          );
          return;
        }

        if (error) {
          const message = (stderr || error.message)
            .split("\n")
            .filter((line) => line.startsWith("ERROR"))
            .join(" ")
            .replace(/^ERROR:\s*/, "");

          reject(new FreeApiError(message || "Não consegui baixar esse conteúdo."));
          return;
        }

        resolve(stdout);
      },
    );
  });
}

function toResult(info, filePath) {
  const description = (info.description || "").trim();

  return {
    title: info.title || "Sem título",
    description: description.length > 300 ? `${description.slice(0, 300)}...` : description || "-",
    total_duration_in_seconds: Math.round(info.duration || 0),
    channel: { name: info.channel || info.uploader || "-" },
    thumbnail: info.thumbnail,
    url: filePath,
    download_link: filePath,
  };
}

/**
 * Baixa um vídeo/áudio com o yt-dlp. Aceita um link ou "ytsearch1:termo".
 * Retorna no mesmo formato da Spider X (url/download_link = arquivo local).
 */
export async function ytDlpDownload(target, { audio = false } = {}) {
  const outputTemplate = path.resolve(TEMP_DIR, `${getRandomName()}.%(ext)s`);

  const formatArgs = audio
    ? ["-f", "bestaudio/best", "-x", "--audio-format", "mp3", "--audio-quality", "5"]
    : [
        "-f",
        "b[ext=mp4][height<=720]/bv*[ext=mp4][height<=720]+ba[ext=m4a]/b[height<=720]/b",
        "--merge-output-format",
        "mp4",
      ];

  const stdout = await runYtDlp([
    ...formatArgs,
    "--max-filesize",
    MAX_FILE_SIZE,
    "-o",
    outputTemplate,
    "--no-simulate",
    "--print",
    "%(.{title,description,duration,channel,uploader,thumbnail})j",
    "--print",
    "after_move:filepath",
    target,
  ]);

  const lines = stdout.trim().split("\n").filter(Boolean);
  const filePath = lines.at(-1);

  if (!filePath || !fs.existsSync(filePath)) {
    throw new FreeApiError("O arquivo é grande demais ou não pôde ser baixado.");
  }

  scheduleCleanup(filePath);

  let info = {};
  try {
    info = JSON.parse(lines.find((line) => line.startsWith("{")) || "{}");
  } catch {
    // Sem metadados, segue só com o arquivo.
  }

  return toResult(info, filePath);
}

export function ytDlpPlay(type, search) {
  return ytDlpDownload(`ytsearch1:${search}`, { audio: type === "audio" });
}

function formatDuration(seconds) {
  if (!seconds) return "-";
  const total = Math.round(seconds);
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = String(total % 60).padStart(2, "0");
  return h ? `${h}:${String(m).padStart(2, "0")}:${s}` : `${m}:${s}`;
}

export async function ytDlpSearch(search, limit = 5) {
  const stdout = await runYtDlp(["--flat-playlist", "-J", `ytsearch${limit}:${search}`]);
  const { entries = [] } = JSON.parse(stdout);

  return entries.map((entry) => ({
    title: entry.title,
    duration: formatDuration(entry.duration),
    published_at: entry.upload_date || "-",
    views: entry.view_count?.toLocaleString("pt-BR") ?? "-",
    url: entry.url?.startsWith("http") ? entry.url : `https://www.youtube.com/watch?v=${entry.id}`,
  }));
}

/**
 * IA de texto gratuita (Pollinations.AI). Tenta mais de um endereço,
 * porque os endpoints gratuitos mudam com frequência.
 */
export async function freeTextAI(prompt) {
  const attempts = [
    async () => {
      const { data } = await axios.post(
        "https://text.pollinations.ai/openai",
        {
          model: "openai",
          messages: [
            { role: "system", content: AI_SYSTEM_PROMPT },
            { role: "user", content: prompt },
          ],
        },
        { timeout: 60_000 },
      );
      return data?.choices?.[0]?.message?.content;
    },
    async () => {
      const { data } = await axios.get(
        `https://text.pollinations.ai/${encodeURIComponent(prompt)}`,
        { params: { system: AI_SYSTEM_PROMPT }, timeout: 60_000, responseType: "text" },
      );
      return data;
    },
    async () => {
      const { data } = await axios.get(
        `https://gen.pollinations.ai/text/${encodeURIComponent(prompt)}`,
        { params: { system: AI_SYSTEM_PROMPT }, timeout: 60_000, responseType: "text" },
      );
      return data;
    },
  ];

  for (const attempt of attempts) {
    try {
      const text = (await attempt())?.toString().trim();
      if (text) return text;
    } catch {
      // Tenta o próximo endereço.
    }
  }

  throw new FreeApiError(
    "A IA gratuita está ocupada ou fora do ar agora. Tente novamente em alguns segundos.",
  );
}

/**
 * IA de imagem gratuita (Pollinations.AI). Retorna no formato da Spider X.
 */
export function freeImageAI(description) {
  const seed = Math.floor(Math.random() * 1_000_000);

  return {
    image: `https://image.pollinations.ai/prompt/${encodeURIComponent(
      description,
    )}?width=1024&height=1024&nologo=true&seed=${seed}`,
  };
}

export function splitText(text, maxLength = 200) {
  const chunks = [];
  let current = "";

  for (const word of text.split(/\s+/)) {
    if (word.length > maxLength) {
      if (current) chunks.push(current);
      for (let i = 0; i < word.length; i += maxLength) chunks.push(word.slice(i, i + maxLength));
      current = "";
    } else if (`${current} ${word}`.trim().length > maxLength) {
      chunks.push(current);
      current = word;
    } else {
      current = `${current} ${word}`.trim();
    }
  }

  if (current) chunks.push(current);
  return chunks;
}

/**
 * Texto para voz gratuito (Google Tradutor). Retorna o caminho de um mp3.
 */
export async function freeTTS(text) {
  const buffers = [];

  for (const chunk of splitText(text)) {
    const { data } = await axios.get("https://translate.google.com/translate_tts", {
      params: { ie: "UTF-8", client: "tw-ob", tl: "pt-BR", q: chunk },
      responseType: "arraybuffer",
      timeout: 20_000,
      headers: { "User-Agent": "Mozilla/5.0" },
    });
    buffers.push(Buffer.from(data));
  }

  const filePath = path.resolve(TEMP_DIR, getRandomName("mp3"));
  await fs.promises.writeFile(filePath, Buffer.concat(buffers));
  scheduleCleanup(filePath);

  return filePath;
}
