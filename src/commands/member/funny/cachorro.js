import { PREFIX } from "../../../config.js";
import { WarningError } from "../../../errors/index.js";
import { randomDogImage } from "../../../services/extra-apis.js";

export default {
  name: "cachorro",
  description: "Manda uma foto aleatória de cachorro.",
  commands: ["cachorro", "doguinho", "dog", "au"],
  usage: `${PREFIX}cachorro`,
  /**
   * @param {CommandHandleProps} props
   */
  handle: async ({ sendImageFromURL, sendWaitReact, sendSuccessReact }) => {
    await sendWaitReact();
    const url = await randomDogImage();
    if (!url) throw new WarningError("Os doguinhos foram passear. Tente de novo!");
    await sendSuccessReact();
    await sendImageFromURL(url, "🐶 Au au!");
  },
};
