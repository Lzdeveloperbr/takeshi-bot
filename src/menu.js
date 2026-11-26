/**
 * Menu do bot
 *
 * @author Dev Gui
 */
import pkg from "../package.json" with { type: "json" };
import { BOT_NAME } from "./config.js";
import { getPrefix } from "./utils/database.js";
import { listButton, quickReply } from "./utils/buttons.js";
import { readMore } from "./utils/index.js";

export function menuMessage(groupJid) {
  const date = new Date();

  const prefix = getPrefix(groupJid);

  return `╭━━⪩ BEM VINDO! ⪨━━${readMore()}
▢
▢ • ${BOT_NAME}
▢ • Data: ${date.toLocaleDateString("pt-br")}
▢ • Hora: ${date.toLocaleTimeString("pt-br")}
▢ • Prefixo: ${prefix}
▢ • Versão: ${pkg.version}
▢
╰━━─「🪐」─━━

╭━━⪩ DONO ⪨━━
▢
▢ • ${prefix}exec
▢ • ${prefix}get-group-id
▢ • ${prefix}diagnostico
▢ • ${prefix}off
▢ • ${prefix}on
▢ • ${prefix}set-menu-image
▢ • ${prefix}set-prefix
▢ • ${prefix}set-spider-api-token
▢
╰━━─「🌌」─━━

╭━━⪩ ADMINS ⪨━━
▢
▢ • ${prefix}abrir
▢ • ${prefix}add
▢ • ${prefix}add-palavra
▢ • ${prefix}add-auto-responder
▢ • ${prefix}agendar-mensagem
▢ • ${prefix}anti-flood (1/0)
▢ • ${prefix}anti-palavra (1/0)
▢ • ${prefix}aprovar
▢ • ${prefix}anti-audio (1/0)
▢ • ${prefix}anti-call (1/0)
▢ • ${prefix}anti-document (1/0)
▢ • ${prefix}anti-event (1/0)
▢ • ${prefix}anti-image (1/0)
▢ • ${prefix}anti-link (1/0)
▢ • ${prefix}anti-lottie-sticker (1/0)
▢ • ${prefix}anti-payment (1/0)
▢ • ${prefix}anti-product (1/0)
▢ • ${prefix}anti-sticker (1/0)
▢ • ${prefix}anti-status-grupo (1/0)
▢ • ${prefix}anti-video (1/0)
▢ • ${prefix}auto-responder (1/0)
▢ • ${prefix}auto-sticker (1/0)
▢ • ${prefix}ban
▢ • ${prefix}delete
▢ • ${prefix}delete-auto-responder
▢ • ${prefix}del-palavra
▢ • ${prefix}exit (1/0)
▢ • ${prefix}fechar
▢ • ${prefix}inativos
▢ • ${prefix}hidetag
▢ • ${prefix}limpar-chat
▢ • ${prefix}link-grupo
▢ • ${prefix}list-auto-responder
▢ • ${prefix}mute
▢ • ${prefix}only-admin (1/0)
▢ • ${prefix}palavras
▢ • ${prefix}promover
▢ • ${prefix}rebaixar
▢ • ${prefix}reset-rank
▢ • ${prefix}revogar-link
▢ • ${prefix}revelar
▢ • ${prefix}saldo
▢ • ${prefix}set-desc
▢ • ${prefix}set-foto
▢ • ${prefix}set-proxy
▢ • ${prefix}set-regras
▢ • ${prefix}unmute
▢ • ${prefix}welcome (1/0)
▢
╰━━─「⭐」─━━

╭━━⪩ PRINCIPAL ⪨━━
▢
▢ • ${prefix}attp
▢ • ${prefix}brat
▢ • ${prefix}bratvid
▢ • ${prefix}cep
▢ • ${prefix}enquete
▢ • ${prefix}exemplos-de-mensagens
▢ • ${prefix}fake-chat
▢ • ${prefix}gerar-link
▢ • ${prefix}grupo
▢ • ${prefix}info
▢ • ${prefix}meu-lid
▢ • ${prefix}painel (botões)
▢ • ${prefix}perfil
▢ • ${prefix}ping
▢ • ${prefix}raw-message
▢ • ${prefix}rename
▢ • ${prefix}removebg
▢ • ${prefix}sticker
▢ • ${prefix}som (figurinha com som)
▢ • ${prefix}suporte
▢ • ${prefix}status
▢ • ${prefix}sorteio [quantidade]
▢ • ${prefix}to-gif
▢ • ${prefix}to-image
▢ • ${prefix}to-mp3
▢ • ${prefix}ttp
▢ • ${prefix}yt-search
▢
╰━━─「🚀」─━━

╭━━⪩ UTILIDADES ⪨━━
▢
▢ • ${prefix}admins
▢ • ${prefix}aleatorio
▢ • ${prefix}calc
▢ • ${prefix}clima
▢ • ${prefix}contar
▢ • ${prefix}cotacao
▢ • ${prefix}idade
▢ • ${prefix}lembrete
▢ • ${prefix}qrcode
▢ • ${prefix}rank
▢ • ${prefix}regras
▢ • ${prefix}senha
▢ • ${prefix}signo
▢ • ${prefix}wiki
▢
╰━━─「🧰」─━━

╭━━⪩ CONSULTAS ⪨━━
▢
▢ • ${prefix}banco
▢ • ${prefix}cep
▢ • ${prefix}cnpj
▢ • ${prefix}ddd
▢ • ${prefix}dominio
▢ • ${prefix}feriados
▢ • ${prefix}isbn
▢ • ${prefix}taxas
▢
╰━━─「🔎」─━━

╭━━⪩ DOWNLOADS ⪨━━
▢
▢ • ${prefix}facebook
▢ • ${prefix}instagram
▢ • ${prefix}play-audio
▢ • ${prefix}play-video
▢ • ${prefix}pinterest
▢ • ${prefix}tik-tok
▢ • ${prefix}tik-tok-audio
▢ • ${prefix}xtwitter
▢ • ${prefix}yt-mp3
▢ • ${prefix}yt-mp4
▢
╰━━─「🎶」─━━

╭━━⪩ BRINCADEIRAS ⪨━━
▢
▢ • ${prefix}abracar
▢ • ${prefix}beijar
▢ • ${prefix}cantada
▢ • ${prefix}casal-do-dia
▢ • ${prefix}curiosidade
▢ • ${prefix}escolher
▢ • ${prefix}eu-nunca
▢ • ${prefix}jantar
▢ • ${prefix}lutar
▢ • ${prefix}matar
▢ • ${prefix}pergunta
▢ • ${prefix}piada
▢ • ${prefix}ship
▢ • ${prefix}socar
▢ • ${prefix}tapa
▢ • ${prefix}top5
▢ • ${prefix}vd (verdade ou desafio)
▢
╰━━─「🎡」─━━

╭━━⪩ JOGOS ⪨━━
▢
▢ • ${prefix}adivinhar
▢ • ${prefix}chute
▢ • ${prefix}dado
▢ • ${prefix}moeda
▢ • ${prefix}placar
▢ • ${prefix}ppt
▢ • ${prefix}quiz
▢ • ${prefix}r (responder o quiz)
▢
╰━━─「🎮」─━━

╭━━⪩ IA ⪨━━
▢
▢ • ${prefix}deepseek
▢ • ${prefix}flux
▢ • ${prefix}gemini
▢ • ${prefix}gpt-5-mini
▢ • ${prefix}ia-sticker
▢ • ${prefix}transcrever
▢ • ${prefix}tts
▢
╰━━─「🚀」─━━

╭━━⪩ CANVAS ⪨━━
▢
▢ • ${prefix}blur
▢ • ${prefix}bolsonaro
▢ • ${prefix}cadeia
▢ • ${prefix}contraste
▢ • ${prefix}espelhar
▢ • ${prefix}gray
▢ • ${prefix}inverter
▢ • ${prefix}pixel
▢ • ${prefix}rip
▢
╰━━─「❇」─━━`;
}

