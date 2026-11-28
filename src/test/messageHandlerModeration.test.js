/**
 * Anti-flood e anti-palavra dentro do messageHandler.
 */
import assert from "node:assert";
import fs from "node:fs";
import path from "node:path";
import { after, before, beforeEach, describe, it } from "node:test";
import { messageHandler } from "../middlewares/messageHandler.js";
import * as database from "../utils/database.js";
import { resetFloodTracker } from "../utils/floodTracker.js";
import { useGroupRestrictionsCleanup } from "./helpers/groupRestrictions.js";

const remoteJid = "moderacao-teste@g.us";
const userLid = "555@lid";
const dbDir = path.resolve(import.meta.dirname, "..", "..", "database");
const files = ["muted.json", "banned-words.json"];
const backups = {};

function makeSocket(calls) {
  return {
    groupMetadata: async () => ({ owner: "dono@lid", participants: [{ id: userLid, admin: null }] }),
    groupParticipantsUpdate: async (...args) => calls.push(["remove", ...args]),
    sendMessage: async (...args) => calls.push(["send", ...args]),
  };
}

function message(i, timestampSeconds, extra = {}) {
  return {
    key: { remoteJid, fromMe: false, id: `msg-${i}`, participant: userLid },
    messageTimestamp: timestampSeconds,
    message: { conversation: `oi ${i}` },
    ...extra,
  };
}

beforeEach(() => database.unmuteMember(remoteJid, userLid));

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

describe("messageHandler: anti-flood", () => {
  useGroupRestrictionsCleanup(() => {
    database.updateIsActiveGroupRestriction(remoteJid, "anti-flood", true);
  });

  beforeEach(() => {
    resetFloodTracker();
    database.unmuteMember(remoteJid, userLid);
  });

  it("não silencia por mensagens antigas que chegam de uma vez após reconectar", async () => {
    const calls = [];
    const oldTime = Math.floor(Date.now() / 1000) - 10 * 60;

    for (let i = 0; i < 15; i++) {
      await messageHandler(makeSocket(calls), message(i, oldTime + i));
    }

    assert.strictEqual(database.checkIfMemberIsMuted(remoteJid, userLid), false);
    assert.strictEqual(calls.length, 0);
  });

  it("silencia quem manda muitas mensagens agora", async () => {
    const calls = [];
    const now = Math.floor(Date.now() / 1000);

    for (let i = 0; i < 12; i++) {
      await messageHandler(makeSocket(calls), message(i, now));
    }

    assert.strictEqual(database.checkIfMemberIsMuted(remoteJid, userLid), true);
  });
});

describe("messageHandler: ordem das punições", () => {
  useGroupRestrictionsCleanup(() => {
    database.updateIsActiveGroupRestriction(remoteJid, "anti-palavra", true);
    database.updateIsActiveGroupRestriction(remoteJid, "anti-status-grupo", true);
    database.addBannedWord(remoteJid, "proibida");
  });


  it("anti-status-grupo ainda remove mesmo com palavra proibida", async () => {
    const calls = [];
    const webMessage = {
      key: { remoteJid, fromMe: false, id: "status-1", participant: userLid },
      messageTimestamp: Math.floor(Date.now() / 1000),
      message: { groupStatusMessage: { message: { conversation: "palavra proibida" } } },
    };

    await messageHandler(makeSocket(calls), webMessage);

    assert.deepStrictEqual(calls[0], ["remove", remoteJid, [userLid], "remove"]);
  });

  it("anti-palavra apaga a mensagem e avisa", async () => {
    const calls = [];
    await messageHandler(makeSocket(calls), message(1, Math.floor(Date.now() / 1000), { message: { conversation: "isso é PROIBIDA" } }));

    assert.deepStrictEqual(calls[0][2].delete.id, "msg-1");
    assert.match(calls[1][2].text, /palavra proibida/);
  });
});

describe("messageHandler: retorno para o processamento de comandos", () => {
  useGroupRestrictionsCleanup(() => {
    database.updateIsActiveGroupRestriction(remoteJid, "anti-palavra", true);
    database.addBannedWord(remoteJid, "proibida");
  });

  it("devolve true quando apaga a mensagem (o comando não roda)", async () => {
    const calls = [];
    const moderated = await messageHandler(
      makeSocket(calls),
      message(2, Math.floor(Date.now() / 1000), { message: { conversation: "/ship proibida" } }),
    );
    assert.strictEqual(moderated, true);
  });

  it("devolve false para mensagens normais", async () => {
    const calls = [];
    const moderated = await messageHandler(
      makeSocket(calls),
      message(3, Math.floor(Date.now() / 1000), { message: { conversation: "/ship oi" } }),
    );
    assert.strictEqual(moderated, false);
    assert.deepStrictEqual(calls, []);
  });
});

describe("messageHandler: sem avisos repetidos", () => {
  useGroupRestrictionsCleanup(() => {
    database.updateIsActiveGroupRestriction(remoteJid, "anti-flood", true);
    database.updateIsActiveGroupRestriction(remoteJid, "anti-palavra", true);
    database.addBannedWord(remoteJid, "proibida");
  });

  beforeEach(() => resetFloodTracker());

  it("membro já silenciado não gera novos avisos", async () => {
    database.muteMember(remoteJid, userLid);
    const calls = [];
    const now = Math.floor(Date.now() / 1000);

    for (let i = 0; i < 24; i++) await messageHandler(makeSocket(calls), message(i, now));

    assert.deepStrictEqual(calls, []);
    database.unmuteMember(remoteJid, userLid);
  });

  it("palavra proibida em mensagem antiga (após reconectar) não gera aviso", async () => {
    const calls = [];
    const old = Math.floor(Date.now() / 1000) - 30 * 60;
    await messageHandler(makeSocket(calls), message(9, old, { message: { conversation: "proibida" } }));
    assert.deepStrictEqual(calls, []);
  });
});
