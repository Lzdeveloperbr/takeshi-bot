import { PREFIX } from "../../../config.js";
import { WarningError } from "../../../errors/index.js";
import { randomCatImage } from "../../../services/extra-apis.js";

export default {
  name: "gato",
  description: "Manda uma foto aleatória de gato.",
  commands: ["gato", "gatinho", "cat"],
  usage: `${PREFIX}gato`,
  /**
   * @param {CommandHandleProps} props
   */
  handle: async ({ sendImageFromURL, sendWaitReact, sendSuccessReact }) => {
    await sendWaitReact();
    const url = await randomCatImage();
    if (!url) throw new WarningError("Os gatos estão dormindo agora. Tente de novo!");
    await sendSuccessReact();
    await sendImageFromURL(url, "🐱 Miau!");
  },
};
