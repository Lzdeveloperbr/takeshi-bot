import { PREFIX } from "../../../config.js";
import { InvalidParameterError } from "../../../errors/index.js";

const CODE = {
  a: ".-", b: "-...", c: "-.-.", d: "-..", e: ".", f: "..-.", g: "--.", h: "....", i: "..", j: ".---",
  k: "-.-", l: ".-..", m: "--", n: "-.", o: "---", p: ".--.", q: "--.-", r: ".-.", s: "...", t: "-",
  u: "..-", v: "...-", w: ".--", x: "-..-", y: "-.--", z: "--..",
  0: "-----", 1: ".----", 2: "..---", 3: "...--", 4: "....-", 5: ".....", 6: "-....", 7: "--...", 8: "---..", 9: "----.",
  ".": ".-.-.-", ",": "--..--", "?": "..--..", "!": "-.-.--", "@": ".--.-.",
};
const DECODE = Object.fromEntries(Object.entries(CODE).map(([k, v]) => [v, k]));

const strip = (text) => text.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();

export function toMorse(text) {
  return strip(text)
    .split(/\s+/)
    .map((word) => [...word].map((c) => CODE[c]).filter(Boolean).join(" "))
    .filter(Boolean)
    .join(" / ");
}

export function fromMorse(code) {
  return code
    .trim()
    .split(/\s*\/\s*|\s{2,}/)
    .map((word) => word.split(/\s+/).map((symbol) => DECODE[symbol] ?? "").join(""))
    .join(" ");
}

export default {
  name: "morse",
  description: "Converte texto em código Morse e vice-versa.",
  commands: ["morse"],
  usage: `${PREFIX}morse sos  |  ${PREFIX}morse ... --- ...`,
  /**
   * @param {CommandHandleProps} props
   */
  handle: async ({ fullArgs, replyText, sendReply }) => {
    const text = fullArgs?.trim() || replyText?.trim();

    if (!text) {
      throw new InvalidParameterError(`Escreva um texto ou código! Exemplo: ${PREFIX}morse sos`);
    }

    const isMorse = /^[.\-/\s]+$/.test(text);
    const result = isMorse ? fromMorse(text) : toMorse(text);

    await sendReply(`📡 *${isMorse ? "Texto" : "Morse"}:*\n\n${result || "Não consegui converter."}`);
  },
};
