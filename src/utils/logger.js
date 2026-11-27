/**
 * Logs
 *
 * @author Dev Gui
 */
import pkg from "../../package.json" with { type: "json" };
import { BOT_NAME } from "../config.js";

const LABEL = (BOT_NAME || "BOT").toUpperCase();

let consoleNoiseFilterInstalled = false;

export function installConsoleNoiseFilter() {
  if (consoleNoiseFilterInstalled) {
    return;
  }

  const originalConsoleInfo = console.info.bind(console);

  console.info = (...args) => {
    if (args[0] === "Closing session:") {
      warningLog(
        "O WhatsApp fechou uma sessão criptografada antiga para renovar as chaves. Isso é um aviso normal da conexão e não indica erro no bot.",
      );
      return;
    }

    if (args[0] === "Removing old closed session:") {
      warningLog(
        "O WhatsApp removeu uma sessão criptografada antiga já fechada. Isso é limpeza normal do histórico de chaves e não indica erro no bot.",
      );
      return;
    }

    originalConsoleInfo(...args);
  };

  consoleNoiseFilterInstalled = true;
}

export function sayLog(message) {
  console.log(`\x1b[36m[${LABEL} | TALK]\x1b[0m`, message);
}

export function inputLog(message) {
  console.log(`\x1b[30m[${LABEL} | INPUT]\x1b[0m`, message);
}

export function infoLog(message) {
  console.log(`\x1b[34m[${LABEL} | INFO]\x1b[0m`, message);
}

export function successLog(message) {
  console.log(`\x1b[32m[${LABEL} | SUCCESS]\x1b[0m`, message);
}

export function errorLog(message) {
  console.log(`\x1b[31m[${LABEL} | ERROR]\x1b[0m`, message);
}

export function warningLog(message) {
  console.log(`\x1b[33m[${LABEL} | WARNING]\x1b[0m`, message);
}

// Letras no estilo do banner (3 linhas). Letras sem desenho viram texto simples.
const GLYPHS = {
  A: ["█▀█", "█▀█", "▀░▀"], B: ["█▀▄", "█▀▄", "▀▀░"], C: ["█▀▀", "█░░", "▀▀▀"],
  D: ["█▀▄", "█░█", "▀▀░"], E: ["█▀▀", "█▀▀", "▀▀▀"], F: ["█▀▀", "█▀▀", "▀░░"],
  G: ["█▀▀", "█░█", "▀▀▀"], H: ["█░█", "█▀█", "▀░▀"], I: ["▀█▀", "░█░", "▀▀▀"],
  J: ["░░█", "░░█", "▀▀░"], K: ["█░█", "█▀▄", "▀░▀"], L: ["█░░", "█░░", "▀▀▀"],
  M: ["█▄█", "█░█", "▀░▀"], N: ["█▀█", "█░█", "▀░▀"], O: ["█▀█", "█░█", "▀▀▀"],
  P: ["█▀█", "█▀▀", "▀░░"], Q: ["█▀█", "█░█", "▀▀▄"], R: ["█▀▄", "█▀▄", "▀░▀"],
  S: ["█▀▀", "▀▀█", "▀▀▀"], T: ["▀█▀", "░█░", "░▀░"], U: ["█░█", "█░█", "▀▀▀"],
  V: ["█░█", "▀▄▀", "░▀░"], W: ["█░█", "█▄█", "▀░▀"], X: ["▀▄▀", "▄▀▄", "▀░▀"],
  Y: ["█░█", "░█░", "░▀░"], Z: ["▀▀█", "▄▀░", "▀▀▀"], " ": ["", "", ""],
};

export function bannerLines(name = BOT_NAME) {
  const letters = [...String(name || "BOT").toUpperCase()];

  if (!letters.length || letters.length > 16 || letters.some((letter) => !GLYPHS[letter])) {
    return null;
  }

  return [0, 1, 2].map((row) => `░${letters.map((letter) => GLYPHS[letter][row]).join("░")}`);
}

export function bannerLog() {
  const lines = bannerLines();

  if (lines) {
    console.log(`\x1b[36m${lines[0]}\x1b[0m`);
    console.log(lines[1]);
    console.log(`\x1b[36m${lines[2]}\x1b[0m`);
  } else {
    console.log(`\x1b[36m🤖 ${BOT_NAME}\x1b[0m`);
  }

  console.log(`\x1b[36m🤖 Versão: \x1b[0m${pkg.version}\n`);
}
