/**
 * Testes dos comandos utilitários adicionados.
 */
import assert from "node:assert";
import { describe, it } from "node:test";
import { calculate } from "../commands/member/utilidades/calc.js";
import { getGroupRules, removeGroupRules, setGroupRules } from "../utils/database.js";
import { extractDataFromMessage } from "../utils/index.js";

describe("calc", () => {
  it("respeita a precedência dos operadores", () => {
    assert.strictEqual(calculate("2+3*4"), 14);
    assert.strictEqual(calculate("(2+3)*4"), 20);
    assert.strictEqual(calculate("2^3^2"), 512);
    assert.strictEqual(calculate("-2^2"), -4);
  });

  it("aceita vírgula decimal e x como multiplicação", () => {
    assert.strictEqual(calculate("1,5 x 2"), 3);
    assert.strictEqual(calculate("10 % 3"), 1);
  });

  it("rejeita expressões inválidas ou perigosas", () => {
    assert.throws(() => calculate("process.exit()"));
    assert.throws(() => calculate("1/0"));
    assert.throws(() => calculate("(1+2"));
    assert.throws(() => calculate("2+"));
  });
});

describe("regras do grupo", () => {
  const groupId = "regras-teste@g.us";

  it("salva, lê e remove as regras", () => {
    setGroupRules(groupId, "  1. Sem spam\n2. Respeito  ");
    assert.strictEqual(getGroupRules(groupId), "1. Sem spam\n2. Respeito");
    assert.strictEqual(removeGroupRules(groupId), true);
    assert.strictEqual(getGroupRules(groupId), null);
    assert.strictEqual(removeGroupRules(groupId), false);
  });
});

describe("leitura do comando", () => {
  const parse = (text) =>
    extractDataFromMessage({
      key: { remoteJid: "1@g.us", participant: "2@lid", id: "X" },
      message: { conversation: text },
    });

  it("reconhece o comando seguido de quebra de linha", () => {
    const data = parse("/set-regras\n1. Sem spam\n2. Respeito");
    assert.strictEqual(data.commandName, "setregras");
    assert.match(data.fullArgs, /1\. Sem spam/);
    assert.strictEqual(data.prefix, "/");
  });

  it("mantém o comportamento com espaço", () => {
    const data = parse("/escolher a | b");
    assert.deepStrictEqual(data.args, ["a", "b"]);
    assert.strictEqual(data.fullArgs, "a | b");
  });

  it("comando sem argumentos", () => {
    const data = parse("/menu");
    assert.deepStrictEqual(data.args, []);
    assert.strictEqual(data.fullArgs, "");
  });
});
