/**
 * Garante que a busca da versão do WhatsApp Web não entra em loop
 * (um erro assim impede o bot de conectar).
 */
import assert from "node:assert";
import { describe, it } from "node:test";
import { getWaVersion } from "../connection.js";

describe("conexão", () => {
  it("obtém a versão do WhatsApp Web e reaproveita na próxima vez", async () => {
    const version = await getWaVersion();
    assert.ok(Array.isArray(version) && version.length === 3, `versão inválida: ${version}`);
    assert.strictEqual(await getWaVersion(), version);
  });
});
