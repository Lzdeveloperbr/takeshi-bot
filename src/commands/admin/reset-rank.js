import { PREFIX } from "../../config.js";
import { resetActivity } from "../../utils/activity.js";

export default {
  name: "reset-rank",
  description: "Zera o ranking de ativos e a contagem de inativos do grupo.",
  commands: ["reset-rank", "zerar-rank", "resetar-rank"],
  usage: `${PREFIX}reset-rank`,
  /**
   * @param {CommandHandleProps} props
   */
  handle: async ({ remoteJid, sendSuccessReply }) => {
    resetActivity(remoteJid);
    await sendSuccessReply("Ranking zerado! A contagem recomeça a partir de agora.");
  },
};
