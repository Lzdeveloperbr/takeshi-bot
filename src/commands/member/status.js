import os from "node:os";
import { PREFIX } from "../../config.js";

function formatBytes(bytes) {
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

function formatUptime(totalSeconds) {
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = Math.floor(totalSeconds % 60);

  return [
    days ? `${days}d` : null,
    hours ? `${hours}h` : null,
    minutes ? `${minutes}min` : null,
    `${seconds}s`,
  ].filter(Boolean).join(" ");
}

export default {
  name: "status",
  description: "Mostra a saúde, memória e tempo online do bot.",
  commands: ["status", "estado"],
  usage: `${PREFIX}status`,
  /**
   * @param {CommandHandleProps} props
   */
  handle: async ({ sendReply }) => {
    const memory = process.memoryUsage();
    const totalMemory = os.totalmem();
    const freeMemory = os.freemem();
    const memoryPercent = ((totalMemory - freeMemory) / totalMemory) * 100;

    await sendReply(
      `🖥️ *STATUS DO PROCESSO TAKESHI BOT*

⏱️ *Tempo online:* ${formatUptime(process.uptime())}
⚙️ *Node.js:* ${process.version}
🖥️ *Sistema:* ${os.platform()} (${os.arch()})
💾 *RAM do processo:* ${formatBytes(memory.rss)}
📦 *Heap utilizado:* ${formatBytes(memory.heapUsed)} / ${formatBytes(memory.heapTotal)}
🧠 *Memória livre do servidor:* ${formatBytes(freeMemory)}
📊 *Uso de RAM do servidor:* ${memoryPercent.toFixed(1)}%

_Status informativo; não representa garantia de disponibilidade da conexão WhatsApp._`,
    );
  },
};
