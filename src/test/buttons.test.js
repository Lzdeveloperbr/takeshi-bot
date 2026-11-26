/**
 * Testes do painel de botões.
 */
import assert from "node:assert";
import path from "node:path";
import { describe, it } from "node:test";
import { COMMANDS_DIR } from "../config.js";
import { menuButtons } from "../menu.js";
import { listButton, quickReply, sendButtons } from "../utils/buttons.js";
import { findCommandImport, readDirectoryRecursive } from "../utils/index.js";

describe("botões", () => {
  it("quickReply guarda o comando como id", () => {
    const button = quickReply("Ping", "/ping");
    assert.strictEqual(button.name, "quick_reply");
    assert.deepStrictEqual(JSON.parse(button.buttonParamsJson), {
      display_text: "Ping",
      id: "/ping",
    });
  });

  it("listButton monta seções e itens", () => {
    const button = listButton("Abrir", [
      { title: "Seção", rows: [{ title: "Item", id: "/ping" }] },
    ]);
    const params = JSON.parse(button.buttonParamsJson);
    assert.strictEqual(button.name, "single_select");
    assert.strictEqual(params.sections[0].rows[0].id, "/ping");
  });

  it("sendButtons envia interactiveButtons com imagem e resposta", async () => {
    let sent;
    const socket = {
      sendMessage: async (jid, content, options) => {
        sent = { jid, content, options };
      },
    };

    await sendButtons({
      socket,
      remoteJid: "1@g.us",
      text: "Olá",
      footer: "Rodapé",
      image: Buffer.from("x"),
      buttons: [quickReply("Ping", "/ping")],
      quoted: { key: { id: "A" } },
    });

    assert.strictEqual(sent.jid, "1@g.us");
    assert.strictEqual(sent.content.caption, "Olá");
    assert.strictEqual(sent.content.footer, "Rodapé");
    assert.strictEqual(sent.content.interactiveButtons.length, 1);
    assert.deepStrictEqual(sent.options.quoted, { key: { id: "A" } });
  });

  it("todo botão do painel aponta para um comando que existe", async () => {
    const buttons = menuButtons("painel-teste@g.us");
    const ids = [];

    for (const button of buttons) {
      const params = JSON.parse(button.buttonParamsJson);
      if (params.id) ids.push(params.id);
      for (const section of params.sections || []) {
        assert.ok(section.rows.length <= 10, `seção "${section.title}" com mais de 10 itens`);
        for (const row of section.rows) ids.push(row.id);
      }
    }

    const files = (await readDirectoryRecursive(COMMANDS_DIR)).map((file) =>
      path.basename(file, path.extname(file)),
    );

    for (const id of ids) {
      const [command, firstArg] = id.slice(1).split(" ");
      const { type } = await findCommandImport(command.replace(/-/g, ""));
      assert.ok(type, `comando "${command}" do botão ${id} não existe`);

      if (command === "info") {
        assert.ok(files.includes(firstArg), `arquivo do comando "${firstArg}" não existe`);
      }
    }
  });
});
