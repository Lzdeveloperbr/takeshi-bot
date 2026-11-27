import { createHash } from "node:crypto";
import { PREFIX } from "../../../config.js";

const FORTUNES = [
  "Uma surpresa boa vai chegar quando você menos esperar.",
  "Hoje é um ótimo dia para começar aquilo que você vem adiando.",
  "Alguém está pensando em você agora.",
  "Sua paciência será recompensada em breve.",
  "Uma conversa simples vai abrir uma grande porta.",
  "A sorte favorece quem tenta. Arrisque!",
  "Você vai rir muito com um amigo nesta semana.",
  "Um pequeno gesto seu vai fazer o dia de alguém.",
  "Cuidado com as promessas que fizer hoje.",
  "Grandes ideias vão surgir no lugar mais inesperado.",
  "O que é seu está guardado. Siga em frente.",
  "Uma viagem está nos seus planos, mesmo que você ainda não saiba.",
  "Hoje, ouça mais do que fala.",
  "Uma boa notícia está a caminho.",
  "Você é mais forte do que imagina.",
  "Dinheiro inesperado pode aparecer. Use com sabedoria.",
  "Aquele problema vai se resolver de um jeito simples.",
  "Seu sorriso vai abrir portas hoje.",
  "Diga sim para um convite diferente.",
  "A pessoa certa vai aparecer na hora certa.",
];

const NUMBERS_PER_DAY = 6;

export default {
  name: "biscoito",
  description: "Abre o biscoito da sorte do dia (muda uma vez por dia para cada pessoa).",
  commands: ["biscoito", "sorte", "biscoito-da-sorte"],
  usage: `${PREFIX}biscoito`,
  /**
   * @param {CommandHandleProps} props
   */
  handle: async ({ userLid, webMessage, sendReply, sendReact }) => {
    const day = new Date().toLocaleDateString("pt-BR");
    const hash = createHash("sha256").update(`${userLid}|${day}`).digest();

    const fortune = FORTUNES[hash.readUInt16BE(0) % FORTUNES.length];
    const numbers = [];
    for (let i = 2; numbers.length < NUMBERS_PER_DAY && i < hash.length; i++) {
      const n = (hash[i] % 60) + 1;
      if (!numbers.includes(n)) numbers.push(n);
    }

    await sendReact("🥠");
    await sendReply(
      `🥠 *Biscoito da sorte de ${webMessage?.pushName || "hoje"}*\n\n_"${fortune}"_\n\n🍀 Números da sorte: ${numbers.sort((a, b) => a - b).join(" - ")}`,
    );
  },
};
