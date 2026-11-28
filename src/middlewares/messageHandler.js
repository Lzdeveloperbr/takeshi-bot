/**
 * Validador de mensagens
 *
 * @author Dev Gui
 */
import { BOT_LID, OWNER_LID } from "../config.js";
import {
  applyAntiPaymentRestriction,
  handleQuotedPaymentRestriction,
} from "../utils/antiPaymentAction.js";
import { handleQuotedLinkRestriction } from "../utils/quotedLinkAction.js";
import {
  checkIfMemberIsMuted,
  getBannedWords,
  getPrefix,
  muteMember,
  readGroupRestrictions,
  readRestrictedMessageTypes,
} from "../utils/database.js";
import {
  findBannedWord,
  getMessageText,
  registerMessage,
} from "../utils/floodTracker.js";
import { hasGroupStatusMessage } from "../utils/groupStatusMessage.js";
import { hasDirectMedia } from "../utils/index.js";
import { errorLog } from "../utils/logger.js";
import { hasPaymentMessage } from "../utils/paymentMessage.js";
import { isAdmin } from "./index.js";

/**
 * @returns {Promise<boolean>} true quando ESTA mensagem foi apagada ou o
 * autor dela foi punido (aí o bot não deve executar o comando dela).
 */
export async function messageHandler(socket, webMessage) {
  try {
    if (!webMessage?.key) {
      return false;
    }

    const { remoteJid, fromMe, id: messageId } = webMessage.key;

    if (!remoteJid?.endsWith("@g.us")) {
      return false;
    }

    if (fromMe) {
      return false;
    }

    const userLid = webMessage.key?.participant || webMessage.key?.participantAlt;

    if (!userLid) {
      return false;
    }

    const isBotOrOwner = userLid === OWNER_LID || userLid === BOT_LID;

    if (isBotOrOwner) {
      return false;
    }

    const antiGroups = readGroupRestrictions();
    const isAntiLinkActive = !!antiGroups[remoteJid]?.["anti-link"];
    const isAntiPaymentActive = !!antiGroups[remoteJid]?.["anti-payment"];

    if (
      isAntiLinkActive &&
      (await handleQuotedLinkRestriction({ socket, remoteJid, webMessage }))
    ) {
      return false;
    }

    const userIsAdmin = await isAdmin({ remoteJid, userLid, socket });

    if (userIsAdmin) {
      return false;
    }

    if (isAntiPaymentActive && hasPaymentMessage(webMessage)) {
      await applyAntiPaymentRestriction({
        socket,
        remoteJid,
        userLid,
        messageKey: {
          remoteJid,
          fromMe: false,
          id: messageId,
          participant: userLid,
        },
      });

      return true;
    }

    if (
      isAntiPaymentActive &&
      (await handleQuotedPaymentRestriction({ socket, remoteJid, webMessage }))
    ) {
      return false;
    }

    if (
      antiGroups[remoteJid]?.["anti-status-grupo"] &&
      hasGroupStatusMessage(webMessage)
    ) {
      try {
        await socket.groupParticipantsUpdate(remoteJid, [userLid], "remove");

        await socket.sendMessage(remoteJid, {
          delete: webMessage.key,
        });
      } catch (error) {
        errorLog(
          `Erro ao aplicar anti-status-grupo. Verifique se eu estou como admin do grupo! Detalhes: ${error.message}`,
        );
      }
      return true;
    }

    // Anti-palavra e anti-flood rodam DEPOIS do anti-pagamento e do
    // anti-status, para não impedir essas punições.
    if (
      await applyWordAndFloodRules({ socket, webMessage, remoteJid, userLid, messageId, antiGroups })
    ) {
      return true;
    }

    const messageType = Object.keys(readRestrictedMessageTypes()).find((type) =>
      hasDirectMedia(webMessage, type),
    );

    if (!messageType) {
      return false;
    }

    const isAntiActive = !!antiGroups[remoteJid]?.[`anti-${messageType}`];

    if (!isAntiActive) {
      return false;
    }

    await socket.sendMessage(remoteJid, {
      delete: {
        remoteJid,
        fromMe,
        id: messageId,
        participant: userLid,
      },
    });

    return true;
  } catch (error) {
    errorLog(
      `Erro ao processar mensagem restrita. Verifique se eu estou como admin do grupo! Detalhes: ${error.message}`,
    );
  }

  return false;
}

const STALE_MESSAGE_MS = 2 * 60 * 1000;

/**
 * Anti-palavra e anti-flood.
 * @returns {Promise<boolean>} true se a mensagem foi apagada ou o membro silenciado.
 */
async function applyWordAndFloodRules({ socket, webMessage, remoteJid, userLid, messageId, antiGroups }) {
  const memberLid = userLid.replace(/:[0-9]+(?=@)/, "");
  const memberTag = `@${memberLid.split("@")[0]}`;

  // Quem já está silenciado tem as mensagens apagadas pelo mute; não repete avisos.
  if (checkIfMemberIsMuted(remoteJid, memberLid)) {
    return false;
  }

  // Mensagens antigas (acumuladas durante uma desconexão) não geram punição
  // nem aviso: só as recentes contam.
  const timestamp = webMessage.messageTimestamp;
  const sentAt = Number(timestamp?.toNumber?.() ?? timestamp) * 1000 || Date.now();

  if (Date.now() - sentAt >= STALE_MESSAGE_MS) {
    return false;
  }

  if (antiGroups[remoteJid]?.["anti-palavra"]) {
    const bannedWord = findBannedWord(
      getMessageText(webMessage),
      getBannedWords(remoteJid),
    );

    if (bannedWord) {
      await socket.sendMessage(remoteJid, {
        delete: { remoteJid, fromMe: false, id: messageId, participant: userLid },
      });

      await socket.sendMessage(remoteJid, {
        text: `🚫 ${memberTag}, sua mensagem foi apagada por conter uma palavra proibida neste grupo.`,
        mentions: [memberLid],
      });

      return true;
    }
  }

  // Usa o horário real da mensagem para medir o flood.
  if (antiGroups[remoteJid]?.["anti-flood"]) {
    const floodResult = registerMessage(`${remoteJid}:${memberLid}`, sentAt);

    if (floodResult === "warn") {
      await socket.sendMessage(remoteJid, {
        text: `⚠️ ${memberTag}, calma! Você está mandando mensagens rápido demais. Se continuar, será silenciado.`,
        mentions: [memberLid],
      });
    } else if (floodResult === "mute") {
      muteMember(remoteJid, memberLid);

      await socket.sendMessage(remoteJid, {
        text: `🔇 ${memberTag} foi silenciado por flood.\nUm admin pode liberar com ${getPrefix(remoteJid)}unmute ${memberTag}`,
        mentions: [memberLid],
      });

      return true;
    }
  }

  return false;
}
