import { randomInt } from "node:crypto";
import { PREFIX } from "../../../config.js";
import { InvalidParameterError, WarningError } from "../../../errors/index.js";
import { formatCoins, getBalance, placeBet } from "../../../utils/economy.js";

const MIN_BET = 10;
const WIN_CHANCE_PERCENT = 45;

export default {
  name: "apostar",
  description: `Aposta moedas: ${WIN_CHANCE_PERCENT}% de chance de dobrar.`,
  commands: ["apostar", "aposta", "bet", "cassino"],
  usage: `${PREFIX}apostar 100  (ou ${PREFIX}apostar tudo)`,
  /**
   * @param {CommandHandleProps} props
   */
  handle: async ({ isGroup, remoteJid, userLid, args, sendReply, sendReact }) => {
    if (!isGroup) {
      throw new WarningError("A economia funciona dentro dos grupos.");
    }

    const balance = getBalance(remoteJid, userLid);
    const input = (args[0] || "").toLowerCase();
    const amount = ["tudo", "all"].includes(input) ? balance : Number.parseInt(input, 10);

    if (!Number.isInteger(amount) || amount < MIN_BET) {
      throw new InvalidParameterError(`Aposte pelo menos ${MIN_BET} moedas. Exemplo: ${PREFIX}apostar 100`);
    }

    if (amount > balance) {
      throw new WarningError(`Saldo insuficiente! Você tem ${formatCoins(balance)}.`);
    }

    const result = placeBet(remoteJid, userLid, amount, randomInt(100) < WIN_CHANCE_PERCENT);

    if (!result.ok) {
      throw new WarningError("Saldo insuficiente!");
    }

    await sendReact(result.won ? "🤑" : "💸");
    await sendReply(
      result.won
        ? `🎰 *GANHOU!* +${formatCoins(amount)}\n👛 Saldo: *${formatCoins(result.balance)}*`
        : `🎰 *Perdeu...* -${formatCoins(amount)}\n👛 Saldo: *${formatCoins(result.balance)}*`,
    );
  },
};
