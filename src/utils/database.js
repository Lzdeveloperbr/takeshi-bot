/**
 * Funções úteis para trabalhar
 * com dados.
 *
 * @author Dev Gui
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { PREFIX, SPIDER_API_TOKEN } from "../config.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const databasePath = path.resolve(__dirname, "..", "..", "database");

const AFK_GROUPS_FILE = "afk-groups";
const ANTI_LINK_GROUPS_FILE = "anti-link-groups";
const AUTO_RESPONDER_FILE = "auto-responder";
const AUTO_RESPONDER_GROUPS_FILE = "auto-responder-groups";
const AUTO_STICKER_GROUPS_FILE = "auto-sticker-groups";
const CONFIG_FILE = "config";
const EXIT_GROUPS_FILE = "exit-groups";
const GROUP_RESTRICTIONS_FILE = "group-restrictions";
const GROUP_RULES_FILE = "group-rules";
const ACTIVITY_FILE = "activity";
const BANNED_WORDS_FILE = "banned-words";
const ECONOMY_FILE = "economy";
const DISABLED_COMMANDS_FILE = "disabled-commands";
const INACTIVE_GROUPS_FILE = "inactive-groups";
const MUTE_FILE = "muted";
const ONLY_ADMINS_FILE = "only-admins";
const PREFIX_GROUPS_FILE = "prefix-groups";
const RESTRICTED_MESSAGES_FILE = "restricted-messages";
const WELCOME_GROUPS_FILE = "welcome-groups";

function ensureDatabaseDir() {
  if (!fs.existsSync(databasePath)) {
    fs.mkdirSync(databasePath, { recursive: true });
  }
}

/**
 * Escrita atômica: grava em um arquivo temporário e depois renomeia.
 * Evita que um JSON fique pela metade (corrompido) caso o bot seja
 * encerrado no meio da gravação.
 */
function atomicWriteFileSync(fullPath, content) {
  const tempPath = `${fullPath}.${process.pid}.tmp`;

  fs.writeFileSync(tempPath, content, "utf8");
  fs.renameSync(tempPath, fullPath);
}

function createIfNotExists(fullPath, formatIfNotExists = []) {
  if (!fs.existsSync(fullPath)) {
    ensureDatabaseDir();
    atomicWriteFileSync(fullPath, JSON.stringify(formatIfNotExists));
  }
}

function readJSON(jsonFile, formatIfNotExists = []) {
  const fullPath = path.resolve(databasePath, `${jsonFile}.json`);

  createIfNotExists(fullPath, formatIfNotExists);

  const content = fs.readFileSync(fullPath, "utf8");

  try {
    const parsed = JSON.parse(content);

    // Arquivo com formato errado (ex.: '"{}"' gravado por versões antigas):
    // devolve o formato padrão em vez de quebrar quem lê.
    const expectsArray = Array.isArray(formatIfNotExists);
    const isValid = expectsArray
      ? Array.isArray(parsed)
      : parsed !== null && typeof parsed === "object" && !Array.isArray(parsed);

    if (
      formatIfNotExists !== null &&
      typeof formatIfNotExists === "object" &&
      !isValid
    ) {
      return structuredClone(formatIfNotExists);
    }

    return parsed;
  } catch (error) {
    // Um JSON corrompido não deve derrubar o processamento de todas as
    // mensagens. Guardamos uma cópia para análise e recriamos o arquivo.
    const backupPath = `${fullPath}.corrupted-${Date.now()}`;

    try {
      fs.copyFileSync(fullPath, backupPath);
    } catch {
      // Ignora falha ao criar backup.
    }

    console.error(
      `[database] ${jsonFile}.json estava corrompido (${error.message}). ` +
        `Backup salvo em ${path.basename(backupPath)} e arquivo recriado.`,
    );

    atomicWriteFileSync(fullPath, JSON.stringify(formatIfNotExists));

    return structuredClone(formatIfNotExists);
  }
}

function writeJSON(jsonFile, data, formatIfNotExists = []) {
  const fullPath = path.resolve(databasePath, `${jsonFile}.json`);

  createIfNotExists(fullPath, formatIfNotExists);

  atomicWriteFileSync(fullPath, JSON.stringify(data, null, 2));
}

