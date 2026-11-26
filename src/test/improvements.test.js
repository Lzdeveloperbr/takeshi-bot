/**
 * Testes: anti-flood, sugestão de comandos, limpeza de temporários e
 * variáveis das mensagens de boas-vindas.
 */
import assert from "node:assert";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { after, before, describe, it } from "node:test";
import { replaceGroupPlaceholders } from "../middlewares/onGroupParticipantsUpdate.js";
import {
  checkCommandCooldown,
  COMMAND_COOLDOWN_MS,
  resetCommandCooldowns,
} from "../utils/cooldown.js";
import { findCommandImport, formatCommand, suggestCommand } from "../utils/index.js";
import { cleanTempDir, trimLogs } from "../utils/tempCleaner.js";

describe("anti-flood", () => {
  it("bloqueia comandos seguidos e avisa só uma vez", () => {
    resetCommandCooldowns();
    const t = 1_000_000;

    assert.strictEqual(checkCommandCooldown("g:u", t).allowed, true);

    const second = checkCommandCooldown("g:u", t + 500);
    assert.strictEqual(second.allowed, false);
    assert.strictEqual(second.shouldWarn, true);
    assert.strictEqual(second.remainingSeconds, 3);

    assert.strictEqual(checkCommandCooldown("g:u", t + 900).shouldWarn, false);
    assert.strictEqual(checkCommandCooldown("g:outro", t + 900).allowed, true);
    assert.strictEqual(checkCommandCooldown("g:u", t + COMMAND_COOLDOWN_MS).allowed, true);
  });
});

describe("sugestão de comandos", () => {
  it("corrige erros de digitação", async () => {
    assert.strictEqual(await suggestCommand(formatCommand("plya")), "play");
    assert.strictEqual(await suggestCommand(formatCommand("stiker")), "sticker");
    assert.strictEqual(await suggestCommand(formatCommand("reagras")), "regras");
  });

  it("não sugere nada para textos sem relação", async () => {
    assert.strictEqual(await suggestCommand(formatCommand("abcdefgh")), null);
    assert.strictEqual(await suggestCommand("a"), null);
  });

  it("o índice encontra comandos pelos apelidos", async () => {
    assert.strictEqual((await findCommandImport("help")).command.name, "menu");
    assert.strictEqual((await findCommandImport("setregras")).type, "admin");
    assert.strictEqual((await findCommandImport("naoexiste")).command, null);
  });
});

describe("limpeza de temporários", () => {
  it("remove só arquivos antigos e preserva os logs", () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), "temp-clean-"));
    const old = path.join(dir, "velho.mp4");
    const recent = path.join(dir, "novo.mp4");
    const log = path.join(dir, "wa-logs.txt");

    for (const file of [old, recent, log]) fs.writeFileSync(file, "x".repeat(10));

    const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000);
    fs.utimesSync(old, twoHoursAgo, twoHoursAgo);
    fs.utimesSync(log, twoHoursAgo, twoHoursAgo);

    const result = cleanTempDir({ dir });

    assert.strictEqual(result.removed, 1);
    assert.ok(!fs.existsSync(old));
    assert.ok(fs.existsSync(recent));
    assert.ok(fs.existsSync(log));

    assert.strictEqual(trimLogs({ dir, maxBytes: 5 }), 1);
    assert.strictEqual(fs.statSync(log).size, 0);

    fs.rmSync(dir, { recursive: true, force: true });
  });
});

describe("variáveis das mensagens de boas-vindas", () => {
  const socket = {
    groupMetadata: async () => ({ subject: "Grupo Teste", participants: [{}, {}, {}] }),
  };

  it("troca @group, @count e @prefix", async () => {
    const text = await replaceGroupPlaceholders(
      "Bem-vindo ao @group! Somos @count. Use @prefixmenu",
      socket,
      "placeholder-teste@g.us",
    );
    assert.strictEqual(text, "Bem-vindo ao Grupo Teste! Somos 3. Use /menu");
  });

  it("funciona mesmo se não conseguir ler o grupo", async () => {
    const failing = { groupMetadata: async () => { throw new Error("x"); } };
    const text = await replaceGroupPlaceholders("Oi @group", failing, "x@g.us");
    assert.strictEqual(text, "Oi grupo");
  });
});

describe("ranking de ativos", async () => {
  const { countMessage, flushActivity, getActivity, resetActivity } = await import("../utils/activity.js");
  const group = "rank-teste@g.us";
  const activityFile = path.resolve(import.meta.dirname, "..", "..", "database", "activity.json");
  let backup;

  before(() => {
    backup = fs.existsSync(activityFile) ? fs.readFileSync(activityFile, "utf8") : undefined;
  });

  after(() => {
    if (backup === undefined) fs.rmSync(activityFile, { force: true });
    else fs.writeFileSync(activityFile, backup);
  });

  it("conta mensagens, salva e zera", () => {
    resetActivity(group);
    countMessage(group, "1@lid");
    countMessage(group, "1@lid");
    countMessage(group, "2@lid");
    countMessage("privado@s.whatsapp.net", "1@lid");

    assert.deepStrictEqual(getActivity(group).members, { "1@lid": 2, "2@lid": 1 });

    flushActivity();
    countMessage(group, "2@lid");
    assert.deepStrictEqual(getActivity(group).members, { "1@lid": 2, "2@lid": 2 });

    flushActivity();
    resetActivity(group);
    assert.deepStrictEqual(getActivity(group).members, {});
  });
});
