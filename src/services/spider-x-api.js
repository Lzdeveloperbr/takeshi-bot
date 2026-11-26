/**
 * Funções de comunicação
 * com a API do Spider X.
 *
 * @author Dev Gui
 */
import axios from "axios";

import * as config from "../config.js";
import { getSpiderApiToken } from "../utils/database.js";
import {
  freeImageAI,
  freeTextAI,
  freeTTS,
  ytDlpDownload,
  ytDlpPlay,
  ytDlpSearch,
} from "./free-api.js";

const { SPIDER_API_BASE_URL } = config;

/**
 * Não configure o token da Spider X API aqui, configure em: src/config.js
 */
function isSpiderApiTokenConfigured(token) {
  return token && token.trim() !== "" && token !== "seu_token_aqui";
}

const messageIfTokenNotConfigured = `Token da API do Spider X não configurado!
      
Para configurar, entre na pasta: \`src\` 
e edite o arquivo \`config.js\`:

Procure por:

\`export const SPIDER_API_TOKEN = "seu_token_aqui";\`

ou

Use o comando:

${config.PREFIX}set-spider-api-token seu_token_aqui

Não esqueça de ver se ${config.PREFIX} é seu prefixo!

Para obter o seu token, 
crie uma conta em: https://api.spiderx.com.br
e contrate um plano!`;

export let spiderAPITokenConfigured =
  isSpiderApiTokenConfigured(getSpiderApiToken());

function requireSpiderApiToken() {
  const token = getSpiderApiToken();
  spiderAPITokenConfigured = isSpiderApiTokenConfigured(token);

  if (!spiderAPITokenConfigured) {
    throw new Error(messageIfTokenNotConfigured);
  }

  return token;
}

async function spider_play(type, search) {
  if (!search) {
    throw new Error("Você precisa informar o que deseja buscar!");
  }

  const spiderApiToken = requireSpiderApiToken();

  const { data } = await axios.get(
    `${SPIDER_API_BASE_URL}/downloads/play-${type}?search=${encodeURIComponent(
      search,
    )}&api_key=${spiderApiToken}`,
  );

  return data;
}

async function spider_download(type, url) {
  if (!url) {
    throw new Error("Você precisa informar uma URL do que deseja buscar!");
  }

  const spiderApiToken = requireSpiderApiToken();

  const { data } = await axios.get(
    `${SPIDER_API_BASE_URL}/downloads/${type}?url=${encodeURIComponent(
      url,
    )}&api_key=${spiderApiToken}`,
  );

  return data;
}

export async function facebook(url) {
  return download("facebook", url);
}

export async function xTwitter(url) {
  return download("x-twitter", url);
}

async function spider_gemini(text) {
  if (!text) {
    throw new Error("Você precisa informar o parâmetro de texto!");
  }

  const spiderApiToken = requireSpiderApiToken();

  const { data } = await axios.post(
    `${SPIDER_API_BASE_URL}/ai/gemini?api_key=${spiderApiToken}`,
    {
      text,
    },
  );

  return data.response;
}

async function spider_gpt5Mini(text) {
  if (!text) {
    throw new Error("Você precisa informar o parâmetro de texto!");
  }

  const spiderApiToken = requireSpiderApiToken();

  const { data } = await axios.post(
    `${SPIDER_API_BASE_URL}/ai/gpt-5-mini?api_key=${spiderApiToken}`,
    {
      text,
    },
  );

  return data.response;
}

async function spider_deepseekV4Flash(text) {
  if (!text) {
    throw new Error("Você precisa informar o parâmetro de texto!");
  }

  const spiderApiToken = requireSpiderApiToken();

  const { data } = await axios.post(
    `${SPIDER_API_BASE_URL}/ai/deepseek-v4-flash?api_key=${spiderApiToken}`,
    {
      text,
    },
  );

  return data.response;
}

export async function transcribe(audioBuffer, mimeType, fileName) {
  if (!audioBuffer) {
    throw new Error("Você precisa informar o buffer do áudio!");
  }

  const spiderApiToken = requireSpiderApiToken();
  const formData = new FormData();
  const blob = new Blob([audioBuffer], { type: mimeType || "audio/ogg" });

  formData.append("audio", blob, fileName || "audio.ogg");

  const { data } = await axios.post(
    `${SPIDER_API_BASE_URL}/ai/whisper-v3-turbo?api_key=${spiderApiToken}`,
    formData,
    {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    },
  );

  if (!data?.success || !data.transcription) {
    throw new Error(data?.message || "Não foi possível transcrever o áudio.");
  }

  return data.transcription;
}

const TTS_ALLOWED_VOICES = ["joao", "joão", "ana", "pedro"];
const TTS_MIN_TEXT_LENGTH = 5;
const TTS_MAX_TEXT_LENGTH = 2048;