export function setAfkMember(groupId, memberId, reason) {
  const afkGroups = readJSON(AFK_GROUPS_FILE, {});

  if (!afkGroups[groupId]) {
    afkGroups[groupId] = {};
  }

  afkGroups[groupId][memberId] = reason.trim();

  writeJSON(AFK_GROUPS_FILE, afkGroups, {});
}

export function getAfkReason(groupId, memberId) {
  const afkGroups = readJSON(AFK_GROUPS_FILE, {});

  return afkGroups[groupId]?.[memberId] || null;
}

export function listAfkMembers(groupId) {
  const afkGroups = readJSON(AFK_GROUPS_FILE, {});

  return { ...(afkGroups[groupId] || {}) };
}

export function removeAfkMember(groupId, memberId) {
  const afkGroups = readJSON(AFK_GROUPS_FILE, {});

  if (!afkGroups[groupId]?.[memberId]) {
    return false;
  }

  delete afkGroups[groupId][memberId];

  if (!Object.keys(afkGroups[groupId]).length) {
    delete afkGroups[groupId];
  }

  writeJSON(AFK_GROUPS_FILE, afkGroups, {});

  return true;
}

export function activateExitGroup(groupId) {
  const filename = EXIT_GROUPS_FILE;

  const exitGroups = readJSON(filename);

  if (!exitGroups.includes(groupId)) {
    exitGroups.push(groupId);
  }

  writeJSON(filename, exitGroups);
}

export function deactivateExitGroup(groupId) {
  const filename = EXIT_GROUPS_FILE;

  const exitGroups = readJSON(filename);

  const index = exitGroups.indexOf(groupId);

  if (index === -1) {
    return;
  }

  exitGroups.splice(index, 1);

  writeJSON(filename, exitGroups);
}

export function isActiveExitGroup(groupId) {
  const filename = EXIT_GROUPS_FILE;

  const exitGroups = readJSON(filename);

  return exitGroups.includes(groupId);
}

export function activateWelcomeGroup(groupId) {
  const filename = WELCOME_GROUPS_FILE;

  const welcomeGroups = readJSON(filename);

  if (!welcomeGroups.includes(groupId)) {
    welcomeGroups.push(groupId);
  }

  writeJSON(filename, welcomeGroups);
}

export function deactivateWelcomeGroup(groupId) {
  const filename = WELCOME_GROUPS_FILE;

  const welcomeGroups = readJSON(filename);

  const index = welcomeGroups.indexOf(groupId);

  if (index === -1) {
    return;
  }

  welcomeGroups.splice(index, 1);

  writeJSON(filename, welcomeGroups);
}

export function isActiveWelcomeGroup(groupId) {
  const filename = WELCOME_GROUPS_FILE;

  const welcomeGroups = readJSON(filename);

  return welcomeGroups.includes(groupId);
}

export function activateGroup(groupId) {
  const filename = INACTIVE_GROUPS_FILE;

  const inactiveGroups = readJSON(filename);

  const index = inactiveGroups.indexOf(groupId);

  if (index === -1) {
    return;
  }

  inactiveGroups.splice(index, 1);

  writeJSON(filename, inactiveGroups);
}

export function deactivateGroup(groupId) {
  const filename = INACTIVE_GROUPS_FILE;

  const inactiveGroups = readJSON(filename);

  if (!inactiveGroups.includes(groupId)) {
    inactiveGroups.push(groupId);
  }

  writeJSON(filename, inactiveGroups);
}

export function isActiveGroup(groupId) {
  const filename = INACTIVE_GROUPS_FILE;

  const inactiveGroups = readJSON(filename);

  return !inactiveGroups.includes(groupId);
}

export function getAutoResponderResponse(match) {
  const filename = AUTO_RESPONDER_FILE;

  const responses = readJSON(filename);

  const matchUpperCase = match.toLocaleUpperCase();

  const data = responses.find(
    (response) => response.match.toLocaleUpperCase() === matchUpperCase
  );

  if (!data) {
    return null;
  }

  return data.answer;
}

export function activateAutoResponderGroup(groupId) {
  const filename = AUTO_RESPONDER_GROUPS_FILE;

  const autoResponderGroups = readJSON(filename);

  if (!autoResponderGroups.includes(groupId)) {
    autoResponderGroups.push(groupId);
  }

  writeJSON(filename, autoResponderGroups);
}

