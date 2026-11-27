/**
 * dynamicCommand: anti-link remove mesmo se apagar falhar, e sugestão de
 * comando dentro de grupos.
 */
import assert from "node:assert";
import { after, describe, it } from "node:test";
import { activateAntiLinkGroup, deactivateAntiLinkGroup } from "../utils/database.js";
import { dynamicCommand } from "../utils/dynamicCommand.js";
import { resetCommandCooldowns } from "../utils/cooldown.js";

const remoteJid = "dynamic-teste@g.us";
const userLid = "777@lid";

function props(overrides, calls) {
  return {
    commandName: "",
    fullMessage: "",
    prefix: "/",
    remoteJid,
    userLid,
    socket: {
      groupMetadata: async () => ({ owner: "dono@lid", participants: [{ id: userLid, admin: null }] }),
      groupParticipantsUpdate: async (...args) => calls.push(["remove", ...args]),
      sendMessage: async () => {
        throw new Error("falha ao apagar");
      },
    },
    webMessage: { key: { id: "M1", participant: userLid, remoteJid } },
    sendReply: async (text) => calls.push(["reply", text]),
    sendWarningReply: async (text) => calls.push(["warning", text]),
    sendErrorReply: async (text) => calls.push(["error", text]),
    sendReact: async () => {},
    ...overrides,
  };
}

describe("dynamicCommand", () => {
  after(() => deactivateAntiLinkGroup(remoteJid));

  it("anti-link remove o membro mesmo se apagar a mensagem falhar", async () => {
    activateAntiLinkGroup(remoteJid);
    const calls = [];

    await dynamicCommand(props({ fullMessage: "olha https://site-suspeito.com" }, calls), Date.now());

    assert.deepStrictEqual(calls[0], ["remove", remoteJid, [userLid], "remove"]);
    assert.match(calls.at(-1)[1], /removido/);
    deactivateAntiLinkGroup(remoteJid);
  });

  it("sugere o comando certo dentro do grupo", async () => {
    resetCommandCooldowns();
    const calls = [];

    await dynamicCommand(props({ commandName: "plya", fullMessage: "/plya musica" }, calls), Date.now());

    assert.deepStrictEqual(calls, [["warning", "Comando não encontrado! Você quis dizer */play*?"]]);
  });

  it("fica calado no grupo quando não há comando parecido", async () => {
    const calls = [];
    await dynamicCommand(props({ commandName: "xyzxyzxyz", fullMessage: "/xyzxyzxyz" }, calls), Date.now());
    assert.deepStrictEqual(calls, []);
  });
});