async function spider_tts(text, voice = "joao") {
  if (!text) {
    throw new Error("Você precisa informar o texto para converter em áudio!");
  }

  const normalizedText = String(text).trim();

  if (normalizedText.length < TTS_MIN_TEXT_LENGTH) {
    throw new Error(
      `O texto deve ter no mínimo ${TTS_MIN_TEXT_LENGTH} caracteres.`,
    );
  }

  if (normalizedText.length > TTS_MAX_TEXT_LENGTH) {
    throw new Error(
      `O texto deve ter no máximo ${TTS_MAX_TEXT_LENGTH} caracteres.`,
    );
  }

  const normalizedVoice = String(voice || "joao").trim().toLowerCase();

  if (!TTS_ALLOWED_VOICES.includes(normalizedVoice)) {
    throw new Error("Voz inválida! Use: joao, ana ou pedro.");
  }

  const spiderApiToken = requireSpiderApiToken();

  const { data } = await axios.post(
    `${SPIDER_API_BASE_URL}/ai/tts?api_key=${spiderApiToken}`,
    {
      text: normalizedText,
      voice: normalizedVoice,
    },
  );

  if (!data?.success || !data.url) {
    throw new Error(data?.message || "Não foi possível gerar o áudio.");
  }

  return data.url;
}

export async function attp(text) {
  if (!text) {
    throw new Error("Você precisa informar o parâmetro de texto!");
  }

  const spiderApiToken = requireSpiderApiToken();

  return `${SPIDER_API_BASE_URL}/stickers/attp?text=${encodeURIComponent(
    text,
  )}&api_key=${spiderApiToken}`;
}

export async function ttp(text) {
  if (!text) {
    throw new Error("Você precisa informar o parâmetro de texto!");
  }

  const spiderApiToken = requireSpiderApiToken();

  return `${SPIDER_API_BASE_URL}/stickers/ttp?text=${encodeURIComponent(
    text,
  )}&api_key=${spiderApiToken}`;
}

export async function brat(text) {
  if (!text) {
    throw new Error("Você precisa informar o parâmetro de texto!");
  }

  const spiderApiToken = requireSpiderApiToken();

  return `${SPIDER_API_BASE_URL}/stickers/brat?text=${encodeURIComponent(
    text,
  )}&api_key=${spiderApiToken}`;
}

export async function abrat(text) {
  if (!text) {
    throw new Error("Você precisa informar o parâmetro de texto!");
  }

  const spiderApiToken = requireSpiderApiToken();

  return `${SPIDER_API_BASE_URL}/stickers/abrat?text=${encodeURIComponent(
    text,
  )}&api_key=${spiderApiToken}`;
}

export async function pinterest(search) {
  if (!search) {
    throw new Error("Você precisa informar o parâmetro de pesquisa!");
  }

  const spiderApiToken = requireSpiderApiToken();

  const { data } = await axios.get(
    `${SPIDER_API_BASE_URL}/downloads/pinterest?search=${encodeURIComponent(
      search,
    )}&api_key=${spiderApiToken}`,
  );

  return data;
}

async function spider_search(type, search) {
  if (!search) {
    throw new Error("Você precisa informar o parâmetro de pesquisa!");
  }

  const spiderApiToken = requireSpiderApiToken();

  const { data } = await axios.get(
    `${SPIDER_API_BASE_URL}/search/${type}?search=${encodeURIComponent(
      search,
    )}&api_key=${spiderApiToken}`,
  );

  return data;
}

export function welcome(title, description, imageURL) {
  if (!title || !description || !imageURL) {
    throw new Error(
      "Você precisa informar o título, descrição e URL da imagem!",
    );
  }

  const spiderApiToken = requireSpiderApiToken();

  return `${SPIDER_API_BASE_URL}/canvas/welcome?title=${encodeURIComponent(
    title,
  )}&description=${encodeURIComponent(
    description,
  )}&image_url=${encodeURIComponent(imageURL)}&api_key=${spiderApiToken}`;
}

export function exit(title, description, imageURL) {
  if (!title || !description || !imageURL) {
    throw new Error(
      "Você precisa informar o título, descrição e URL da imagem!",
    );
  }

  const spiderApiToken = requireSpiderApiToken();

  return `${SPIDER_API_BASE_URL}/canvas/goodbye?title=${encodeURIComponent(
    title,
  )}&description=${encodeURIComponent(
    description,
  )}&image_url=${encodeURIComponent(imageURL)}&api_key=${spiderApiToken}`;
}

async function spider_imageAI(description) {
  if (!description) {
    throw new Error("Você precisa informar a descrição da imagem!");
  }

  const spiderApiToken = requireSpiderApiToken();

  const { data } = await axios.get(
    `${SPIDER_API_BASE_URL}/ai/flux?text=${encodeURIComponent(
      description,
    )}&api_key=${spiderApiToken}`,
  );

  return data;
}

