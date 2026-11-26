/**
 * Funções diversas.
 *
 * @author Dev Gui
 */
import axios from "axios";
import { delay, downloadContentFromMessage } from "baileys";
import { writeFile } from "fs/promises";
import { exec } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import readline from "node:readline";
import { pathToFileURL } from "node:url";
import { ASSETS_DIR, COMMANDS_DIR, OWNER_LID, PREFIX, TEMP_DIR } from "../config.js";
import { errorLog } from "./logger.js";

export function question(message) {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return new Promise((resolve) => rl.question(message, resolve));
}

function extractInteractiveResponseId(paramsJson) {
  if (!paramsJson) {
    return null;
  }

  try {
    const params = JSON.parse(paramsJson);

    return (
      params.id ||
      params.selectedId ||
      params.selectedRowId ||
      params.rowId ||
      params.buttonId ||
      params.button_id ||
      null
    );
  } catch {
    return null;
  }
}

export function extractDataFromMessage(webMessage) {
  const textMessage = webMessage.message?.conversation;
  const extendedTextMessage = webMessage.message?.extendedTextMessage;
  const extendedTextMessageText = extendedTextMessage?.text;
  const imageTextMessage = webMessage.message?.imageMessage?.caption;
  const videoTextMessage = webMessage.message?.videoMessage?.caption;
  const buttonsResponseMessage =
    webMessage.message?.buttonsResponseMessage?.selectedButtonId;
  const templateButtonReplyMessage =
    webMessage.message?.templateButtonReplyMessage?.selectedId;
  const listResponseMessage =
    webMessage.message?.listResponseMessage?.singleSelectReply?.selectedRowId;
  const interactiveResponseMessage =
    webMessage.message?.interactiveResponseMessage?.nativeFlowResponseMessage;
  const interactiveResponseId = extractInteractiveResponseId(
    interactiveResponseMessage?.paramsJson,
  );

  let fullMessage =
    textMessage ||
    extendedTextMessageText ||
    imageTextMessage ||
    videoTextMessage ||
    buttonsResponseMessage ||
    templateButtonReplyMessage ||
    listResponseMessage ||
    interactiveResponseId;

  if (!fullMessage) {
    fullMessage = "#auto-command";
  }

  const isReply =
    !!extendedTextMessage && !!extendedTextMessage.contextInfo?.quotedMessage;

  const replyLid =
    !!extendedTextMessage && !!extendedTextMessage.contextInfo?.participant
      ? extendedTextMessage.contextInfo.participant
      : null;

  const replyTextType1 =
    extendedTextMessage?.contextInfo?.quotedMessage?.conversation;

  const replyTextType2 =
    extendedTextMessage?.contextInfo?.quotedMessage?.extendedTextMessage?.text;

  const replyTextType3 =
    extendedTextMessage?.contextInfo?.quotedMessage?.imageMessage?.caption;

  const replyText = replyTextType1 || replyTextType2 || replyTextType3 || "";

  const userLid =
    webMessage?.key?.participant?.replace(/:[0-9][0-9]|:[0-9]/g, "") ||
    webMessage?.key?.participantAlt ||
    (webMessage?.key?.fromMe ? OWNER_LID : null);

  // O comando termina no primeiro espaço OU quebra de linha
  // (ex.: "/set-regras" seguido de Enter e o texto das regras).
  const firstSpace = fullMessage.search(/\s/);
  const command =
    firstSpace === -1 ? fullMessage : fullMessage.slice(0, firstSpace);
  const args =
    firstSpace === -1 ? [] : fullMessage.slice(firstSpace + 1).split(" ");
  const prefix = command.charAt(0);

  const commandWithoutPrefix = command.replace(new RegExp(`^[${PREFIX}]+`), "");

  return {
    args: splitByCharacters(args.join(" "), ["\\", "|", "/"]),
    commandName: formatCommand(commandWithoutPrefix),
    fullArgs: args.join(" "),
    fullMessage,
    isReply,
    prefix,
    remoteJid: webMessage?.key?.remoteJid,
    replyLid,
    replyText,
    userLid,
  };
}

export function splitByCharacters(str, characters) {
  characters = characters.map((char) => (char === "\\" ? "\\\\" : char));
  const regex = new RegExp(`[${characters.join("")}]`);

  return str
    .split(regex)
    .map((str) => str.trim())
    .filter(Boolean);
}

export function formatCommand(text) {
  return onlyLettersAndNumbers(
    removeAccentsAndSpecialCharacters(text.toLocaleLowerCase().trim()),
  );
}

export function isGroup(remoteJid) {
  return remoteJid.endsWith("@g.us");
}

export function onlyLettersAndNumbers(text) {
  return text.replace(/[^a-zA-Z0-9]/g, "");
}

