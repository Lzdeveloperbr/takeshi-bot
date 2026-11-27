/**
 * Script de
 * inicialização do bot.
 *
 * Este script é
 * responsável por
 * iniciar a conexão
 * com o WhatsApp.
 *
 * Não é recomendado alterar
 * este arquivo,
 * a menos que você saiba
 * o que está fazendo.
 *
 * @author Dev Gui
 */
import makeWASocket, {
  DisconnectReason,
  fetchLatestBaileysVersion,
  isJidBroadcast,
  isJidNewsletter,
  isJidStatusBroadcast,
  useMultiFileAuthState,
} from "baileys";
import NodeCache from "node-cache";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import pino from "pino";
import { PREFIX, TEMP_DIR } from "./config.js";
import { load } from "./loader.js";
import { badMacHandler } from "./utils/badMacHandler.js";
import { mediaCache } from "./utils/mediaCache.js";
import { onlyNumbers, question } from "./utils/index.js";
import {
  bannerLog,
  errorLog,
  infoLog,
  successLog,
  warningLog,
} from "./utils/logger.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

if (!fs.existsSync(TEMP_DIR)) {
  fs.mkdirSync(TEMP_DIR, { recursive: true });
}

const logger = pino(
  { timestamp: () => `,"time":"${new Date().toJSON()}"` },
  pino.destination(path.join(TEMP_DIR, "wa-logs.txt")),
);

logger.level = "error";

const msgRetryCounterCache = new NodeCache();

// Cache de metadados de grupos. Evita uma consulta ao WhatsApp a cada
// mensagem (verificação de admin, anti-link, etc.), o que reduz a latência
// e o risco de erros "rate-overlimit". É invalidado automaticamente quando
// o grupo ou seus participantes mudam.
const groupMetadataCache = new NodeCache({
  stdTTL: 5 * 60,
  checkperiod: 60,
  useClones: false,
});

// Lista de aparelhos de cada usuário (usada ao enviar mensagens em grupos).
// Mantida entre reconexões para não precisar buscar tudo de novo.
const userDevicesCache = new NodeCache({ stdTTL: 5 * 60, useClones: false });

// Versão do WhatsApp Web: buscada uma vez, para reconectar mais rápido.
let cachedWaVersion = null;

export async function getWaVersion() {
  if (!cachedWaVersion) {
    const { version } = await fetchLatestBaileysVersion();
    cachedWaVersion = version;
  }

  return cachedWaVersion;
}

const MAX_RECONNECT_DELAY_MS = 60_000;
let reconnectAttempts = 0;
let reconnectTimer = null;

function scheduleReconnect() {
  if (reconnectTimer) {
    return;
  }

  const delay = Math.min(
    1_000 * 2 ** reconnectAttempts,
    MAX_RECONNECT_DELAY_MS,
  );

  reconnectAttempts++;

  infoLog(
    `Tentando reconectar em ${Math.round(delay / 1000)}s (tentativa ${reconnectAttempts})...`,
  );

  reconnectTimer = setTimeout(async () => {
    reconnectTimer = null;

    try {
      const newSocket = await connect();
      load(newSocket);
    } catch (error) {
      errorLog(`Falha ao reconectar: ${error.message}`);
      scheduleReconnect();
    }
  }, delay);
}

function invalidateGroupMetadata(jid) {
  if (jid) {
    groupMetadataCache.del(jid);
  }
}

/**
 * Envolve as funções de grupo do socket para usar/invalidar o cache.
 */
function attachGroupMetadataCache(socket) {
  const originalGroupMetadata = socket.groupMetadata.bind(socket);

  socket.groupMetadata = async (jid) => {
    const cached = groupMetadataCache.get(jid);

    if (cached) {
      return cached;
    }

    const metadata = await originalGroupMetadata(jid);
    groupMetadataCache.set(jid, metadata);

    return metadata;
  };

  const mutatingGroupFunctions = [
    "groupParticipantsUpdate",
    "groupUpdateSubject",
    "groupUpdateDescription",
    "groupSettingUpdate",
    "groupToggleEphemeral",
    "groupMemberAddMode",
    "groupJoinApprovalMode",
  ];

  for (const name of mutatingGroupFunctions) {
    if (typeof socket[name] !== "function") {
      continue;
    }

    const original = socket[name].bind(socket);

    socket[name] = async (jid, ...args) => {
      try {
        return await original(jid, ...args);
      } finally {
        invalidateGroupMetadata(jid);
      }
    };
  }

  socket.ev.on("groups.update", (updates) => {
    for (const update of updates) {
      invalidateGroupMetadata(update?.id);
    }
  });

  socket.ev.on("group-participants.update", (update) => {
    invalidateGroupMetadata(update?.id);
  });
}

function formatPairingCode(code) {
  if (!code) return code;

  return code?.match(/.{1,4}/g)?.join("-") || code;
}

