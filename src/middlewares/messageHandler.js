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

export async function messageHandler(socket, webMessage) {
  try {
    if (!webMessage?.key) {
      return;
    }

    const { remoteJid, fromMe, id: messageId } = webMessage.key;

    if (!remoteJid?.endsWith("@g.us")) {
      return;
    }

    if (fromMe) {
      return;
    }

    const userLid = webMessage.key?.participant || webMessage.key?.participantAlt;

    if (!userLid) {
      return;
    }

    const isBotOrOwner = userLid === OWNER_LID || userLid === BOT_LID;

    if (isBotOrOwner) {
      return;
    }

    const antiGroups = readGroupRestrictions();
    const isAntiLinkActive = !!antiGroups[remoteJid]?.["anti-link"];
    const isAntiPaymentActive = !!antiGroups[remoteJid]?.["anti-payment"];

    if (
      isAntiLinkActive &&
      (await handleQuotedLinkRestriction({ socket, remoteJid, webMessage }))
    ) {
      return;
    }

    const userIsAdmin = await isAdmin({ remoteJid, userLid, socket });

    if (userIsAdmin) {
      return;
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

      return;
    }

    if (
      isAntiPaymentActive &&
      (await handleQuotedPaymentRestriction({ socket, remoteJid, webMessage }))
    ) {
      return;
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
      return;
    }

    // Anti-palavra e anti-flood rodam DEPOIS do anti-pagamento e do
    // anti-status, para não impedir essas punições.
    if (
      await applyWordAndFloodRules({ socket, webMessage, remoteJid, userLid, messageId, antiGroups })
    ) {
      return;
    }

    const messageType = Object.keys(readRestrictedMessageTypes()).find((type) =>
      hasDirectMedia(webMessage, type),
    );

    if (!messageType) {
      return;
    }

    const isAntiActive = !!antiGroups[remoteJid]?.[`anti-${messageType}`];

    if (!isAntiActive) {
      return;
    }

    await socket.sendMessage(remoteJid, {
      delete: {
        remoteJid,
        fromMe,
        id: messageId,
        participant: userLid,
      },
    });
  } catch (error) {
    errorLog(
      `Erro ao processar mensagem restrita. Verifique se eu estou como admin do grupo! Detalhes: ${error.message}`,
    );
  }
}

const STALE_MESSAGE_MS = 2 * 60 * 1000;

/**
 * Anti-palavra e anti-flood.
 * @returns {Promise<boolean>} true se a mensagem foi apagada ou o membro silenciado.
 */
async function applyWordAndFloodRules({ socket, webMessage, remoteJid, userLid, messageId, antiGroups }) {
  const memberLid = userLid.replace(/:[0-9]+(?=@)/, "");
  const memberTag = `@${memberLid.split("@")[0]}`;

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

  // Usa o horário real da mensagem: mensagens acumuladas que chegam de uma
  // vez depois de uma reconexão não contam como flood.
  const timestamp = webMessage.messageTimestamp;
  const sentAt = Number(timestamp?.toNumber?.() ?? timestamp) * 1000 || Date.now();

  if (antiGroups[remoteJid]?.["anti-flood"] && Date.now() - sentAt < STALE_MESSAGE_MS) {
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