export function removeAccentsAndSpecialCharacters(text) {
  if (!text) return "";

  return text.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

export function isTrue(word) {
  if (!word) return false;

  return ["1", "ativar", "ligado", "ligar", "on", "sim", "true"].includes(
    removeAccentsAndSpecialCharacters(word.toLowerCase()),
  );
}

export function isFalse(word) {
  if (!word) return false;

  return [
    "0",
    "desativar",
    "desligado",
    "desligar",
    "off",
    "nao",
    "não",
    "false",
  ].includes(removeAccentsAndSpecialCharacters(word.toLowerCase()));
}

export function baileysIs(webMessage, context) {
  return !!getContent(webMessage, context);
}

export function getContent(webMessage, context) {
  return (
    webMessage?.message?.[`${context}Message`] ||
    webMessage?.message?.extendedTextMessage?.contextInfo?.quotedMessage?.[
      `${context}Message`
    ] ||
    webMessage?.message?.viewOnceMessage?.message?.[`${context}Message`] ||
    webMessage?.message?.extendedTextMessage?.contextInfo?.quotedMessage
      ?.viewOnceMessage?.message?.[`${context}Message`] ||
    webMessage?.message?.viewOnceMessageV2?.message?.[`${context}Message`] ||
    webMessage?.message?.extendedTextMessage?.contextInfo?.quotedMessage
      ?.viewOnceMessageV2?.message?.[`${context}Message`]
  );
}

export function getExtensionFromMimeType(mimeType, fallback = "bin") {
  const normalizedMimeType = mimeType?.split(";")[0].trim().toLowerCase();

  const extensionsByMimeType = {
    "audio/aac": "aac",
    "audio/flac": "flac",
    "audio/m4a": "m4a",
    "audio/mp4": "m4a",
    "audio/mpeg": "mp3",
    "audio/ogg": "ogg",
    "audio/wav": "wav",
    "audio/x-m4a": "m4a",
    "audio/x-wav": "wav",
  };

  return extensionsByMimeType[normalizedMimeType] || fallback;
}

export async function download(webMessage, fileName, context, extension) {
  const content = getContent(webMessage, context);

  if (!content) {
    return null;
  }

  const stream = await downloadContentFromMessage(content, context);

  let buffer = Buffer.from([]);

  for await (const chunk of stream) {
    buffer = Buffer.concat([buffer, chunk]);
  }

  const filePath = path.resolve(TEMP_DIR, `${fileName}.${extension}`);

  await writeFile(filePath, buffer);

  return filePath;
}

export function readDirectoryRecursive(dir) {
  const results = [];
  const list = fs.readdirSync(dir, { withFileTypes: true });

  for (const item of list) {
    const itemPath = path.join(dir, item.name);
    if (item.isDirectory()) {
      results.push(...readDirectoryRecursive(itemPath));
    } else if (
      !item.name.startsWith("_") &&
      (item.name.endsWith(".js") || item.name.endsWith(".ts"))
    ) {
      results.push(itemPath);
    }
  }

  return results;
}

/**
 * Índice de comandos (nome/apelido -> comando), montado uma única vez.
 * Antes, todos os arquivos de comando eram lidos a cada mensagem recebida.
 * Como o Node guarda os módulos em cache, alterações em comandos só valem
 * após reiniciar o bot, então o índice não perde nada.
 */
let commandIndexPromise = null;

async function buildCommandIndex() {
  const imports = await readCommandImports();
  const index = new Map();

  // Ordem fixa de prioridade quando dois comandos usam o mesmo apelido.
  const types = ["owner", "admin", "member"].filter((type) => imports[type]);
  for (const type of Object.keys(imports)) {
    if (!types.includes(type)) types.push(type);
  }

  for (const type of types) {
    for (const cmd of imports[type]) {
      if (!cmd?.commands || !Array.isArray(cmd.commands)) {
        errorLog(
          `Erro no comando do tipo "${type}": A propriedade "commands" precisa existir ser um ["array"] com os nomes dos comandos! Arquivo errado: ${cmd?.name}.js`,
        );
        continue;
      }

      for (const alias of cmd.commands) {
        const key = formatCommand(alias);

        if (key && !index.has(key)) {
          index.set(key, { type, command: cmd, alias });
        }
      }
    }
  }

  return index;
}

export function getCommandIndex() {
  if (!commandIndexPromise) {
    commandIndexPromise = buildCommandIndex().catch((error) => {
      commandIndexPromise = null;
      throw error;
    });
  }

  return commandIndexPromise;
}

export async function findCommandImport(commandName) {
  const index = await getCommandIndex();
  const found = index.get(commandName);

  return {
    type: found?.type ?? "",
    command: found?.command ?? null,
  };
}

// Distância de edição que conta letras trocadas de lugar como 1 erro
// ("plya" -> "play").
function editDistance(a, b) {
  const d = Array.from({ length: a.length + 1 }, (_, i) =>
    Array.from({ length: b.length + 1 }, (_, j) => (i === 0 ? j : j === 0 ? i : 0)),
  );

  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;

      d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + cost);

      if (i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1]) {
        d[i][j] = Math.min(d[i][j], d[i - 2][j - 2] + 1);
      }
    }
  }

  return d[a.length][b.length];
}

