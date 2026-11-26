import { PREFIX } from "../../config.js";
import { WarningError } from "../../errors/index.js";
import { getGroupRules, isActiveGroupRestriction } from "../../utils/database.js";
import { onlyNumbers } from "../../utils/index.js";

const PROTECTIONS = [
  ["anti-link", "Anti-link"],
  ["anti-flood", "Anti-flood"],
  ["anti-palavra", "Anti-palavra"],
  ["anti-payment", "Anti-pagamento"],
];

export default {
  name: "grupo",
  description: "Mostra informações do grupo: membros, admins, criação e proteções ativas.",
  commands: ["grupo", "info-grupo", "infogrupo", "group-info"],
  usage: `${PREFIX}grupo`,
  /**
   * @param {CommandHandleProps} props
   */
  handle: async ({ isGroup, remoteJid, getGroupMetadata, sendText, sendReact }) => {
    if (!isGroup) {
      throw new WarningError("Este comando só funciona em grupos.");
    }

    const metadata = await getGroupMetadata();
    const participants = metadata?.participants || [];
    const admins = participants.filter((p) => p.admin);
    const owner = metadata?.owner;

    const protections = PROTECTIONS.map(
      ([key, label]) => `${isActiveGroupRestriction(remoteJid, key) ? "✅" : "❌"} ${label}`,
    ).join("\n");

    const description = (metadata?.desc || "").trim();

    const text = [
      `👥 *${metadata?.subject || "Grupo"}*`,
      "",
      `🧑‍🤝‍🧑 Membros: *${participants.length}*`,
      `👮 Admins: *${admins.length}*`,
      owner && `👑 Criador: @${onlyNumbers(owner)}`,
      metadata?.creation && `📅 Criado em: ${new Date(metadata.creation * 1000).toLocaleDateString("pt-BR")}`,
      `🔒 Só admins enviam mensagens: ${metadata?.announce ? "sim" : "não"}`,
      `⏳ Mensagens temporárias: ${metadata?.ephemeralDuration ? `${Math.round(metadata.ephemeralDuration / 86400)} dia(s)` : "não"}`,
      `📜 Regras definidas: ${getGroupRules(remoteJid) ? "sim" : "não"}`,
      "",
      `🛡️ *Proteções*\n${protections}`,
      description && `\n📝 *Descrição*\n${description.length > 500 ? `${description.slice(0, 500)}...` : description}`,
    ]
      .filter((line) => line !== null && line !== undefined && line !== false)
      .join("\n");

    await sendReact("👥");
    await sendText(text, owner ? [owner] : []);
  },
};