export function canvas(type, imageURL) {
  if (!imageURL) {
    throw new Error("Você precisa informar a URL da imagem!");
  }

  const spiderApiToken = requireSpiderApiToken();

  return `${SPIDER_API_BASE_URL}/canvas/${type}?image_url=${encodeURIComponent(
    imageURL,
  )}&api_key=${spiderApiToken}`;
}

export async function updatePlanUser(email, plan) {
  const spiderApiToken = requireSpiderApiToken();

  const { data } = await axios.post(
    `${SPIDER_API_BASE_URL}/internal/update-plan-user?api_key=${spiderApiToken}`,
    {
      email,
      plan,
    },
  );

  return data;
}

export async function toGif(buffer) {
  if (!buffer) {
    throw new Error("Você precisa informar o buffer do arquivo!");
  }

  const spiderApiToken = requireSpiderApiToken();

  const formData = new FormData();
  const blob = new Blob([buffer], { type: "image/webp" });
  formData.append("file", blob, "sticker.webp");

  const { data } = await axios.post(
    `${SPIDER_API_BASE_URL}/utilities/to-gif?api_key=${spiderApiToken}`,
    formData,
    {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    },
  );

  return data.url;
}

export async function removeBg(
  buffer,
  mimeType = "image/png",
  fileName = "image.png",
) {
  if (!buffer) {
    throw new Error("Você precisa informar o buffer da imagem!");
  }

  const spiderApiToken = requireSpiderApiToken();

  const formData = new FormData();
  const blob = new Blob([buffer], { type: mimeType });
  formData.append("image", blob, fileName);

  const { data } = await axios.post(
    `${SPIDER_API_BASE_URL}/removebg?api_key=${spiderApiToken}`,
    formData,
    {
      headers: {
        "Content-Type": "multipart/form-data",
      },
      responseType: "arraybuffer",
    },
  );

  return Buffer.from(data);
}

/**
 * ------------------------------------------------------------------
 * Alternativas gratuitas (free-api.js)
 *
 * Sem token da Spider X configurado, o bot usa as alternativas grátis.
 * Com token, usa a Spider X e, se ela falhar, tenta a alternativa grátis.
 * ------------------------------------------------------------------
 */
async function withFreeFallback(spiderCall, freeCall) {
  if (!freeCall) {
    return spiderCall();
  }

  spiderAPITokenConfigured = isSpiderApiTokenConfigured(getSpiderApiToken());

  if (!spiderAPITokenConfigured) {
    return freeCall();
  }

  try {
    return await spiderCall();
  } catch (spiderError) {
    try {
      return await freeCall();
    } catch {
      throw spiderError;
    }
  }
}

const FREE_DOWNLOAD_TYPES = {
  "yt-mp3": { audio: true },
  "yt-mp4": { audio: false },
  "tik-tok": { audio: false },
  "tik-tok-audio": { audio: true },
  instagram: { audio: false },
  facebook: { audio: false },
  "x-twitter": { audio: false },
};

export async function play(type, search) {
  if (!search) {
    throw new Error("Você precisa informar o que deseja buscar!");
  }

  return withFreeFallback(
    () => spider_play(type, search),
    () => ytDlpPlay(type, search),
  );
}

export async function download(type, url) {
  if (!url) {
    throw new Error("Você precisa informar uma URL do que deseja buscar!");
  }

  const freeType = FREE_DOWNLOAD_TYPES[type];

  return withFreeFallback(
    () => spider_download(type, url),
    freeType ? () => ytDlpDownload(url.trim(), freeType) : null,
  );
}

export async function gemini(text) {
  return withFreeFallback(() => spider_gemini(text), () => freeTextAI(text));
}

export async function gpt5Mini(text) {
  return withFreeFallback(() => spider_gpt5Mini(text), () => freeTextAI(text));
}

export async function deepseekV4Flash(text) {
  return withFreeFallback(
    () => spider_deepseekV4Flash(text),
    () => freeTextAI(text),
  );
}

export async function tts(text, voice = "joao") {
  const normalizedVoice = String(voice || "joao").trim().toLowerCase();

  if (!TTS_ALLOWED_VOICES.includes(normalizedVoice)) {
    throw new Error("Voz inválida! Use: joao, ana ou pedro.");
  }

  // A voz grátis (Google) é única; as vozes joao/ana/pedro são da Spider X.
  return withFreeFallback(
    () => spider_tts(text, voice),
    () => freeTTS(String(text || "").trim()),
  );
}

export async function search(type, query) {
  return withFreeFallback(
    () => spider_search(type, query),
    type === "youtube" && query ? () => ytDlpSearch(query) : null,
  );
}

export async function imageAI(description) {
  if (!description) {
    throw new Error("Você precisa informar a descrição da imagem!");
  }

  return withFreeFallback(
    () => spider_imageAI(description),
    async () => freeImageAI(description),
  );
}
