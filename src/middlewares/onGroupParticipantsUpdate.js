/**
 * Evento chamado quando um usuário
 * entra ou sai de um grupo de WhatsApp.
 *
 * @author Dev Gui
 */
import { exitMessage, welcomeMessage, welcomeWithPhoto } from "../messages.js";
import {
  getPrefix,
  isActiveExitGroup,
  isActiveGroup,
  isActiveWelcomeGroup,
} from "../utils/database.js";
import { extractUserLid, onlyNumbers } from "../utils/index.js";
import { errorLog } from "../utils/logger.js";

/** Foto de perfil da pessoa (ou null se não tiver / for privada). */
export async function getProfilePhotoUrl(socket, jid, timeoutMs = 5000) {
  try {
    return await Promise.race([
      socket.profilePictureUrl(jid, "image"),
      new Promise((resolve) => setTimeout(() => resolve(null), timeoutMs).unref?.()),
    ]);
  } catch {
    return null;
  }
}

/**
 * Troca @group pelo nome do grupo, @count pela quantidade de membros
 * e @prefix pelo prefixo do grupo.
 */
export async function replaceGroupPlaceholders(text, socket, remoteJid) {
  text = text.replaceAll("@prefix", getPrefix(remoteJid));

  if (!text.includes("@group") && !text.includes("@count")) {
    return text;
  }

  try {
    const metadata = await socket.groupMetadata(remoteJid);

    return text
      .replaceAll("@group", metadata?.subject || "grupo")
      .replaceAll("@count", String(metadata?.participants?.length ?? ""));
  } catch {
    return text.replaceAll("@group", "grupo").replaceAll("@count", "");
  }
}

export async function onGroupParticipantsUpdate({
  data,
  remoteJid,
  socket,
  action,
}) {
  try {
    if (!remoteJid.endsWith("@g.us")) {
      return;
    }

    if (!isActiveGroup(remoteJid)) {
      return;
    }

    const userLid = extractUserLid(data);

    if (isActiveWelcomeGroup(remoteJid) && action === "add") {
      const hasMemberMention = welcomeMessage.includes("@member");

      const mentions = [];
      let finalWelcomeMessage = welcomeMessage;

      if (hasMemberMention) {
        const userNumber = onlyNumbers(userLid);
        finalWelcomeMessage = welcomeMessage.replace(
          "@member",
          `@${userNumber}`,
        );
        mentions.push(userLid);
      }

      const text = await replaceGroupPlaceholders(finalWelcomeMessage, socket, remoteJid);
      const photoUrl = welcomeWithPhoto ? await getProfilePhotoUrl(socket, userLid) : null;

      await socket.sendMessage(
        remoteJid,
        photoUrl ? { image: { url: photoUrl }, caption: text, mentions } : { text, mentions },
      );
    } else if (isActiveExitGroup(remoteJid) && action === "remove") {
      const hasMemberMention = exitMessage.includes("@member");

      const mentions = [];
      let finalExitMessage = exitMessage;

      if (hasMemberMention) {
        const userNumber = onlyNumbers(userLid);
        finalExitMessage = exitMessage.replace("@member", `@${userNumber}`);
        mentions.push(userLid);
      }

      await socket.sendMessage(remoteJid, {
        text: await replaceGroupPlaceholders(finalExitMessage, socket, remoteJid),
        mentions,
      });
    }
  } catch (error) {
    errorLog(`Erro em onGroupParticipantsUpdate: ${error.message}`);
    errorLog(JSON.stringify(error, null, 2));
  }
}
