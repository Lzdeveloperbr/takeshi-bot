/**
 * Estado dos jogos em andamento (quiz e adivinhar) e placar por grupo.
 * Fica na memória: reiniciar o bot encerra os jogos e zera o placar.
 * Um jogo expira depois de 5 minutos sem nenhuma jogada.
 */
const GAME_TTL_MS = 5 * 60 * 1000;

const games = new Map();
const scores = new Map();

function key(chatId, type) {
  return `${chatId}:${type}`;
}

export function startGame(chatId, type, data, now = Date.now()) {
  const game = { ...data, startedAt: now, lastActivityAt: now };
  games.set(key(chatId, type), game);
  return game;
}

export function getGame(chatId, type, now = Date.now()) {
  const game = games.get(key(chatId, type));

  // Expira só depois de GAME_TTL_MS sem ninguém jogar.
  if (game && now - (game.lastActivityAt ?? game.startedAt) > GAME_TTL_MS) {
    games.delete(key(chatId, type));
    return null;
  }

  if (game) game.lastActivityAt = now;

  return game || null;
}

export function endGame(chatId, type) {
  games.delete(key(chatId, type));
}

export function addPoint(chatId, memberId, points = 1) {
  const chatScores = scores.get(chatId) || new Map();
  chatScores.set(memberId, (chatScores.get(memberId) || 0) + points);
  scores.set(chatId, chatScores);
  return chatScores.get(memberId);
}

export function getScores(chatId) {
  return [...(scores.get(chatId) || new Map())].sort(([, a], [, b]) => b - a);
}

export function resetGames() {
  games.clear();
  scores.clear();
}
