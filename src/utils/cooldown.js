/**
 * Anti-flood: intervalo mínimo entre comandos da mesma pessoa no mesmo chat.
 * Evita que alguém faça o bot enviar dezenas de mensagens seguidas
 * (o que aumenta o risco de banimento do número).
 *
 * Um comando pode definir o próprio intervalo com `cooldownSeconds`
 * (ex.: jogos usam 1 segundo para dar para jogar rápido).
 */
export const COMMAND_COOLDOWN_MS = 3_000;

// chave -> { last: momento do último uso, until: até quando está bloqueado }
const entries = new Map();

function prune(now) {
  if (entries.size < 5_000) return;

  for (const [key, entry] of entries) {
    if (now >= entry.until) entries.delete(key);
  }
}

/**
 * @returns {{ allowed: boolean, remainingSeconds: number, shouldWarn: boolean }}
 */
export function checkCommandCooldown(key, now = Date.now(), cooldownMs = COMMAND_COOLDOWN_MS) {
  const entry = entries.get(key);

  if (entry && now - entry.last < cooldownMs) {
    const shouldWarn = !entry.warned;
    entry.warned = true;

    return {
      allowed: false,
      remainingSeconds: Math.ceil((cooldownMs - (now - entry.last)) / 1000),
      shouldWarn,
    };
  }

  prune(now);
  entries.set(key, { last: now, until: now + cooldownMs, warned: false });

  return { allowed: true, remainingSeconds: 0, shouldWarn: false };
}

export function resetCommandCooldowns() {
  entries.clear();
}
