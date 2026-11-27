/**
 * Economia do grupo (moedas). Os dados ficam no banco via database.js.
 */
import { getGroupWallets, getWallet, updateWallets } from "./database.js";

export const COIN = "🪙";
export const DAILY_COOLDOWN_MS = 20 * 60 * 60 * 1000;
const STREAK_WINDOW_MS = 48 * 60 * 60 * 1000;

export const formatCoins = (value) => `${Number(value || 0).toLocaleString("pt-BR")} ${COIN}`;

export function getBalance(groupId, memberId) {
  return getWallet(groupId, memberId).coins;
}

export function addCoins(groupId, memberId, amount) {
  return updateWallets(groupId, (wallets) => {
    wallets[memberId].coins = Math.max(0, wallets[memberId].coins + Math.round(amount));
    return wallets[memberId].coins;
  });
}

/**
 * Resgate diário: 100 a 300 moedas + 10% por dia seguido (máx. +70%).
 * @returns {{ ok: true, amount: number, streak: number, balance: number } | { ok: false, waitMs: number }}
 */
export function claimDaily(groupId, memberId, randomValue, now = Date.now()) {
  return updateWallets(groupId, (wallets) => {
    const wallet = wallets[memberId];
    const elapsed = now - wallet.lastDaily;

    if (wallet.lastDaily && elapsed < DAILY_COOLDOWN_MS) {
      return { ok: false, waitMs: DAILY_COOLDOWN_MS - elapsed };
    }

    wallet.streak = wallet.lastDaily && elapsed < STREAK_WINDOW_MS ? wallet.streak + 1 : 1;
    const bonus = Math.min(wallet.streak - 1, 7) * 0.1;
    const amount = Math.round(randomValue * (1 + bonus));

    wallet.coins += amount;
    wallet.lastDaily = now;

    return { ok: true, amount, streak: wallet.streak, balance: wallet.coins };
  });
}

/** @returns {{ ok: boolean, reason?: string, balance?: number }} */
export function transferCoins(groupId, fromId, toId, amount) {
  return updateWallets(groupId, (wallets) => {
    if (wallets[fromId].coins < amount) {
      return { ok: false, reason: "saldo" };
    }

    wallets[fromId].coins -= amount;
    wallets[toId].coins += amount;

    return { ok: true, balance: wallets[fromId].coins };
  });
}

/**
 * Aposta: 45% de chance de dobrar.
 * @returns {{ ok: boolean, won?: boolean, balance?: number }}
 */
export function placeBet(groupId, memberId, amount, won) {
  return updateWallets(groupId, (wallets) => {
    const wallet = wallets[memberId];

    if (wallet.coins < amount) {
      return { ok: false };
    }

    wallet.coins += won ? amount : -amount;
    return { ok: true, won, balance: wallet.coins };
  });
}

export function getRichest(groupId, limit = 10) {
  return Object.entries(getGroupWallets(groupId))
    .map(([id, wallet]) => [id, wallet.coins || 0])
    .filter(([, coins]) => coins > 0)
    .sort(([, a], [, b]) => b - a)
    .slice(0, limit);
}

export function formatDuration(ms) {
  const totalMinutes = Math.ceil(ms / 60_000);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return hours ? `${hours}h${minutes ? ` ${minutes}min` : ""}` : `${minutes}min`;
}