export function deactivateAutoResponderGroup(groupId) {
  const filename = AUTO_RESPONDER_GROUPS_FILE;

  const autoResponderGroups = readJSON(filename);

  const index = autoResponderGroups.indexOf(groupId);

  if (index === -1) {
    return;
  }

  autoResponderGroups.splice(index, 1);

  writeJSON(filename, autoResponderGroups);
}

export function isActiveAutoResponderGroup(groupId) {
  const filename = AUTO_RESPONDER_GROUPS_FILE;

  const autoResponderGroups = readJSON(filename);

  return autoResponderGroups.includes(groupId);
}

export function activateAntiLinkGroup(groupId) {
  const filename = ANTI_LINK_GROUPS_FILE;

  const antiLinkGroups = readJSON(filename);

  if (!antiLinkGroups.includes(groupId)) {
    antiLinkGroups.push(groupId);
  }

  writeJSON(filename, antiLinkGroups);
}

export function deactivateAntiLinkGroup(groupId) {
  const filename = ANTI_LINK_GROUPS_FILE;

  const antiLinkGroups = readJSON(filename);

  const index = antiLinkGroups.indexOf(groupId);

  if (index === -1) {
    return;
  }

  antiLinkGroups.splice(index, 1);

  writeJSON(filename, antiLinkGroups);
}

export function isActiveAntiLinkGroup(groupId) {
  const filename = ANTI_LINK_GROUPS_FILE;

  const antiLinkGroups = readJSON(filename);

  return antiLinkGroups.includes(groupId);
}

export function activateAutoStickerGroup(groupId) {
  const filename = AUTO_STICKER_GROUPS_FILE;

  const autoStickerGroups = readJSON(filename);

  if (!autoStickerGroups.includes(groupId)) {
    autoStickerGroups.push(groupId);
  }

  writeJSON(filename, autoStickerGroups);
}

export function deactivateAutoStickerGroup(groupId) {
  const filename = AUTO_STICKER_GROUPS_FILE;

  const autoStickerGroups = readJSON(filename);

  const index = autoStickerGroups.indexOf(groupId);

  if (index === -1) {
    return;
  }

  autoStickerGroups.splice(index, 1);

  writeJSON(filename, autoStickerGroups);
}

export function isActiveAutoStickerGroup(groupId) {
  const filename = AUTO_STICKER_GROUPS_FILE;

  const autoStickerGroups = readJSON(filename);

  return autoStickerGroups.includes(groupId);
}

export function muteMember(groupId, memberId) {
  const filename = MUTE_FILE;

  const mutedMembers = readJSON(filename, {});

  if (!mutedMembers[groupId]) {
    mutedMembers[groupId] = [];
  }

  if (!mutedMembers[groupId]?.includes(memberId)) {
    mutedMembers[groupId].push(memberId);
  }

  writeJSON(filename, mutedMembers, {});
}

export function unmuteMember(groupId, memberId) {
  const filename = MUTE_FILE;

  const mutedMembers = readJSON(filename, {});

  if (!mutedMembers[groupId]) {
    return;
  }

  const index = mutedMembers[groupId].indexOf(memberId);

  if (index !== -1) {
    mutedMembers[groupId].splice(index, 1);
  }

  writeJSON(filename, mutedMembers, {});
}

export function checkIfMemberIsMuted(groupId, memberId) {
  const filename = MUTE_FILE;

  const mutedMembers = readJSON(filename, {});

  if (!mutedMembers[groupId]) {
    return false;
  }

  return mutedMembers[groupId]?.includes(memberId);
}

export function activateOnlyAdmins(groupId) {
  const filename = ONLY_ADMINS_FILE;

  const onlyAdminsGroups = readJSON(filename, []);

  if (!onlyAdminsGroups.includes(groupId)) {
    onlyAdminsGroups.push(groupId);
  }

  writeJSON(filename, onlyAdminsGroups);
}

