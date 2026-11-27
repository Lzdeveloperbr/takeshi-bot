import { PREFIX } from "../../config.js";
import { InvalidParameterError, WarningError } from "../../errors/index.js";
import { getGroupSchedules, setGroupSchedule } from "../../utils/database.js";
import { formatTime, TIMEZONE, toMinutes } from "../../utils/scheduler.js";

export default {
  name: "horario-grupo",
  description: "Fecha e abre o grupo sozinho todos os dias nos horários escolhidos.",
  commands: ["horario-grupo", "auto-fechar", "horario"],
  usage: `${PREFIX}horario-grupo 22:00 08:00 (fecha às 22h e abre às 8h) | ${PREFIX}horario-grupo off`,
  /**
   * @param {CommandHandleProps} props
   */
  handle: async ({ fullArgs, isGroup, remoteJid, sendReply, sendSuccessReply }) => {
    if (!isGroup) {
      throw new WarningError("Este comando só deve ser usado em grupos!");
    }

    const input = (fullArgs || "").trim().toLowerCase();
    const current = getGroupSchedules()[remoteJid];

    if (!input) {
      await sendReply(
        current
          ? `⏰ *Horário automático*\n🔒 Fecha: ${current.close}\n🔓 Abre: ${current.open}\n\nPara desligar: ${PREFIX}horario-grupo off`
          : `⏰ Sem horário automático.\nExemplo: ${PREFIX}horario-grupo 22:00 08:00`,
      );
      return;
    }

    if (["off", "0", "desligar", "remover"].includes(input)) {
      if (!current) throw new WarningError("Este grupo não tem horário automático.");
      setGroupSchedule(remoteJid, null);
      await sendSuccessReply("Horário automático desligado.");
      return;
    }

    const [closeText, openText] = input.split(/\s+/);
    const close = toMinutes(closeText);
    const open = toMinutes(openText);

    if (close === null || open === null || close === open) {
      throw new InvalidParameterError(
        `Use: ${PREFIX}horario-grupo HORA_DE_FECHAR HORA_DE_ABRIR\nExemplo: ${PREFIX}horario-grupo 22:00 08:00`,
      );
    }

    setGroupSchedule(remoteJid, { close: formatTime(close), open: formatTime(open) });

    await sendSuccessReply(
      `Pronto! Todos os dias:\n🔒 Fecha às *${formatTime(close)}*\n🔓 Abre às *${formatTime(open)}*\n\n_Horário de ${TIMEZONE === "America/Sao_Paulo" ? "Brasília" : TIMEZONE}. Eu preciso ser admin do grupo._`,
    );
  },
};
