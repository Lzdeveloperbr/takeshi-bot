/**
 * Testes das correções da 2ª revisão de código.
 */
import assert from "node:assert";
import { describe, it } from "node:test";
import { calculate } from "../commands/member/utilidades/calc.js";
import { deliverReminder } from "../commands/member/utilidades/lembrete.js";
import { fromBinary } from "../commands/member/texto/binario.js";
import forca from "../commands/member/funny/forca.js";
import { getGame, resetGames, startGame } from "../utils/games.js";
import { getMentionedJids, resolveTarget } from "../utils/mentions.js";

describe("menções", () => {
  const withMentions = (jids) => ({
    message: { extendedTextMessage: { text: "x", contextInfo: { mentionedJid: jids } } },
  });

  it("usa as menções reais do WhatsApp (inclusive número de telefone)", () => {
    const webMessage = withMentions(["5511888888888:3@s.whatsapp.net"]);
    assert.deepStrictEqual(getMentionedJids(webMessage), ["5511888888888@s.whatsapp.net"]);
    assert.strictEqual(
      resolveTarget({ webMessage, fullArgs: "1000000 @5511888888888", userLid: "1@s.whatsapp.net" }),
      "5511888888888@s.whatsapp.net",
    );
  });

  it("sem menção real, monta o ID no formato de quem enviou", () => {
    assert.strictEqual(resolveTarget({ fullArgs: "@123456789", userLid: "9@s.whatsapp.net" }), "123456789@s.whatsapp.net");
    assert.strictEqual(resolveTarget({ fullArgs: "@123456789", userLid: "9@lid" }), "123456789@lid");
    assert.strictEqual(resolveTarget({ fullArgs: "100", isReply: true, replyLid: "r@lid" }), "r@lid");
    assert.strictEqual(resolveTarget({ fullArgs: "100" }), null);
  });
});

describe("lembretes", () => {
  it("enviam pela conexão atual, não pela antiga", async () => {
    const sent = [];
    let socket = { user: {}, sendMessage: async () => { throw new Error("fechada"); } };
    const getSocket = () => socket;

    socket = { user: {}, sendMessage: async (jid, content) => sent.push([jid, content.text]) };
    await deliverReminder("g@g.us", "u@lid", "beber água", 1, getSocket);

    assert.strictEqual(sent.length, 1);
    assert.match(sent[0][1], /beber água/);
  });
});

describe("forca", () => {
  it("jogo só expira após 5 minutos sem jogadas", () => {
    resetGames();
    const t = 1_000_000;
    startGame("g", "forca", { word: "x" }, t);
    assert.ok(getGame("g", "forca", t + 4 * 60_000));
    assert.ok(getGame("g", "forca", t + 8 * 60_000), "jogada recente renova o prazo");
    assert.strictEqual(getGame("g", "forca", t + 14 * 60_000), null);
  });

  it("chute sem jogo valendo começa um novo sem aplicar o chute", async () => {
    resetGames();
    const replies = [];
    await forca.handle({
      fullArgs: "a",
      remoteJid: "forca-expirada@g.us",
      userLid: "u@lid",
      sendReply: async (t) => replies.push(t),
      sendText: async (t) => replies.push(t),
      sendReact: async () => {},
    });

    assert.match(replies[0], /Não havia jogo valendo/);
    const game = getGame("forca-expirada@g.us", "forca");
    assert.strictEqual(game.guessed.size + game.wrongLetters.size, 0);
  });
});

describe("calculadora e binário", () => {
  it("porcentagem e resto", () => {
    assert.strictEqual(calculate("50%"), 0.5);
    assert.strictEqual(calculate("200*10%"), 20);
    assert.strictEqual(calculate("10%3"), 1);
  });

  it("binário com ou sem espaços", () => {
    assert.strictEqual(fromBinary("0110111101101001"), "oi");
    assert.strictEqual(fromBinary("01101111 01101001"), "oi");
  });
});
