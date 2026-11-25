import { PREFIX } from "../../../config.js";
import { InvalidParameterError } from "../../../errors/index.js";

/**
 * Calculadora segura (sem eval): suporta + - * / % ^, parênteses,
 * números decimais (com ponto ou vírgula) e "x" como multiplicação.
 */
function tokenize(expression) {
  const tokens = [];
  const clean = expression.replace(/\s+/g, "").replace(/,/g, ".").replace(/[x×]/gi, "*").replace(/÷/g, "/");

  for (let i = 0; i < clean.length; ) {
    const char = clean[i];

    if (/[0-9.]/.test(char)) {
      let number = "";
      while (i < clean.length && /[0-9.]/.test(clean[i])) number += clean[i++];
      if ((number.match(/\./g) || []).length > 1) throw new Error("número inválido");
      tokens.push({ type: "num", value: Number.parseFloat(number) });
      continue;
    }

    if ("+-*/%^()".includes(char)) {
      tokens.push({ type: "op", value: char });
      i++;
      continue;
    }

    throw new Error(`caractere inválido "${char}"`);
  }

  return tokens;
}

function evaluate(expression) {
  const tokens = tokenize(expression);
  let pos = 0;

  const peek = () => tokens[pos];
  const take = () => tokens[pos++];

  // expr := term (('+'|'-') term)*
  const parseExpr = () => {
    let value = parseTerm();
    while (peek()?.value === "+" || peek()?.value === "-") {
      const op = take().value;
      const right = parseTerm();
      value = op === "+" ? value + right : value - right;
    }
    return value;
  };

  // term := unary (('*'|'/'|'%') unary)*
  const parseTerm = () => {
    let value = parseUnary();
    while (["*", "/", "%"].includes(peek()?.value)) {
      const op = take().value;
      const right = parseUnary();
      if ((op === "/" || op === "%") && right === 0) throw new Error("divisão por zero");
      value = op === "*" ? value * right : op === "/" ? value / right : value % right;
    }
    return value;
  };

  // unary := ('-'|'+') unary | power   (assim -2^2 = -4, como na matemática)
  const parseUnary = () => {
    if (peek()?.value === "-") {
      take();
      return -parseUnary();
    }
    if (peek()?.value === "+") {
      take();
      return parseUnary();
    }
    return parsePower();
  };

  // power := primary ('^' unary)?   (associativa à direita: 2^3^2 = 2^9)
  const parsePower = () => {
    const base = parsePrimary();
    if (peek()?.value === "^") {
      take();
      return base ** parseUnary();
    }
    return base;
  };

  const parsePrimary = () => {
    const token = take();
    if (!token) throw new Error("expressão incompleta");
    if (token.type === "num") return token.value;
    if (token.value === "(") {
      const value = parseExpr();
      if (take()?.value !== ")") throw new Error('faltou fechar ")"');
      return value;
    }
    throw new Error(`"${token.value}" fora de lugar`);
  };

  const result = parseExpr();
  if (pos < tokens.length) throw new Error(`"${tokens[pos].value}" fora de lugar`);
  if (!Number.isFinite(result)) throw new Error("resultado muito grande");
  return result;
}

export { evaluate as calculate };

export default {
  name: "calc",
  description: "Calculadora: soma, subtração, multiplicação, divisão, potência e porcentagem.",
  commands: ["calc", "calcular", "calculadora", "conta"],
  usage: `${PREFIX}calc (2+3)*4 ou ${PREFIX}calc 2^10`,
  /**
   * @param {CommandHandleProps} props
   */
  handle: async ({ fullArgs, sendReply, sendReact }) => {
    if (!fullArgs?.trim()) {
      throw new InvalidParameterError(`Digite uma conta! Exemplo: ${PREFIX}calc (2+3)*4`);
    }

    if (fullArgs.length > 200) {
      throw new InvalidParameterError("A conta é muito grande!");
    }

    let result;
    try {
      result = evaluate(fullArgs);
    } catch (error) {
      throw new InvalidParameterError(`Não entendi a conta: ${error.message}.`);
    }

    const formatted = Number.isInteger(result)
      ? result.toLocaleString("pt-BR")
      : result.toLocaleString("pt-BR", { maximumFractionDigits: 10 });

    await sendReact("🧮");
    await sendReply(`🧮 *${fullArgs.trim()}* = *${formatted}*`);
  },
};