export function deactivateOnlyAdmins(groupId) {
  const filename = ONLY_ADMINS_FILE;

  const onlyAdminsGroups = readJSON(filename, []);

  const index = onlyAdminsGroups.indexOf(groupId);
  if (index === -1) {
    return;
  }

  onlyAdminsGroups.splice(index, 1);

  writeJSON(filename, onlyAdminsGroups);
}

export function isActiveOnlyAdmins(groupId) {
  const filename = ONLY_ADMINS_FILE;

  const onlyAdminsGroups = readJSON(filename, []);

  return onlyAdminsGroups.includes(groupId);
}

export function readGroupRestrictions() {
  return readJSON(GROUP_RESTRICTIONS_FILE, {});
}

export function saveGroupRestrictions(restrictions) {
  writeJSON(GROUP_RESTRICTIONS_FILE, restrictions, {});
}

export function isActiveGroupRestriction(groupId, restriction) {
  const restrictions = readGroupRestrictions();

  if (!restrictions[groupId]) {
    return false;
  }

  return restrictions[groupId][restriction] === true;
}

export function updateIsActiveGroupRestriction(groupId, restriction, isActive) {
  const restrictions = readGroupRestrictions();

  if (!restrictions[groupId]) {
    restrictions[groupId] = {};
  }

  restrictions[groupId][restriction] = isActive;

  saveGroupRestrictions(restrictions);
}

export function readRestrictedMessageTypes() {
  return readJSON(RESTRICTED_MESSAGES_FILE, {
    sticker: "stickerMessage",
    video: "videoMessage",
    image: "imageMessage",
    audio: "audioMessage",
    product: "productMessage",
    document: "documentMessage",
    event: "eventMessage",
  });
}

export function setPrefix(groupJid, prefix) {
  const filename = PREFIX_GROUPS_FILE;

  const prefixGroups = readJSON(filename, {});

  prefixGroups[groupJid] = prefix;

  writeJSON(filename, prefixGroups, {});
}

export function getPrefix(groupJid) {
  const filename = PREFIX_GROUPS_FILE;

  const prefixGroups = readJSON(filename, {});

  return prefixGroups[groupJid] || PREFIX;
}

export function listAutoResponderItems() {
  const filename = AUTO_RESPONDER_FILE;
  const responses = readJSON(filename, []);

  return responses.map((item, index) => ({
    key: index + 1,
    match: item.match,
    answer: item.answer,
  }));
}

export function addAutoResponderItem(match, answer) {
  const filename = AUTO_RESPONDER_FILE;
  const responses = readJSON(filename, []);

  const matchUpperCase = match.toLocaleUpperCase();

  const existingItem = responses.find(
    (response) => response.match.toLocaleUpperCase() === matchUpperCase
  );

  if (existingItem) {
    return false;
  }

  responses.push({
    match: match.trim(),
    answer: answer.trim(),
  });

  writeJSON(filename, responses, []);

  return true;
}

export function removeAutoResponderItemByKey(key) {
  const filename = AUTO_RESPONDER_FILE;
  const responses = readJSON(filename, []);

  const index = key - 1;

  if (index < 0 || index >= responses.length) {
    return false;
  }

  responses.splice(index, 1);

  writeJSON(filename, responses, []);

  return true;
}

export function setSpiderApiToken(token) {
  const filename = CONFIG_FILE;

  const config = readJSON(filename, {});

  config.spider_api_token = token;

  writeJSON(filename, config, {});
}

export function getSpiderApiToken() {
  const filename = CONFIG_FILE;

  const config = readJSON(filename, {});

  return config.spider_api_token || SPIDER_API_TOKEN;
}

export function setGroupRules(groupId, rules) {
  const groupRules = readJSON(GROUP_RULES_FILE, {});

  groupRules[groupId] = rules.trim();

  writeJSON(GROUP_RULES_FILE, groupRules, {});
}

export function getGroupRules(groupId) {
  const groupRules = readJSON(GROUP_RULES_FILE, {});

  return groupRules[groupId] || null;
}

export function removeGroupRules(groupId) {
  const groupRules = readJSON(GROUP_RULES_FILE, {});

  if (!groupRules[groupId]) {
    return false;
  }

  delete groupRules[groupId];

  writeJSON(GROUP_RULES_FILE, groupRules, {});

  return true;
}

