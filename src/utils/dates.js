/**
 * Funções de data usadas pelos comandos idade e signo.
 */
export function parseBrDate(text) {
  const match = /^(\d{1,2})[/.-](\d{1,2})(?:[/.-](\d{2,4}))?$/.exec(String(text || "").trim());
  if (!match) return null;

  const day = Number(match[1]);
  const month = Number(match[2]);
  let year = match[3] ? Number(match[3]) : null;
  if (year !== null && year < 100) year += year > 30 ? 1900 : 2000;

  const check = new Date(year ?? 2000, month - 1, day);
  if (check.getMonth() !== month - 1 || check.getDate() !== day) return null;

  return { day, month, year };
}

export function startOfToday() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return today;
}
