import { PREFIX } from "../../../config.js";
import { InvalidParameterError } from "../../../errors/index.js";

export default {
  name: "contar",
  description: "Conta caracteres, palavras e linhas de um texto (ou da mensagem respondida).",
  commands: ["contar", "caracteres", "contar-palavras"],
  usage: `${PREFIX}contar seu texto (ou responda a uma mensagem)`,
  /**
   * @param {CommandHandleProps} props
   */
  handle: async ({ fullArgs, replyText, sendReply, sendReact }) => {
    const text = fullArgs?.trim() || replyText?.trim();

    if (!text) {
      throw new InvalidParameterError(`Envie um texto ou responda a uma mensagem com ${PREFIX}contar`);
    }

    const words = text.split(/\s+/).filter(Boolean).length;
    const lines = text.split("\n").length;
    const noSpaces = text.replace(/\s/g, "").length;

    await sendReact("🔢");
    await sendReply(
      `🔢 *Contagem*\n\n🔤 Caracteres: *${[...text].length}*\n✂️ Sem espaços: *${noSpaces}*\n📝 Palavras: *${words}*\n📄 Linhas: *${lines}*\n⏱️ Leitura: ~${Math.max(1, Math.round(words / 200))} min`,
    );
  },
};
