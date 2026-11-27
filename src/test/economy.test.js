/**
 * Testes: economia, forca, nível e comandos desativados.
 */
import assert from "node:assert";
import fs from "node:fs";
import path from "node:path";
import { after, before, describe, it } from "node:test";
import { guess, maskWord } from "../commands/member/funny/forca.js";
import { levelFromMessages } from "../commands/member/nivel.js";
import { getDisabledCommands, setCommandDisabled } from "../utils/database.js";
import {
  addCoins,
  claimDaily,
  DAILY_COOLDOWN_MS,
  getBalance,
  getRichest,
  placeBet,
  transferCoins,
} from "../utils/economy.js";

const dbDir = path.resolve(import.meta.dirname, "..", "..", "database");
const files = ["economy.json", "disabled-commands.json"];
const backups = {};

before(() => {
  for (const name of files) {
    const file = path.join(dbDir, name);
    backups[name] = fs.existsSync(file) ? fs.readFileSync(file, "utf8") : undefined;
  }
});

after(() => {
  for (const name of files) {
    const file = path.join(dbDir, name);
    if (backups[name] === undefined) fs.rmSync(file, { force: true });
    else fs.writeFileSync(file, backups[name]);
  }
});

describe("economia", () => {
  const group = "economia-teste@g.us";

  it("diário: uma vez por período, com bônus de sequência", () => {
    const t = 1_000_000_000_000;
    const first = claimDaily(group, "a@lid", 100, t);
    assert.deepStrictEqual([first.ok, first.amount, first.streak], [true, 100, 1]);

    assert.strictEqual(claimDaily(group, "a@lid", 100, t + 1000).ok, false);

    const second = claimDaily(group, "a@lid", 100, t + DAILY_COOLDOWN_MS + 1);
    assert.deepStrictEqual([second.amount, second.streak], [110, 2]);

    const afterBreak = claimDaily(group, "a@lid", 100, t + 10 * DAILY_COOLDOWN_MS);
    assert.strictEqual(afterBreak.streak, 1);
    assert.strictEqual(getBalance(group, "a@lid"), 310);
  });

  it("pix só com saldo suficiente", () => {
    addCoins(group, "b@lid", 50);
    assert.strictEqual(transferCoins(group, "b@lid", "c@lid", 80).ok, false);
    assert.strictEqual(transferCoins(group, "b@lid", "c@lid", 30).ok, true);
    assert.strictEqual(getBalance(group, "b@lid"), 20);
    assert.strictEqual(getBalance(group, "c@lid"), 30);
  });

  it("aposta ganha dobra, perdida tira", () => {
    addCoins(group, "d@lid", 100);
    assert.strictEqual(placeBet(group, "d@lid", 40, true).balance, 140);
    assert.strictEqual(placeBet(group, "d@lid", 40, false).balance, 100);
    assert.strictEqual(placeBet(group, "d@lid", 500, true).ok, false);
  });

  it("saldo nunca fica negativo e ranking ordena", () => {
    addCoins(group, "e@lid", -999);
    assert.strictEqual(getBalance(group, "e@lid"), 0);
    assert.strictEqual(getRichest(group)[0][0], "a@lid");
  });
});

describe("forca", () => {
  it("acerta letras, erra e perde", () => {
    const game = { word: "gato", guessed: new Set(), wrongLetters: new Set(), errors: 0 };
    assert.strictEqual(guess(game, "a"), "hit");
    assert.strictEqual(guess(game, "a"), "repeated");
    assert.strictEqual(maskWord(game.word, game.guessed), "_ a _ _");
    for (const letter of ["b", "c", "d", "e", "f"]) guess(game, letter);
    assert.strictEqual(guess(game, "h"), "lost");
  });

  it("acerta a palavra inteira (ignora acentos)", () => {
    const game = { word: "jacare", guessed: new Set(), wrongLetters: new Set(), errors: 0 };
    assert.strictEqual(guess(game, "JACARÉ"), "won");
  });
});

describe("nível", () => {
  it("sobe conforme as mensagens", () => {
    assert.strictEqual(levelFromMessages(0).level, 0);
    assert.strictEqual(levelFromMessages(10).level, 1);
    assert.strictEqual(levelFromMessages(1000).level, 10);
    assert.strictEqual(levelFromMessages(9).missing, 1);
  });
});

describe("comandos desativados", () => {
  it("desativa e reativa por grupo", () => {
    const group = "cmds-teste@g.us";
    assert.strictEqual(setCommandDisabled(group, "apostar", true), true);
    assert.strictEqual(setCommandDisabled(group, "apostar", true), false);
    assert.deepStrictEqual(getDisabledCommands(group), ["apostar"]);
    assert.strictEqual(setCommandDisabled(group, "apostar", false), true);
    assert.deepStrictEqual(getDisabledCommands(group), []);
  });
});

describe("/pix", async () => {
  const { default: pix } = await import("../commands/member/economia/pix.js");
  const group = "pix-teste@g.us";

  async function run(fullArgs, extra = {}) {
    let sent;
    await pix.handle({
      isGroup: true,
      remoteJid: group,
      userLid: "pagador@lid",
      fullArgs,
      isReply: false,
      sendText: async (text, mentions) => (sent = { text, mentions }),
      ...extra,
    });
    return sent;
  }

  it("valor antes da menção não vira destinatário", async () => {
    addCoins(group, "pagador@lid", 2_000_000);
    const sent = await run("1000000 @5511999999999");
    assert.deepStrictEqual(sent.mentions, ["pagador@lid", "5511999999999@lid"]);
    assert.strictEqual(getBalance(group, "5511999999999@lid"), 1_000_000);
  });

  it("sem menção nem resposta, mostra o uso", async () => {
    await assert.rejects(run("100000"), /Use:/);
  });

  it("respondendo a alguém", async () => {
    await run("50", { isReply: true, replyLid: "amigo@lid" });
    assert.strictEqual(getBalance(group, "amigo@lid"), 50);
  });
});
