/**
 * APIs públicas e gratuitas (sem cadastro/token) usadas por comandos extras.
 * Todas podem ficar fora do ar ou limitar o uso; os comandos avisam quando
 * isso acontece.
 */
import axios from "axios";
import { WarningError } from "../errors/index.js";

const http = axios.create({
  timeout: 20_000,
  headers: { "User-Agent": "Mozilla/5.0 (WhatsApp bot)" },
});

function unavailable(service) {
  return new WarningError(`O serviço de ${service} está fora do ar ou ocupado agora. Tente de novo em instantes.`);
}

/** Tradução gratuita (Google Tradutor). */
export async function translate(text, target = "pt", source = "auto") {
  try {
    const { data } = await http.get("https://translate.googleapis.com/translate_a/single", {
      params: { client: "gtx", sl: source, tl: target, dt: "t", q: text },
    });

    return {
      text: (data?.[0] || []).map((part) => part?.[0] || "").join(""),
      from: data?.[2] || source,
    };
  } catch {
    throw unavailable("tradução");
  }
}

/** Encurtador de links (is.gd). */
export async function shortenUrl(url) {
  try {
    const { data } = await http.get("https://is.gd/create.php", {
      params: { format: "json", url },
    });

    if (data?.errormessage) throw new WarningError(`Não consegui encurtar: ${data.errormessage}`);
    return data.shorturl;
  } catch (error) {
    if (error instanceof WarningError) throw error;
    throw unavailable("encurtar links");
  }
}

/** Preço de criptomoedas em reais e dólares (CoinGecko). */
export async function cryptoPrices(ids) {
  try {
    const { data } = await http.get("https://api.coingecko.com/api/v3/simple/price", {
      params: { ids: ids.join(","), vs_currencies: "brl,usd", include_24hr_change: true },
    });
    return data;
  } catch {
    throw unavailable("criptomoedas");
  }
}

/** Letra de música (lyrics.ovh). */
export async function lyrics(artist, title) {
  try {
    const { data } = await http.get(
      `https://api.lyrics.ovh/v1/${encodeURIComponent(artist)}/${encodeURIComponent(title)}`,
    );
    return data?.lyrics?.trim() || null;
  } catch (error) {
    if (error.response?.status === 404) return null;
    throw unavailable("letras de música");
  }
}

/** Pokémon por nome ou número (PokéAPI). */
export async function pokemon(nameOrId) {
  try {
    const { data } = await http.get(`https://pokeapi.co/api/v2/pokemon/${encodeURIComponent(nameOrId)}`);
    return data;
  } catch (error) {
    if (error.response?.status === 404) return null;
    throw unavailable("Pokémon");
  }
}

export async function randomCatImage() {
  try {
    const { data } = await http.get("https://api.thecatapi.com/v1/images/search");
    return data?.[0]?.url;
  } catch {
    throw unavailable("fotos de gatos");
  }
}

export async function randomDogImage() {
  try {
    const { data } = await http.get("https://dog.ceo/api/breeds/image/random");
    return data?.message;
  } catch {
    throw unavailable("fotos de cachorros");
  }
}
