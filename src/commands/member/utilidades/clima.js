import axios from "axios";
import { PREFIX } from "../../../config.js";
import { InvalidParameterError, WarningError } from "../../../errors/index.js";

export default {
  name: "clima",
  description: "Mostra o clima atual e a previsão de hoje de uma cidade.",
  commands: ["clima", "tempo", "previsao", "weather"],
  usage: `${PREFIX}clima São Paulo`,
  /**
   * @param {CommandHandleProps} props
   */
  handle: async ({ fullArgs, sendReply, sendWaitReact, sendSuccessReact }) => {
    const city = fullArgs?.trim();

    if (!city) {
      throw new InvalidParameterError(`Informe a cidade! Exemplo: ${PREFIX}clima São Paulo`);
    }

    await sendWaitReact();

    let data;
    try {
      ({ data } = await axios.get(`https://wttr.in/${encodeURIComponent(city)}`, {
        params: { format: "j1", lang: "pt" },
        timeout: 15_000,
      }));
    } catch {
      throw new WarningError("Não consegui consultar o clima agora. Tente novamente em instantes.");
    }

    const current = data?.current_condition?.[0];
    const today = data?.weather?.[0];
    const area = data?.nearest_area?.[0];

    if (!current || !today) {
      throw new WarningError(`Não encontrei a cidade "${city}".`);
    }

    const description = current.lang_pt?.[0]?.value || current.weatherDesc?.[0]?.value || "-";
    const place = [area?.areaName?.[0]?.value, area?.region?.[0]?.value, area?.country?.[0]?.value]
      .filter(Boolean)
      .join(", ");
    const rainChance = Math.max(...(today.hourly || []).map((h) => Number(h.chanceofrain) || 0));

    await sendSuccessReact();
    await sendReply(`🌤️ *Clima em ${place || city}*

🌡️ Agora: *${current.temp_C}°C* (sensação ${current.FeelsLikeC}°C)
☁️ Condição: ${description}
💧 Umidade: ${current.humidity}%
💨 Vento: ${current.windspeedKmph} km/h

📅 *Hoje*
🔺 Máxima: ${today.maxtempC}°C
🔻 Mínima: ${today.mintempC}°C
🌧️ Chance de chuva: ${Number.isFinite(rainChance) ? rainChance : 0}%`);
  },
};
