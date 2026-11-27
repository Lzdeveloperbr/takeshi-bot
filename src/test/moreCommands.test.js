/**
 * Testes dos comandos de datas, contagem, aleatório e consultas (sem internet).
 */
import assert from "node:assert";
import { describe, it } from "node:test";
import aleatorio from "../commands/member/utilidades/aleatorio.js";
import contar from "../commands/member/utilidades/contar.js";
import idade from "../commands/member/utilidades/idade.js";
import signo, { findSign } from "../commands/member/utilidades/signo.js";
import { InvalidParameterError } from "../errors/index.js";
import { formatDate, onlyDigits } from "../services/brasil-api.js";
import { parseBrDate } from "../utils/dates.js";

async function run(command, props) {
  const replies = [];
  await command.handle({
    sendReply: async (text) => replies.push(text),
    sendReact: async () => {},
    replyText: "",
    ...props,
  });
  return replies.join("\n");
}

describe("datas", () => {
  it("lê datas no formato brasileiro", () => {
    assert.deepStrictEqual(parseBrDate("25/12/2000"), { day: 25, month: 12, year: 2000 });
    assert.deepStrictEqual(parseBrDate("1-2-99"), { day: 1, month: 2, year: 1999 });
    assert.deepStrictEqual(parseBrDate("25/12"), { day: 25, month: 12, year: null });
    assert.strictEqual(parseBrDate("31/02/2020"), null);
    assert.strictEqual(parseBrDate("abc"), null);
  });

  it("signo correto nas viradas", () => {
    assert.strictEqual(findSign(19, 1)[2], "Capricórnio");
    assert.strictEqual(findSign(20, 1)[2], "Aquário");
    assert.strictEqual(findSign(21, 3)[2], "Áries");
    assert.strictEqual(findSign(22, 12)[2], "Capricórnio");
  });

  it("/signo e /idade usam o texto inteiro (a barra não quebra a data)", async () => {
    assert.match(await run(signo, { fullArgs: "25/12" }), /Capricórnio/);
    assert.match(await run(idade, { fullArgs: "01/01/2000" }), /Idade:\* \d+ anos/);
  });

  it("/idade recusa datas futuras e inválidas", async () => {
    await assert.rejects(run(idade, { fullArgs: "01/01/2999" }), InvalidParameterError);
    await assert.rejects(run(idade, { fullArgs: "25/12" }), InvalidParameterError);
  });
});

describe("contar e aleatório", () => {
  it("/contar conta palavras e linhas", async () => {
    const text = await run(contar, { fullArgs: "olá mundo\nbom dia" });
    assert.match(text, /Palavras: \*4\*/);
    assert.match(text, /Linhas: \*2\*/);
  });

  it("/aleatorio respeita o intervalo", async () => {
    for (let i = 0; i < 20; i++) {
      const value = Number(/saiu: \*(-?\d+)\*/.exec(await run(aleatorio, { fullArgs: "5 7" }))[1]);
      assert.ok(value >= 5 && value <= 7);
    }
  });
});

describe("consultas (formatação)", () => {
  it("formata datas e números", () => {
    assert.strictEqual(formatDate("2024-03-15"), "15/03/2024");
    assert.strictEqual(formatDate(null), "-");
    assert.strictEqual(onlyDigits("00.000.000/0001-91"), "00000000000191");
  });
});

describe("comandos extras", async () => {
  const { toMorse, fromMorse } = await import("../commands/member/texto/morse.js");
  const { toBinary, fromBinary } = await import("../commands/member/texto/binario.js");
  const { upsideDown } = await import("../commands/member/texto/fonte.js");
  const { calculateImc } = await import("../commands/member/utilidades/imc.js");
  const { parseDice } = await import("../commands/member/funny/rolar.js");

  it("morse e binário vão e voltam", () => {
    assert.strictEqual(toMorse("SOS"), "... --- ...");
    assert.strictEqual(fromMorse(toMorse("bom dia")), "bom dia");
    assert.strictEqual(fromBinary(toBinary("olá 😀")), "olá 😀");
  });

  it("texto de cabeça para baixo", () => {
    assert.strictEqual(upsideDown("abc!"), "¡ɔqɐ");
  });

  it("IMC nas faixas certas", () => {
    assert.strictEqual(calculateImc(70, 1.75).label, "Peso normal");
    assert.strictEqual(calculateImc(50, 1.8).label, "Abaixo do peso");
    assert.strictEqual(calculateImc(100, 1.7).label, "Obesidade grau I");
  });

  it("lê dados de RPG", () => {
    assert.deepStrictEqual(parseDice("2d6+3"), { count: 2, sides: 6, modifier: 3 });
    assert.deepStrictEqual(parseDice("d20"), { count: 1, sides: 20, modifier: 0 });
    assert.strictEqual(parseDice("100d6"), null);
    assert.strictEqual(parseDice("abc"), null);
  });
});
