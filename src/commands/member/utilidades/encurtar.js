import { PREFIX } from "../../../config.js";
import { InvalidParameterError } from "../../../errors/index.js";
import { shortenUrl } from "../../../services/extra-apis.js";

export default {
  name: "encurtar",
  description: "Encurta um link.",
  commands: ["encurtar", "encurtador", "short", "link-curto"],
  usage: `${PREFIX}encurtar https://exemplo.com/pagina-muito-longa`,
  /**
   * @param {CommandHandleProps} props
   */
  handle: async ({ fullArgs, replyText, sendReply, sendWaitReact, sendSuccessReact }) => {
    const source = `${fullArgs || ""} ${replyText || ""}`;
    let url = source.match(/https?:\/\/\S+/i)?.[0] || source.match(/\b[\w-]+(\.[\w-]+)+\/?\S*/)?.[0];

    if (!url) {
      throw new InvalidParameterError(`Envie um link! Exemplo: ${PREFIX}encurtar https://exemplo.com`);
    }

    if (!/^https?:\/\//i.test(url)) url = `https://${url}`;

    await sendWaitReact();
    const short = await shortenUrl(url);

    await sendSuccessReact();
    await sendReply(`🔗 *Link encurtado:*\n${short}`);
  },
};
