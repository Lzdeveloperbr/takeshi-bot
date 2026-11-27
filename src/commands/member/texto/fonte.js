import { PREFIX } from "../../../config.js";
import { InvalidParameterError } from "../../../errors/index.js";

// Cada estilo troca A-Z, a-z e 0-9 por letras Unicode decoradas.
const STYLES = [
  ["Negrito", 0x1d400, 0x1d41a, 0x1d7ce],
  ["Itálico", 0x1d434, 0x1d44e, null],
  ["Negrito itálico", 0x1d468, 0x1d482, null],
  ["Cursiva", 0x1d4d0, 0x1d4ea, null],
  ["Gótico", 0x1d56c, 0x1d586, null],
  ["Contorno", 0x1d538, 0x1d552, 0x1d7d8],
  ["Sem serifa", 0x1d5d4, 0x1d5ee, 0x1d7ec],
  ["Monoespaçado", 0x1d670, 0x1d68a, 0x1d7f6],
];

// Letras que não existem nos blocos acima (ficam em outros pontos do Unicode).
const EXCEPTIONS = {
  0x1d455: "ℎ",
  0x1d53a: "ℂ", 0x1d53f: "ℍ", 0x1d545: "ℕ", 0x1d547: "ℙ", 0x1d548: "ℚ", 0x1d549: "ℝ", 0x1d551: "ℤ",
};

function convert(text, upperStart, lowerStart, digitStart) {
  return [...text]
    .map((char) => {
      const code = char.codePointAt(0);
      let mapped = null;

      if (code >= 65 && code <= 90) mapped = upperStart + code - 65;
      else if (code >= 97 && code <= 122) mapped = lowerStart + code - 97;
      else if (digitStart && code >= 48 && code <= 57) mapped = digitStart + code - 48;

      if (mapped === null) return char;
      return EXCEPTIONS[mapped] || String.fromCodePoint(mapped);
    })
    .join("");
}

const SMALL_CAPS = "ᴀʙᴄᴅᴇꜰɢʜɪᴊᴋʟᴍɴᴏᴘǫʀꜱᴛᴜᴠᴡxʏᴢ";
const BUBBLE_UPPER = 0x24b6;
const BUBBLE_LOWER = 0x24d0;

export default {
  name: "fonte",
  description: "Escreve seu texto em várias fontes diferentes para copiar.",
  commands: ["fonte", "fontes", "letras", "fancy"],
  usage: `${PREFIX}fonte seu texto`,
  /**
   * @param {CommandHandleProps} props
   */
  handle: async ({ fullArgs, replyText, sendReply, sendReact }) => {
    const text = (fullArgs?.trim() || replyText?.trim() || "").slice(0, 100);

    if (!text) {
      throw new InvalidParameterError(`Escreva um texto! Exemplo: ${PREFIX}fonte Scarlett Bot`);
    }

    const lines = STYLES.map(([name, upper, lower, digit]) => `*${name}:*\n${convert(text, upper, lower, digit)}`);

    lines.push(
      `*Versalete:*\n${[...text].map((c) => (/[a-z]/i.test(c) ? SMALL_CAPS[c.toLowerCase().charCodeAt(0) - 97] : c)).join("")}`,
      `*Bolhas:*\n${convert(text, BUBBLE_UPPER, BUBBLE_LOWER, null)}`,
      `*De cabeça para baixo:*\n${upsideDown(text)}`,
    );

    await sendReact("🔤");
    await sendReply(`🔤 *Fontes para copiar*\n\n${lines.join("\n\n")}`);
  },
};

const FLIP = {
  a: "ɐ", b: "q", c: "ɔ", d: "p", e: "ǝ", f: "ɟ", g: "ƃ", h: "ɥ", i: "ᴉ", j: "ɾ", k: "ʞ", l: "l", m: "ɯ",
  n: "u", o: "o", p: "d", q: "b", r: "ɹ", s: "s", t: "ʇ", u: "n", v: "ʌ", w: "ʍ", x: "x", y: "ʎ", z: "z",
  "?": "¿", "!": "¡", ".": "˙", ",": "'",
};

export function upsideDown(text) {
  return [...text.toLowerCase()].reverse().map((c) => FLIP[c] ?? c).join("");
}
