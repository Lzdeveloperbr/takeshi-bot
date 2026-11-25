import os from "node:os";
import { PREFIX } from "../../config.js";

function formatBytes(bytes) {
  return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
}

export default {
  name: "diagnostico",
  description: "Exibe diagnóstico técnico do processo e do servidor.",
  commands: ["diagnostico", "diag"],
  usage: `${PREFIX}diagnostico`,
  /**
   * @param {CommandHandleProps} props
   */
  handle: async ({ sendReply }) => {
    const memory = process.memoryUsage();
    const cpus = os.cpus();
    const uptime = process.uptime();
    const hours = Math.floor(uptime / 3600);
    const minutes = Math.floor((uptime % 3600) / 60);
    const seconds = Math.floor(uptime % 60);

    await sendReply(
      `🛠️ *DIAGNÓSTICO DO TAKESHI BOT*

*Processo*
• PID: ${process.pid}
• Node.js: ${process.version}
• Uptime: ${hours}h ${minutes}min ${seconds}s
• RSS: ${formatBytes(memory.rss)}
• Heap usado: ${formatBytes(memory.heapUsed)}
• Heap total: ${formatBytes(memory.heapTotal)}
• Memória externa: ${formatBytes(memory.external)}

*Servidor*
• Sistema: ${os.type()} ${os.release()}
• Plataforma: ${os.platform()} / ${os.arch()}
• CPUs: ${cpus.length}
• RAM total: ${formatBytes(os.totalmem())}
• RAM livre: ${formatBytes(os.freemem())}
• Load average: ${os.loadavg().map((value) => value.toFixed(2)).join(" / ")}

*Observação:* diagnóstico local do processo. Não consulta nem exibe tokens, credenciais ou dados da sessão WhatsApp.`,
    );
  },
};
