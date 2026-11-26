/**
 * Contador de mensagens por membro (para /rank e /inativos).
 * As contagens ficam na memória e são salvas no banco a cada minuto,
 * para não gravar o arquivo a cada mensagem recebida.
 */
import {
  addActivityCounts,
  getGroupActivity,
  resetGroupActivity,
} from "./database.js";

const FLUSH_INTERVAL_MS = 60_000;

let pending = {};
let timer = null;

export function countMessage(groupId, memberId) {
  if (!groupId?.endsWith("@g.us") || !memberId) {
    return;
  }

  pending[groupId] ??= {};
  pending[groupId][memberId] = (pending[groupId][memberId] || 0) + 1;

  if (!timer) {
    timer = setInterval(flushActivity, FLUSH_INTERVAL_MS);
    timer.unref?.();
  }
}

export function flushActivity() {
  if (!Object.keys(pending).length) {
    return;
  }

  const delta = pending;
  pending = {};

  try {
    addActivityCounts(delta);
  } catch (error) {
    // Devolve as contagens para tentar de novo no próximo ciclo.
    for (const [groupId, members] of Object.entries(delta)) {
      for (const [memberId, count] of Object.entries(members)) {
        pending[groupId] ??= {};
        pending[groupId][memberId] = (pending[groupId][memberId] || 0) + count;
      }
    }

    throw error;
  }
}

/** Contagens salvas + as que ainda estão na memória. */
export function getActivity(groupId) {
  const stored = getGroupActivity(groupId);
  const members = { ...(stored?.members || {}) };

  for (const [memberId, count] of Object.entries(pending[groupId] || {})) {
    members[memberId] = (members[memberId] || 0) + count;
  }

  return { since: stored?.since ?? Date.now(), members };
}

export function resetActivity(groupId) {
  delete pending[groupId];
  resetGroupActivity(groupId);
}
