import { PREFIX } from "../../../config.js";
import { InvalidParameterError } from "../../../errors/index.js";
import { translate } from "../../../services/extra-apis.js";

const LANGUAGES = {
  pt: "português", en: "inglês", es: "espanhol", fr: "francês", it: "italiano", de: "alemão",
  ja: "japonês", ko: "coreano", zh: "chinês", ru: "russo", ar: "árabe", hi: "hindi", tr: "turco",
};

export default {
  name: "traduzir",
  description: "Traduz um texto (para português, ou para o idioma escolhido).",
  commands: ["traduzir", "tradutor", "tr", "translate"],
  usage: `${PREFIX}traduzir hello world  |  ${PREFIX}traduzir en bom dia  |  responda a uma mensagem`,
  /**
   * @param {CommandHandleProps} props
   */
  handle: async ({ fullArgs, replyText, sendReply, sendWaitReact, sendSuccessReact }) => {
    let text = fullArgs?.trim() || "";
    let target = "pt";

    const [first, ...rest] = text.split(/\s+/);
    if (LANGUAGES[first?.toLowerCase()] && (rest.length || replyText)) {
      target = first.toLowerCase();
      text = rest.join(" ");
    }

    text = (text || replyText || "").trim();

    if (!text) {
      throw new InvalidParameterError(
        `Envie o texto ou responda a uma mensagem!\nExemplos: ${PREFIX}traduzir hello | ${PREFIX}traduzir en bom dia\nIdiomas: ${Object.keys(LANGUAGES).join(", ")}`,
      );
    }

    if (text.length > 2000) {
      throw new InvalidParameterError("O texto pode ter no máximo 2000 caracteres.");
    }

    await sendWaitReact();
    const result = await translate(text, target);

    await sendSuccessReact();
    await sendReply(
      `🌐 *Tradução* (${LANGUAGES[result.from] || result.from} → ${LANGUAGES[target]})\n\n${result.text}`,
    );
  },
};
