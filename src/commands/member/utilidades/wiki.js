import axios from "axios";
import { PREFIX } from "../../../config.js";
import { InvalidParameterError, WarningError } from "../../../errors/index.js";

const api = axios.create({
  baseURL: "https://pt.wikipedia.org",
  timeout: 15_000,
  headers: { "User-Agent": "TakeshiBot/1.0 (WhatsApp bot)" },
});

export default {
  name: "wiki",
  description: "Pesquisa um resumo na Wikipédia.",
  commands: ["wiki", "wikipedia", "pesquisar"],
  usage: `${PREFIX}wiki Brasil`,
  /**
   * @param {CommandHandleProps} props
   */
  handle: async ({ fullArgs, sendReply, sendImageFromURL, sendWaitReact, sendSuccessReact }) => {
    const term = fullArgs?.trim();

    if (!term) {
      throw new InvalidParameterError(`Informe o que deseja pesquisar! Exemplo: ${PREFIX}wiki Brasil`);
    }

    await sendWaitReact();

    let title;
    try {
      const { data } = await api.get("/w/api.php", {
        params: { action: "opensearch", search: term, limit: 1, namespace: 0, format: "json" },
      });
      title = data?.[1]?.[0];
    } catch {
      throw new WarningError("Não consegui acessar a Wikipédia agora. Tente novamente em instantes.");
    }

    if (!title) {
      throw new WarningError(`Não encontrei nada sobre "${term}" na Wikipédia.`);
    }

    const { data: summary } = await api.get(
      `/api/rest_v1/page/summary/${encodeURIComponent(title.replace(/ /g, "_"))}`,
    );

    const text = `📚 *${summary.title}*

${summary.extract || "Sem resumo disponível."}

🔗 ${summary.content_urls?.desktop?.page || ""}`;

    await sendSuccessReact();

    if (summary.thumbnail?.source) {
      await sendImageFromURL(summary.thumbnail.source, text);
    } else {
      await sendReply(text);
    }
  },
};