function clearScreenWithBanner() {
  console.clear();
  bannerLog();
}

export async function connect() {
  const baileysFolder = path.resolve(
    __dirname,
    "..",
    "assets",
    "auth",
    "baileys",
  );

  const { state, saveCreds } = await useMultiFileAuthState(baileysFolder);

  const version = await getWaVersion();

  const socket = makeWASocket({
    version,
    logger,
    defaultQueryTimeoutMs: undefined,
    retryRequestDelayMs: 5000,
    auth: state,
    shouldIgnoreJid: (jid) =>
      isJidBroadcast(jid) || isJidStatusBroadcast(jid) || isJidNewsletter(jid),
    connectTimeoutMs: 20_000,
    keepAliveIntervalMs: 30_000,
    maxMsgRetryCount: 5,
    markOnlineOnConnect: true,
    syncFullHistory: false,
    // Permite que comandos enviados pelo próprio número sejam processados.
    emitOwnEvents: true,
    msgRetryCounterCache,
    shouldSyncHistoryMessage: () => false,
    cachedGroupMetadata: async (jid) => groupMetadataCache.get(jid),
    mediaCache,
    userDevicesCache,
  });

  attachGroupMetadataCache(socket);

  if (!socket.authState.creds.registered) {
    clearScreenWithBanner();
    console.log(
      'Informe o número do bot (SP/RJ exigem 9º dígito). \nExemplo: "+5511912345678", demais estados: "+554112345678":',
    );

    const phoneNumber = await question("Número: ");

    if (!phoneNumber) {
      errorLog(
        'Número de telefone inválido! Tente novamente com o comando "npm start".',
      );

      process.exit(1);
    }

    const code = await socket.requestPairingCode(onlyNumbers(phoneNumber));

    console.log(`Código de pareamento: ${formatPairingCode(code)}`);
  }

  socket.ev.on("connection.update", async (update) => {
    const { connection, lastDisconnect } = update;

    if (connection === "close") {
      const error = lastDisconnect?.error;
      const statusCode = error?.output?.statusCode;

      if (
        error?.message?.includes("Bad MAC") ||
        error?.toString()?.includes("Bad MAC")
      ) {
        errorLog("Bad MAC error na desconexão detectado");

        if (badMacHandler.handleError(error, "connection.update")) {
          if (badMacHandler.hasReachedLimit()) {
            warningLog(
              "Limite de erros Bad MAC atingido. Limpando arquivos de sessão problemáticos...",
            );
            badMacHandler.clearProblematicSessionFiles();
            badMacHandler.resetErrorCount();

            scheduleReconnect();
            return;
          }
        }
      }

      if (statusCode === DisconnectReason.loggedOut) {
        errorLog("Bot desconectado!");
        errorLog(
          'A sessão foi encerrada no WhatsApp. Apague a pasta "assets/auth/baileys" (ou rode "bash reset-qr-auth.sh") e inicie o bot novamente para parear.',
        );
      } else {
        switch (statusCode) {
          case DisconnectReason.badSession: {
            warningLog("Sessão inválida!");

            const sessionError = new Error("Bad session detected");
            if (badMacHandler.handleError(sessionError, "badSession")) {
              if (badMacHandler.hasReachedLimit()) {
                warningLog(
                  "Limite de erros de sessão atingido. Limpando arquivos de sessão...",
                );
                badMacHandler.clearProblematicSessionFiles();
                badMacHandler.resetErrorCount();
              }
            }
            break;
          }
          case DisconnectReason.connectionClosed:
            warningLog("Conexão fechada!");
            break;
          case DisconnectReason.connectionLost:
            warningLog("Conexão perdida!");
            break;
          case DisconnectReason.connectionReplaced:
            warningLog("Conexão substituída!");
            break;
          case DisconnectReason.multideviceMismatch:
            warningLog("Dispositivo incompatível!");
            break;
          case DisconnectReason.forbidden:
            warningLog("Conexão proibida!");
            break;
          case DisconnectReason.restartRequired:
            infoLog("Reinício necessário, reconectando...");
            break;
          case DisconnectReason.unavailableService:
            warningLog("Serviço indisponível!");
            break;
        }

        scheduleReconnect();
      }
    } else if (connection === "open") {
      clearScreenWithBanner();
      successLog("✅ Bot iniciado com sucesso!");
      successLog("Fui conectado com sucesso!");
      infoLog("Versão do WhatsApp Web: " + version.join("."));
      successLog(
        `✅ Estou pronto para uso! 
Verifique o prefixo, digitando a palavra "prefixo" no WhatsApp. 
O prefixo padrão definido no config.js é ${PREFIX}`,
      );
      badMacHandler.resetErrorCount();
      reconnectAttempts = 0;
    } else if (connection === "connecting") {
      infoLog("Conectando...");
    } else {
      infoLog("Atualizando conexão...");
    }
  });

  socket.ev.on("creds.update", saveCreds);

  return socket;
}
