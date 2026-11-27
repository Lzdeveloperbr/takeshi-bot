import { randomInt } from "node:crypto";
import { PREFIX } from "../../../config.js";
import { WarningError } from "../../../errors/index.js";
import { pokemon } from "../../../services/extra-apis.js";

const TYPES = {
  normal: "Normal", fire: "🔥 Fogo", water: "💧 Água", grass: "🌿 Planta", electric: "⚡ Elétrico",
  ice: "❄️ Gelo", fighting: "🥊 Lutador", poison: "☠️ Veneno", ground: "🌍 Terra", flying: "🕊️ Voador",
  psychic: "🔮 Psíquico", bug: "🐛 Inseto", rock: "🪨 Pedra", ghost: "👻 Fantasma", dragon: "🐉 Dragão",
  dark: "🌑 Sombrio", steel: "⚙️ Aço", fairy: "🧚 Fada",
};

const STATS = { hp: "HP", attack: "Ataque", defense: "Defesa", speed: "Velocidade" };

export default {
  name: "pokemon",
  description: "Mostra um Pokémon (pelo nome, número, ou aleatório).",
  commands: ["pokemon", "pokémon", "poke", "pokedex"],
  usage: `${PREFIX}pokemon pikachu  |  ${PREFIX}pokemon 25  |  ${PREFIX}pokemon`,
  /**
   * @param {CommandHandleProps} props
   */
  handle: async ({ fullArgs, sendImageFromURL, sendReply, sendWaitReact, sendSuccessReact }) => {
    const query = (fullArgs || "").trim().toLowerCase().replace(/\s+/g, "-") || String(randomInt(1, 1026));

    await sendWaitReact();
    const data = await pokemon(query);

    if (!data) {
      throw new WarningError(`Não encontrei o Pokémon "${fullArgs.trim()}".`);
    }

    const name = data.name.charAt(0).toUpperCase() + data.name.slice(1);
    const types = data.types.map(({ type }) => TYPES[type.name] || type.name).join(" / ");
    const stats = data.stats
      .filter(({ stat }) => STATS[stat.name])
      .map(({ stat, base_stat: value }) => `${STATS[stat.name]}: ${value}`)
      .join(" | ");

    const text = `⚪ *#${data.id} ${name}*\n\n🏷️ Tipo: ${types}\n📏 Altura: ${(data.height / 10).toFixed(1)} m\n⚖️ Peso: ${(data.weight / 10).toFixed(1)} kg\n📊 ${stats}`;
    const image =
      data.sprites?.other?.["official-artwork"]?.front_default || data.sprites?.front_default;

    await sendSuccessReact();

    if (image) await sendImageFromURL(image, text);
    else await sendReply(text);
  },
};
