import { PREFIX } from "../../../config.js";
import { InvalidParameterError, WarningError } from "../../../errors/index.js";
import { lyrics } from "../../../services/extra-apis.js";

export default {
  name: "letra",
  description: "Busca a letra de uma música.",
  commands: ["letra", "lyrics", "letra-musica"],
  usage: `${PREFIX}letra artista | música`,
  /**
   * @param {CommandHandleProps} props
   */
  handle: async ({ fullArgs, sendReply, sendWaitReact, sendSuccessReact }) => {
    const [artist, title] = (fullArgs || "").split(/\s*[|-]\s*/).map((part) => part?.trim());

    if (!artist || !title) {
      throw new InvalidParameterError(`Use: ${PREFIX}letra artista | música\nExemplo: ${PREFIX}letra Legião Urbana | Tempo Perdido`);
    }

    await sendWaitReact();
    const text = await lyrics(artist, title);

    if (!text) {
      throw new WarningError("Não encontrei essa letra. Confira o nome do artista e da música.");
    }

    const cut = text.length > 3500 ? `${text.slice(0, 3500)}\n\n[...]` : text;

    await sendSuccessReact();
    await sendReply(`🎵 *${title}* — ${artist}\n\n${cut.replace(/\n{3,}/g, "\n\n")}`);
  },
};
