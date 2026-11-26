/**
 * Anti-flood: intervalo mínimo entre comandos da mesma pessoa no mesmo chat.
 * Evita que alguém faça o bot enviar dezenas de mensagens seguidas
 * (o que aumenta o risco de banimento do número).
 */
export const COMMAND_COOLDOWN_MS = 3_000;

const lastUse = new Map();
const warned = new Map();

function prune(now) {
  if (lastUse.size < 5_000) return;

  for (const [key, time] of lastUse) {
    if (now - time > COMMAND_COOLDOWN_MS) {
      lastUse.delete(key);
      warned.delete(key);
    }
  }
}

/**
 * @returns {{ allowed: boolean, remainingSeconds: number, shouldWarn: boolean }}
 */
export function checkCommandCooldown(key, now = Date.now()) {
  const last = lastUse.get(key);

  if (last !== undefined && now - last < COMMAND_COOLDOWN_MS) {
    const shouldWarn = warned.get(key) !== last;
    warned.set(key, last);

    return {
      allowed: false,
      remainingSeconds: Math.ceil((COMMAND_COOLDOWN_MS - (now - last)) / 1000),
      shouldWarn,
    };
  }

  prune(now);
  lastUse.set(key, now);

  return { allowed: true, remainingSeconds: 0, shouldWarn: false };
}

export function resetCommandCooldowns() {
  lastUse.clear();
  warned.clear();
}