/**
 * Soma contagens de mensagens por membro.
 * @param {Record<string, Record<string, number>>} delta grupo -> membro -> quantidade
 */
export function addActivityCounts(delta) {
  const activity = readJSON(ACTIVITY_FILE, {});

  for (const [groupId, members] of Object.entries(delta)) {
    activity[groupId] ??= { since: Date.now(), members: {} };

    for (const [memberId, count] of Object.entries(members)) {
      activity[groupId].members[memberId] =
        (activity[groupId].members[memberId] || 0) + count;
    }
  }

  writeJSON(ACTIVITY_FILE, activity, {});
}

export function getGroupActivity(groupId) {
  const activity = readJSON(ACTIVITY_FILE, {});

  return activity[groupId] || null;
}

export function resetGroupActivity(groupId) {
  const activity = readJSON(ACTIVITY_FILE, {});

  activity[groupId] = { since: Date.now(), members: {} };

  writeJSON(ACTIVITY_FILE, activity, {});
}

export function getBannedWords(groupId) {
  const bannedWords = readJSON(BANNED_WORDS_FILE, {});

  return bannedWords[groupId] || [];
}

/** @returns {boolean} false se a palavra já estava na lista. */
export function addBannedWord(groupId, word) {
  const bannedWords = readJSON(BANNED_WORDS_FILE, {});
  const normalized = word.trim().toLowerCase();

  bannedWords[groupId] ??= [];

  if (!normalized || bannedWords[groupId].includes(normalized)) {
    return false;
  }

  bannedWords[groupId].push(normalized);
  writeJSON(BANNED_WORDS_FILE, bannedWords, {});

  return true;
}

/** @returns {boolean} false se a palavra não estava na lista. */
export function removeBannedWord(groupId, word) {
  const bannedWords = readJSON(BANNED_WORDS_FILE, {});
  const normalized = word.trim().toLowerCase();
  const list = bannedWords[groupId] || [];

  if (!list.includes(normalized)) {
    return false;
  }

  bannedWords[groupId] = list.filter((item) => item !== normalized);
  writeJSON(BANNED_WORDS_FILE, bannedWords, {});

  return true;
}

/**
 * Carteira de moedas de um membro no grupo.
 * @returns {{ coins: number, lastDaily: number, streak: number }}
 */
export function getWallet(groupId, memberId) {
  const economy = readJSON(ECONOMY_FILE, {});

  return { coins: 0, lastDaily: 0, streak: 0, ...(economy[groupId]?.[memberId] || {}) };
}

/**
 * Altera carteiras de forma atômica (lê, aplica e grava de uma vez).
 * @param {string} groupId
 * @param {(wallets: Record<string, {coins: number, lastDaily: number, streak: number}>) => any} change
 */
export function updateWallets(groupId, change) {
  const economy = readJSON(ECONOMY_FILE, {});
  const wallets = economy[groupId] || {};

  const proxy = new Proxy(wallets, {
    get(target, memberId) {
      if (typeof memberId !== "string") return target[memberId];

      // Cria a carteira só uma vez (e completa campos de versões antigas).
      if (!target[memberId] || target[memberId].coins === undefined) {
        target[memberId] = { coins: 0, lastDaily: 0, streak: 0, ...(target[memberId] || {}) };
      }

      return target[memberId];
    },
  });

  const result = change(proxy);

  economy[groupId] = wallets;
  writeJSON(ECONOMY_FILE, economy, {});

  return result;
}

export function getGroupWallets(groupId) {
  const economy = readJSON(ECONOMY_FILE, {});

  return economy[groupId] || {};
}

export function getDisabledCommands(groupId) {
  const disabled = readJSON(DISABLED_COMMANDS_FILE, {});

  return disabled[groupId] || [];
}

/** @returns {boolean} false se já estava no estado pedido. */
export function setCommandDisabled(groupId, commandName, isDisabled) {
  const disabled = readJSON(DISABLED_COMMANDS_FILE, {});
  const list = new Set(disabled[groupId] || []);

  if (list.has(commandName) === isDisabled) {
    return false;
  }

  if (isDisabled) list.add(commandName);
  else list.delete(commandName);

  disabled[groupId] = [...list];
  writeJSON(DISABLED_COMMANDS_FILE, disabled, {});

  return true;
}
