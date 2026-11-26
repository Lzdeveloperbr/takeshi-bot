import { PREFIX } from "../../../config.js";
import { InvalidParameterError } from "../../../errors/index.js";
import { formatDate, getBrDomain } from "../../../services/brasil-api.js";

const STATUS = {
  AVAILABLE: "✅ Disponível para registro!",
  REGISTERED: "❌ Já está registrado.",
  UNAVAILABLE: "⛔ Indisponível.",
  RELEASE_WAITING: "⏳ Aguardando liberação.",
  RELEASE_IN_PROGRESS: "⏳ Em processo de liberação.",
};

export default {
  name: "dominio",
  description: "Verifica se um domínio .br está disponível (Registro.br).",
  commands: ["dominio", "domínio", "registrobr"],
  usage: `${PREFIX}dominio meusite.com.br`,
  /**
   * @param {CommandHandleProps} props
   */
  handle: async ({ fullArgs, sendReply, sendWaitReact, sendSuccessReact }) => {
    const domain = String(fullArgs || "").trim().split(/\s+/)[0]
      .trim()
      .toLowerCase()
      .replace(/^https?:\/\//, "")
      .replace(/\/.*$/, "");

    if (!/^[a-z0-9-]+(\.[a-z0-9-]+)*\.br$/.test(domain)) {
      throw new InvalidParameterError(`Envie um domínio .br! Exemplo: ${PREFIX}dominio meusite.com.br`);
    }

    await sendWaitReact();
    const data = await getBrDomain(domain);

    const lines = [
      `🌐 *${data.fqdn || domain}*`,
      STATUS[data.status] || `Status: ${data.status}`,
      data.expires_at && `📅 Expira em: ${formatDate(data.expires_at)}`,
      data.suggestions?.length && `💡 Sugestões: ${data.suggestions.slice(0, 5).join(", ")}`,
    ].filter(Boolean);

    await sendSuccessReact();
    await sendReply(lines.join("\n"));
  },
};