/**
 * Sugere o comando mais parecido com o que foi digitado (para erros de
 * digitação como "/plya" -> "/play"). Retorna o apelido ou null.
 */
export async function suggestCommand(commandName) {
  if (!commandName || commandName.length < 2) {
    return null;
  }

  const index = await getCommandIndex();
  const maxDistance = commandName.length <= 4 ? 1 : 2;

  let best = null;
  let bestDistance = Infinity;

  for (const [key, { alias }] of index) {
    if (Math.abs(key.length - commandName.length) > maxDistance) continue;

    const distance = editDistance(commandName, key);

    if (distance < bestDistance) {
      best = alias;
      bestDistance = distance;
    }
  }

  return bestDistance <= maxDistance ? best : null;
}

export async function readCommandImports() {
  const subdirectories = fs
    .readdirSync(COMMANDS_DIR, { withFileTypes: true })
    .filter((directory) => directory.isDirectory())
    .map((directory) => directory.name);

  const commandImports = {};

  await Promise.all(
    subdirectories.map(async (subdir) => {
      const subdirectoryPath = path.join(COMMANDS_DIR, subdir);

      const files = await Promise.all(
        readDirectoryRecursive(subdirectoryPath).map(async (filePath) => {
          try {
            const module = await import(pathToFileURL(filePath).href);
            return module.default ?? module;
          } catch (err) {
            console.error(`Erro ao importar ${filePath}:`, err);
            return null;
          }
        }),
      );

      commandImports[subdir] = files.filter(Boolean);
    }),
  );

  return commandImports;
}

export const onlyNumbers = (text) => text.replace(/[^0-9]/g, "");

export function toUserLid(value) {
  return `${onlyNumbers(value)}@lid`;
}

export function toUserJid(value) {
  return `${onlyNumbers(value)}@s.whatsapp.net`;
}

export function getBuffer(url, options) {
  return new Promise((resolve, reject) => {
    axios({
      method: "get",
      url,
      headers: {
        DNT: 1,
        "Upgrade-Insecure-Request": 1,
        range: "bytes=0-",
      },
      ...options,
      responseType: "arraybuffer",
      proxy: options?.proxy || false,
    })
      .then((res) => {
        resolve(res.data);
      })
      .catch(reject);
  });
}

