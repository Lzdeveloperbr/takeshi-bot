/**
 * Anti-flood de MENSAGENS (não só de comandos): detecta quem manda
 * muitas mensagens em poucos segundos.
 *
 * - WARN_AT mensagens em WINDOW_MS -> aviso
 * - MUTE_AT mensagens em WINDOW_MS -> silenciar
 */
export const WINDOW_MS = 10_000;
export const WARN_AT = 7;
export const MUTE_AT = 12;

const history = new Map();
const warned = new Map();

/**
 * @returns {"ok" | "warn" | "mute"}
 */
export function registerMessage(key, now = Date.now()) {
  const times = (history.get(key) || []).filter((time) => now - time < WINDOW_MS);
  times.push(now);
  history.set(key, times);

  if (history.size > 10_000) {
    for (const [k, list] of history) {
      if (!list.length || now - list[list.length - 1] > WINDOW_MS) history.delete(k);
    }
  }

  if (times.length >= MUTE_AT) {
    history.delete(key);
    warned.delete(key);
    return "mute";
  }

  if (times.length >= WARN_AT && !(warned.get(key) > now - WINDOW_MS)) {
    warned.set(key, now);
    return "warn";
  }

  return "ok";
}

export function resetFloodTracker() {
  history.clear();
  warned.clear();
}

/** Texto da mensagem (conversa, legenda de mídia...). */
export function getMessageText(webMessage) {
  const message = webMessage?.message?.ephemeralMessage?.message || webMessage?.message;

  return (
    message?.conversation ||
    message?.extendedTextMessage?.text ||
    message?.imageMessage?.caption ||
    message?.videoMessage?.caption ||
    message?.documentMessage?.caption ||
    ""
  );
}

function normalize(text) {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "");
}

/** Procura uma palavra proibida no texto (inteira, ignorando acentos). */
export function findBannedWord(text, words) {
  if (!text || !words?.length) return null;

  const normalizedText = normalize(text);

  return (
    words.find((word) => {
      const escaped = normalize(word).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      return new RegExp(`(^|[^\\p{L}\\p{N}])${escaped}($|[^\\p{L}\\p{N}])`, "u").test(normalizedText);
    }) || null
  );
}
