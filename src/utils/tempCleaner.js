/**
 * Limpa arquivos temporários esquecidos em assets/temp (mídias baixadas,
 * figurinhas, áudios convertidos...). Sem isso, a pasta cresce para sempre
 * quando algum comando falha no meio do caminho.
 */
import fs from "node:fs";
import path from "node:path";
import { TEMP_DIR } from "../config.js";
import { infoLog } from "./logger.js";

const MAX_AGE_MS = 60 * 60 * 1000;
const INTERVAL_MS = 30 * 60 * 1000;
const MAX_LOG_BYTES = 20 * 1024 * 1024;
const LOG_FILES = ["wa-logs.txt", "24h.log", "boot.log"];
const KEEP_FILES = new Set(["wa-logs.txt", "24h.log", "boot.log", ".gitkeep"]);

export function cleanTempDir({ dir = TEMP_DIR, maxAgeMs = MAX_AGE_MS, now = Date.now() } = {}) {
  if (!fs.existsSync(dir)) {
    return { removed: 0, freedBytes: 0 };
  }

  let removed = 0;
  let freedBytes = 0;

  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (!entry.isFile() || KEEP_FILES.has(entry.name)) continue;

    const filePath = path.join(dir, entry.name);

    try {
      const { mtimeMs, size } = fs.statSync(filePath);

      if (now - mtimeMs > maxAgeMs) {
        fs.unlinkSync(filePath);
        removed++;
        freedBytes += size;
      }
    } catch {
      // Arquivo em uso ou já removido.
    }
  }

  return { removed, freedBytes };
}

/** Esvazia arquivos de log que passaram do limite (eles crescem para sempre). */
export function trimLogs({ dir = TEMP_DIR, maxBytes = MAX_LOG_BYTES } = {}) {
  let trimmed = 0;

  for (const name of LOG_FILES) {
    const filePath = path.join(dir, name);

    try {
      if (fs.existsSync(filePath) && fs.statSync(filePath).size > maxBytes) {
        fs.truncateSync(filePath, 0);
        trimmed++;
      }
    } catch {
      // Ignora.
    }
  }

  return trimmed;
}

export function startTempCleaner() {
  const run = () => {
    trimLogs();
    const { removed, freedBytes } = cleanTempDir();

    if (removed) {
      infoLog(
        `Limpeza: ${removed} arquivo(s) temporário(s) removido(s) (${(freedBytes / 1024 / 1024).toFixed(1)} MB).`,
      );
    }
  };

  run();
  setInterval(run, INTERVAL_MS).unref?.();
}