export function getRandomNumber(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

export function formatSecondsToMinutesAndSeconds(totalSeconds) {
  const safeSeconds = Math.max(0, Math.floor(Number(totalSeconds) || 0));
  const minutes = Math.floor(safeSeconds / 60);
  const seconds = safeSeconds % 60;

  return `${minutes}:${String(seconds).padStart(2, "0")}`;
}

export function readMore() {
  const invisibleBreak = "\u200B".repeat(950);
  return invisibleBreak;
}

export function getRandomName(extension) {
  const fileName = `takeshi_temp_${getRandomNumber(0, 999999)}`;

  if (!extension) {
    return fileName.toString();
  }

  return `${fileName}.${extension}`;
}

export function removeFileIfExists(filePath) {
  try {
    if (filePath && fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      return true;
    }
  } catch (error) {
    console.error("Erro ao remover arquivo:", error);
  }

  return false;
}

export function removeFileWithTimeout(filePath, timeout = 5000) {
  setTimeout(() => {
    removeFileIfExists(filePath);
  }, timeout);
}

export function getUserName(webMessage, userLid, fallback = "usuario") {
  return (
    webMessage?.pushName ||
    webMessage?.notifyName ||
    userLid?.replace(/@lid/, "") ||
    fallback
  );
}

export async function ajustAudioByBuffer(audioBuffer, isPtt = true) {
  return new Promise((resolve, reject) => {
    const tempPath = path.resolve(
      TEMP_DIR,
      getRandomName(isPtt ? "ogg" : "mp3"),
    );

    fs.writeFileSync(tempPath, audioBuffer);

    const outputPath = path.resolve(
      TEMP_DIR,
      getRandomName(isPtt ? "ogg" : "mp3"),
    );

    const command = isPtt
      ? `ffmpeg -i "${tempPath}" -vn -c:a libopus -f ogg -b:a 48k -ac 1 -y "${outputPath}"`
      : `ffmpeg -i "${tempPath}" -vn -c:a libmp3lame -f mp3 -ar 44100 -ac 2 -b:a 128k -y "${outputPath}"`;

    exec(command, (error) => {
      if (error) {
        console.error(error);
        reject(error);
        return;
      }

      try {
        const result = {
          oldAudioPath: tempPath,
          audioPath: outputPath,
          audioBuffer: fs.readFileSync(outputPath),
        };
        resolve(result);
      } catch (readError) {
        reject(readError);
      }
    });
  });
}

export async function getImageBuffer(url, options = {}) {
  try {
    const defaultOptions = {
      method: "GET",
      headers: {
        Accept: "image/*",
      },
    };

    const fetchOptions = { ...defaultOptions, ...options };

    const response = await fetch(url, fetchOptions);

    if (!response.ok) {
      throw new Error(
        `Falha ao obter imagem: ${response.status} ${response.statusText}`,
      );
    }

    const buffer = await response.arrayBuffer();

    return buffer;
  } catch (error) {
    errorLog(`Erro ao obter o buffer da imagem: ${error.message}`);
    throw error;
  }
}

export async function randomDelay() {
  const values = [1000, 2000, 3000];
  return await delay(values[getRandomNumber(0, values.length - 1)]);
}

export function isAtLeastMinutesInPast(timestamp, minimumMinutes = 5) {
  const currentTimestamp = Math.floor(Date.now() / 1000);

  const diffInSeconds = currentTimestamp - timestamp;

  const diffInMinutes = Math.floor(diffInSeconds / 60);

  return diffInMinutes >= minimumMinutes;
}

export function getLastTimestampCreds() {
  const credsJson = JSON.parse(
    fs.readFileSync(
      path.resolve(ASSETS_DIR, "auth", "baileys", "creds.json"),
      "utf-8",
    ),
  );

  return credsJson.lastAccountSyncTimestamp;
}

export function extractUserLid(data) {
  if (typeof data === "string") {
    try {
      const parsed = JSON.parse(data);

      if (parsed.id) {
        return parsed.id;
      }
    } catch (e) {
      return data;
    }
  }

  if (typeof data === "object" && data !== null) {
    if (data.id) {
      return data.id;
    }
  }

  return data;
}

export function hasDirectMedia(webMessage, context) {
  return (
    webMessage?.message?.[`${context}Message`] ||
    webMessage?.message?.viewOnceMessage?.message?.[`${context}Message`] ||
    webMessage?.message?.viewOnceMessageV2?.message?.[`${context}Message`]
  );
}

export const GROUP_PARTICIPANT_ADD = 27;
export const GROUP_PARTICIPANT_LEAVE = 32;
export const isAddOrLeave = [GROUP_PARTICIPANT_ADD, GROUP_PARTICIPANT_LEAVE];

export const CODE_FENCE_LANGUAGES =
  "javascript|js|jsx|typescript|ts|tsx|bash|sh|shell|zsh|json|jsonc|yaml|yml|toml|xml|html|css|scss|go|golang|python|py|ruby|rb|php|java|kotlin|kt|rust|rs|c|cpp|csharp|cs|swift|dart|sql|graphql|md|markdown|diff|dockerfile|docker|powershell|ps1|cmd|bat|ini|env|text|txt|plaintext|vue|svelte|lua|r|perl|scala|nginx|makefile|proto|protobuf|nodejs|node";

export function normalizeWhatsAppCodeBlocks(text) {
  return String(text || "").replace(
    new RegExp(`\`\`\`(?:${CODE_FENCE_LANGUAGES})(?=[\\s\\r\\n]|$)`, "gi"),
    "```",
  );
}

export function removeUnsolicitedFollowUps(text) {
  const continuationPattern =
    /(?:^|\s)(?:se\s+quiser|se\s+preferir|caso\s+queira)[,:]?\s*(?:eu\s+)?(?:posso|te\s+(?:passo|envio|mostro|explico|ajudo)|lhe\s+(?:passo|envio|mostro|explico)|preparo|forneço)\b|^\s*(?:posso\s+(?:também\s+)?(?:te|lhe)\s+(?:passar|enviar|mostrar|explicar)|quer\s+que\s+eu\s+(?:te\s+)?(?:passe|envie|mostre|explique))/i;

  let insideCodeBlock = false;

  return String(text || "")
    .split(/\r?\n/)
    .map((line) => {
      if (line.trimStart().startsWith("```")) {
        insideCodeBlock = !insideCodeBlock;
        return line;
      }

      if (insideCodeBlock) return line;

      const match = line.match(continuationPattern);
      return match ? line.slice(0, match.index).trimEnd() : line;
    })
    .filter((line, index, lines) => line || lines[index - 1] || lines[index + 1])
    .join("\n")
    .trim();
}
