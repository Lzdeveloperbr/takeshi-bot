/**
 * Tarefas automáticas que rodam a cada 30 segundos:
 * - fechar/abrir grupos no horário definido (/horario-grupo)
 * - parabenizar aniversariantes do dia (/niver), a partir das 9h
 *
 * Horário de Brasília por padrão (mude com a variável BOT_TIMEZONE).
 */
import {
  getBirthdays,
  getGroupSchedules,
  isActiveGroup,
  markBirthdaysCongratulated,
  markGroupScheduleRun,
} from "./database.js";
import { onlyNumbers } from "./index.js";
import { errorLog } from "./logger.js";

export const TIMEZONE = process.env.BOT_TIMEZONE || "America/Sao_Paulo";
const TICK_MS = 30_000;
const SCHEDULE_WINDOW_MINUTES = 5;
const BIRTHDAY_START_HOUR = 9;

let currentSocket = null;
let timer = null;

/** Data e hora "agora" no fuso do bot. */
export function nowInTimezone(date = new Date(), timeZone = TIMEZONE) {
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat("en-CA", {
      timeZone,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      hourCycle: "h23",
    })
      .formatToParts(date)
      .map(({ type, value }) => [type, value]),
  );

  return {
    date: `${parts.year}-${parts.month}-${parts.day}`,
    year: Number(parts.year),
    day: Number(parts.day),
    month: Number(parts.month),
    minutes: Number(parts.hour) * 60 + Number(parts.minute),
  };
}

export const toMinutes = (time) => {
  const match = /^(\d{1,2})[:h](\d{2})?$/i.exec(String(time || "").trim());
  if (!match) return null;
  const hours = Number(match[1]);
  const minutes = Number(match[2] || 0);
  return hours < 24 && minutes < 60 ? hours * 60 + minutes : null;
};

export const formatTime = (minutes) =>
  `${String(Math.floor(minutes / 60)).padStart(2, "0")}:${String(minutes % 60).padStart(2, "0")}`;

/** Está dentro dos primeiros minutos depois do horário marcado? */
export function isDue(targetMinutes, nowMinutes, windowMinutes = SCHEDULE_WINDOW_MINUTES) {
  const diff = (nowMinutes - targetMinutes + 1440) % 1440;
  return diff < windowMinutes;
}

export async function runGroupSchedules(socket, now) {
  for (const [groupId, schedule] of Object.entries(getGroupSchedules())) {
    if (!isActiveGroup(groupId)) continue;

    const actions = [
      ["close", "lastClose", "announcement", `🔒 Grupo *fechado* automaticamente. Abre às ${schedule.open}.`],
      ["open", "lastOpen", "not_announcement", `🔓 Grupo *aberto*! Bom dia a todos ☀️ (fecha às ${schedule.close}).`],
    ];

    for (const [field, lastField, setting, message] of actions) {
      const target = toMinutes(schedule[field]);

      const ranRecently = Number(schedule[lastField]) > Date.now() - 60 * 60 * 1000;

      if (target === null || ranRecently || !isDue(target, now.minutes)) {
        continue;
      }

      markGroupScheduleRun(groupId, lastField, Date.now());

      try {
        await socket.groupSettingUpdate(groupId, setting);
        await socket.sendMessage(groupId, { text: message });
      } catch (error) {
        errorLog(`Horário automático falhou em ${groupId} (o bot é admin?): ${error.message}`);
      }
    }
  }
}

export const isLeapYear = (year) => (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;

/** Em anos não bissextos, quem nasceu em 29/02 comemora em 28/02. */
export function birthdayInYear({ day, month }, year) {
  return month === 2 && day === 29 && !isLeapYear(year) ? { day: 28, month: 2 } : { day, month };
}

export function birthdaysToday(members, now) {
  const year = now.year ?? new Date().getFullYear();

  return Object.entries(members || {})
    .filter(([, date]) => {
      const { day, month } = birthdayInYear(date, year);
      return day === now.day && month === now.month;
    })
    .map(([id]) => id);
}

export async function runBirthdays(socket, now) {
  if (now.minutes < BIRTHDAY_START_HOUR * 60) return;

  for (const [groupId, data] of Object.entries(getBirthdays())) {
    if (data.lastCongrats === now.date || !isActiveGroup(groupId)) continue;

    const people = birthdaysToday(data.members, now);
    markBirthdaysCongratulated(groupId, now.date);

    if (!people.length) continue;

    try {
      await socket.sendMessage(groupId, {
        text: `🎂🎉 *FELIZ ANIVERSÁRIO!* 🎉🎂\n\n${people.map((id) => `🥳 @${onlyNumbers(id)}`).join("\n")}\n\nMuita saúde, alegria e conquistas! Deixem os parabéns aqui 👇`,
        mentions: people,
      });
    } catch (error) {
      errorLog(`Erro ao parabenizar aniversariantes em ${groupId}: ${error.message}`);
    }
  }
}

async function tick() {
  if (!currentSocket?.user) return;

  const now = nowInTimezone();

  try {
    await runGroupSchedules(currentSocket, now);
    await runBirthdays(currentSocket, now);
  } catch (error) {
    errorLog(`Erro nas tarefas automáticas: ${error.message}`);
  }
}

/** Socket da conexão atual (muda a cada reconexão). */
export function getCurrentSocket() {
  return currentSocket;
}

/** Chamado a cada conexão: usa sempre o socket mais recente. */
export function startScheduler(socket) {
  currentSocket = socket;

  if (!timer) {
    timer = setInterval(tick, TICK_MS);
    timer.unref?.();
  }
}
