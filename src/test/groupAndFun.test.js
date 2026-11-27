/**
 * Testes: anti-flood, anti-palavra, palavras proibidas, mute com arquivo
 * antigo, enquete e jogos (quiz e adivinhar).
 */
import assert from "node:assert";
import fs from "node:fs";
import path from "node:path";
import { after, before, beforeEach, describe, it } from "node:test";
import adivinhar from "../commands/member/funny/adivinhar.js";
import chute from "../commands/member/funny/chute.js";
import quiz from "../commands/member/funny/quiz.js";
import resposta from "../commands/member/funny/resposta.js";
import enquete from "../commands/member/enquete.js";
import { InvalidParameterError, WarningError } from "../errors/index.js";
import {
  addBannedWord,
  checkIfMemberIsMuted,
  getBannedWords,
  muteMember,
  removeBannedWord,
  unmuteMember,
} from "../utils/database.js";
import {
  findBannedWord,
  getMessageText,
  registerMessage,
  resetFloodTracker,
} from "../utils/floodTracker.js";
import { getGame, getScores, resetGames } from "../utils/games.js";

const dbDir = path.resolve(import.meta.dirname, "..", "..", "database");
const backups = {};

function backupFile(name) {
  const file = path.join(dbDir, name);
  backups[name] = fs.existsSync(file) ? fs.readFileSync(file, "utf8") : undefined;
}

function restoreFiles() {
  for (const [name, content] of Object.entries(backups)) {
    const file = path.join(dbDir, name);
    if (content === undefined) fs.rmSync(file, { force: true });
    else fs.writeFileSync(file, content);
  }
}

before(() => {
  backupFile("muted.json");
  backupFile("banned-words.json");
  backupFile("economy.json");
});

after(restoreFiles);

describe("anti-flood", () => {
  it("avisa uma vez e silencia quem continua", () => {
    resetFloodTracker();
    const results = [];
    for (let i = 0; i < 12; i++) results.push(registerMessage("g:u", 1000 + i * 200));

    assert.strictEqual(results.filter((r) => r === "warn").length, 1);
    assert.strictEqual(results.at(-1), "mute");
  });

  it("não pune quem fala devagar", () => {
    resetFloodTracker();
    for (let i = 0; i < 30; i++) {
      assert.strictEqual(registerMessage("g:calmo", i * 3000), "ok");
    }
  });
});

describe("anti-palavra", () => {
  it("acha palavras inteiras, ignorando acentos e maiúsculas", () => {
    assert.strictEqual(findBannedWord("Que PALAVRÃO!", ["palavrao"]), "palavrao");
    assert.strictEqual(findBannedWord("casamento", ["casa"]), null);
    assert.strictEqual(findBannedWord("vou pra casa", ["casa"]), "casa");
  });

  it("lê o texto de legendas e mensagens temporárias", () => {
    assert.strictEqual(getMessageText({ message: { imageMessage: { caption: "oi" } } }), "oi");
    assert.strictEqual(
      getMessageText({ message: { ephemeralMessage: { message: { conversation: "tchau" } } } }),
      "tchau",
    );
  });

  it("adiciona e remove palavras proibidas", () => {
    const group = "palavras-teste@g.us";
    assert.strictEqual(addBannedWord(group, " Feio "), true);
    assert.strictEqual(addBannedWord(group, "feio"), false);
    assert.deepStrictEqual(getBannedWords(group), ["feio"]);
    assert.strictEqual(removeBannedWord(group, "FEIO"), true);
    assert.strictEqual(removeBannedWord(group, "feio"), false);
  });
});

describe("mute", () => {
  it("funciona mesmo com o muted.json antigo gravado como texto", () => {
    fs.writeFileSync(path.join(dbDir, "muted.json"), JSON.stringify("{}"));

    muteMember("mute-teste@g.us", "1@lid");
    assert.strictEqual(checkIfMemberIsMuted("mute-teste@g.us", "1@lid"), true);

    unmuteMember("mute-teste@g.us", "1@lid");
    assert.strictEqual(checkIfMemberIsMuted("mute-teste@g.us", "1@lid"), false);
  });
});

describe("enquete", () => {
  it("cria enquete separando por |", async () => {
    let sent;
    await enquete.handle({
      fullArgs: "Pizza ou hambúrguer? | Pizza | Hambúrguer | Pizza",
      remoteJid: "1@g.us",
      socket: { sendMessage: async (jid, content) => (sent = content) },
    });
    assert.deepStrictEqual(sent.poll.values, ["Pizza", "Hambúrguer"]);
    assert.strictEqual(sent.poll.name, "Pizza ou hambúrguer?");
  });

  it("exige pergunta e 2 opções", async () => {
    await assert.rejects(enquete.handle({ fullArgs: "Só pergunta | uma", socket: {} }), InvalidParameterError);
  });
});

describe("jogos", () => {
  const chat = "jogos-teste@g.us";
  const replies = [];
  const props = (extra) => ({
    remoteJid: chat,
    socket: { sendMessage: async () => {} },
    sendReply: async (t) => replies.push(t),
    sendText: async (t) => replies.push(t),
    sendReact: async () => {},
    ...extra,
  });

  beforeEach(() => {
    resetGames();
    replies.length = 0;
  });

  it("quiz: erro não pontua, acerto pontua e encerra", async () => {
    await quiz.handle(props({}));
    const game = getGame(chat, "quiz");
    assert.ok(game);

    const wrong = ["A", "B", "C"].find((_, i) => i !== game.correct);
    const right = ["A", "B", "C"][game.correct];

    await resposta.handle(props({ args: [wrong], userLid: "1@lid" }));
    await assert.rejects(resposta.handle(props({ args: [right], userLid: "1@lid" })), WarningError);

    await resposta.handle(props({ args: [right], userLid: "2@lid" }));
    assert.strictEqual(getGame(chat, "quiz"), null);
    assert.deepStrictEqual(getScores(chat), [["2@lid", 1]]);
  });

  it("adivinhar: dá dicas e dá 3 pontos a quem acerta", async () => {
    await adivinhar.handle(props({}));
    const { number } = getGame(chat, "adivinhar");

    if (number > 1) {
      await chute.handle(props({ args: [String(number - 1)], userLid: "1@lid" }));
      assert.match(replies.at(-1), /maior/);
    }

    await chute.handle(props({ args: [String(number)], userLid: "1@lid" }));
    assert.strictEqual(getGame(chat, "adivinhar"), null);
    assert.deepStrictEqual(getScores(chat), [["1@lid", 3]]);
  });
});
