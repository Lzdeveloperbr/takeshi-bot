import { PREFIX } from "../../../config.js";
import { InvalidParameterError } from "../../../errors/index.js";

export default {
  name: "qrcode",
  description: "Gera um QR Code com o texto ou link informado.",
  commands: ["qrcode", "qr", "gerar-qr"],
  usage: `${PREFIX}qrcode https://exemplo.com`,
  /**
   * @param {CommandHandleProps} props
   */
  handle: async ({ fullArgs, replyText, sendImageFromURL, sendWaitReact, sendSuccessReact }) => {
    const text = (fullArgs?.trim() || replyText?.trim() || "").slice(0, 1000);

    if (!text) {
      throw new InvalidParameterError(
        `Informe o texto ou link! Exemplo: ${PREFIX}qrcode https://exemplo.com (ou responda a uma mensagem)`,
      );
    }

    await sendWaitReact();

    const url = `https://api.qrserver.com/v1/create-qr-code/?size=512x512&margin=10&data=${encodeURIComponent(text)}`;

    await sendImageFromURL(url, "✅ Aqui está seu QR Code!");
    await sendSuccessReact();
  },
};
