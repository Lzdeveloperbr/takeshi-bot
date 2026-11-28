/**
 * Descobre quem foi marcado em uma mensagem.
 *
 * Usa a lista de menções que o próprio WhatsApp envia (mentionedJid), que
 * já vem no formato certo do grupo (@lid ou @s.whatsapp.net). Só se ela não
 * existir, monta o ID a partir dos números digitados, no mesmo formato de
 * quem enviou.
 */
const stripDevice = (jid) => jid?.replace(/:[0-9]+(?=@)/, "");

function getContextInfo(webMessage) {
  const message = webMessage?.message?.ephemeralMessage?.message || webMessage?.message;

  return (
    message?.extendedTextMessage?.contextInfo ||
    message?.imageMessage?.contextInfo ||
    message?.videoMessage?.contextInfo ||
    message?.documentMessage?.contextInfo ||
    null
  );
}

export function getMentionedJids(webMessage) {
  return (getContextInfo(webMessage)?.mentionedJid || []).map(stripDevice).filter(Boolean);
}

/**
 * Alvo do comando: 1º marcado, senão quem foi respondido, senão "@número"
 * digitado (no formato de quem enviou), senão null.
 */
export function resolveTarget({ webMessage, fullArgs = "", isReply, replyLid, userLid }) {
  const [mentioned] = getMentionedJids(webMessage);
  if (mentioned) return mentioned;

  if (isReply && replyLid) return stripDevice(replyLid);

  const typed = String(fullArgs).match(/@(\d{6,})/)?.[1];
  if (!typed) return null;

  const domain = userLid?.split("@")[1] || "lid";
  return `${typed}@${domain}`;
}
