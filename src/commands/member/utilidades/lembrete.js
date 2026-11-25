import { PREFIX } from "../../../config.js";
import { InvalidParameterError, WarningError } from "../../../errors/index.js";
import { onlyNumbers } from "../../../utils/index.js";

const MAX_MINUTES = 24 * 60;
const MAX_PER_USER = 5;
const activeByUser = new Map();

function parseDuration(input) {
  const match = /^(\d+)\s*(s|seg|m|min|h|hr|hora|horas)?$/i.exec(input?.trim() || "");
  if (!match) return null;

  const value = Number(match[1]);
  const unit = (match[2] || "m").toLowerCase();

  if (unit.startsWith("s")) return value / 60;
  if (unit.startsWith("h")) return value * 60;
  return value;
}

export default {
  name: "lembrete",
  description: "Cria um lembrete: o bot te marca depois do tempo informado (até 24h).",
  commands: ["lembrete", "lembrar", "remind"],
  usage: `${PREFIX}lembrete 30m tirar o bolo do forno (use s, m ou h)`,
  /**
   * @param {CommandHandleProps} props
   */
  handle: async ({ fullArgs, userLid, sendText, sendSuccessReply }) => {
    const [durationText, ...rest] = (fullArgs || "").trim().split(/\s+/);
    const minutes = parseDuration(durationText);
    const text = rest.join(" ").trim();

    if (!minutes || !text) {
      throw new InvalidParameterError(
        `Use: ${PREFIX}lembrete <tempo> <mensagem>\nExemplos: ${PREFIX}lembrete 10m beber água | ${PREFIX}lembrete 2h reunião`,
      );
    }

    if (minutes < 1 / 6 || minutes > MAX_MINUTES) {
      throw new InvalidParameterError("O tempo deve ser entre 10 segundos e 24 horas.");
    }

    const active = activeByUser.get(userLid) || 0;
    if (active >= MAX_PER_USER) {
      throw new WarningError(`Você já tem ${MAX_PER_USER} lembretes ativos. Aguarde algum terminar.`);
    }

    activeByUser.set(userLid, active + 1);

    const timer = setTimeout(async () => {
      activeByUser.set(userLid, Math.max(0, (activeByUser.get(userLid) || 1) - 1));
      try {
        await sendText(`⏰ *Lembrete* para @${onlyNumbers(userLid)}:\n\n${text}`, [userLid]);
      } catch {
        // Conexão pode ter caído; não há o que fazer.
      }
    }, Math.round(minutes * 60_000));
    timer.unref?.();

    const label =
      minutes >= 60
        ? `${+(minutes / 60).toFixed(1)}h`
        : minutes >= 1
          ? `${+minutes.toFixed(1)} min`
          : `${Math.round(minutes * 60)}s`;

    await sendSuccessReply(`Lembrete criado! Vou te avisar em *${label}*.\n_(Lembretes são perdidos se o bot reiniciar.)_`);
  },
};