/**
 * Painel de botões do menu.
 *
 * Itens com "run" executam o comando na hora.
 * Itens com "info" mostram como usar o comando (para os que precisam de texto,
 * link ou mídia). O valor de "info" é o nome do arquivo do comando.
 * Edite à vontade: cada seção aceita até 10 itens.
 */
const MENU_SECTIONS = [
  {
    title: "⬇️ Downloads",
    rows: [
      { title: "Música do YouTube", info: "play-audio" },
      { title: "Vídeo do YouTube", info: "play-video" },
      { title: "TikTok", info: "tik-tok" },
      { title: "Instagram", info: "instagram" },
      { title: "Pesquisar no YouTube", info: "yt-search" },
    ],
  },
  {
    title: "🖼️ Figurinhas",
    rows: [
      { title: "Figurinha", info: "sticker" },
      { title: "Figurinha com som", info: "figaudio" },
      { title: "Figurinha de texto (attp)", info: "attp" },
      { title: "Figurinha brat", info: "brat" },
      { title: "Figurinha para imagem", info: "to-image" },
    ],
  },
  {
    title: "🤖 Inteligência artificial",
    rows: [
      { title: "Gemini", info: "gemini" },
      { title: "GPT-5 Mini", info: "gpt-5-mini" },
      { title: "Gerar imagem (Flux)", info: "flux" },
      { title: "Texto para voz", info: "tts" },
    ],
  },
  {
    title: "🧰 Utilidades",
    rows: [
      { title: "Cotação do dólar", run: "cotacao" },
      { title: "Gerar senha forte", run: "senha" },
      { title: "Ranking de ativos", run: "rank" },
      { title: "Regras do grupo", run: "regras" },
      { title: "Chamar os admins", run: "admins" },
      { title: "Calculadora", info: "calc" },
      { title: "Clima", info: "clima" },
      { title: "Wikipédia", info: "wiki" },
      { title: "Lembrete", info: "lembrete" },
      { title: "QR Code", info: "qrcode" },
    ],
  },
  {
    title: "🔎 Consultas",
    rows: [
      { title: "Feriados do ano", run: "feriados" },
      { title: "Taxas Selic/CDI/IPCA", run: "taxas" },
      { title: "Empresa pelo CNPJ", info: "cnpj" },
      { title: "CEP", info: "cep" },
      { title: "DDD", info: "ddd" },
      { title: "Banco pelo código", info: "banco" },
      { title: "Livro pelo ISBN", info: "isbn" },
      { title: "Domínio .br", info: "dominio" },
    ],
  },
  {
    title: "🎮 Jogos",
    rows: [
      { title: "Quiz", run: "quiz" },
      { title: "Adivinhe o número", run: "adivinhar" },
      { title: "Placar dos jogos", run: "placar" },
      { title: "Verdade ou desafio", run: "vd" },
      { title: "Eu nunca", run: "eu-nunca" },
      { title: "Pedra, papel e tesoura", run: "ppt pedra" },
      { title: "Cara ou coroa", run: "moeda" },
      { title: "Dado", info: "dado" },
    ],
  },
  {
    title: "😂 Brincadeiras",
    rows: [
      { title: "Piada", run: "piada" },
      { title: "Curiosidade", run: "curiosidade" },
      { title: "Cantada", run: "cantada" },
      { title: "Casal do dia", run: "casal-do-dia" },
      { title: "Top 5 do grupo", info: "top5" },
      { title: "Ship (casal)", info: "ship" },
      { title: "Bola 8 mágica", info: "pergunta" },
      { title: "Escolher entre opções", info: "escolher" },
      { title: "Número aleatório", run: "aleatorio" },
      { title: "Signo", info: "signo" },
    ],
  },
  {
    title: "ℹ️ Bot e grupo",
    rows: [
      { title: "Informações do grupo", run: "grupo" },
      { title: "Criar enquete", info: "enquete" },
      { title: "Ping", run: "ping" },
      { title: "Status do bot", run: "status" },
      { title: "Meu perfil", run: "perfil" },
      { title: "Meu LID", run: "meu-lid" },
    ],
  },
];

export function menuButtons(groupJid) {
  const prefix = getPrefix(groupJid);

  const sections = MENU_SECTIONS.map((section) => ({
    title: section.title,
    rows: section.rows.map((row) => ({
      title: row.title,
      description: row.run
        ? `Toque para usar (${prefix}${row.run.split(" ")[0]})`
        : `Toque para ver como usar (${prefix}${row.info})`,
      id: row.run ? `${prefix}${row.run}` : `${prefix}info ${row.info}`,
    })),
  }));

  return [
    listButton("📋 Escolher comando", sections),
    quickReply("🏓 Ping", `${prefix}ping`),
    quickReply("💱 Cotação", `${prefix}cotacao`),
  ];
}
