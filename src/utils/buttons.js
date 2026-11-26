/**
 * Botões interativos do WhatsApp.
 *
 * Quando alguém toca em um botão de "resposta rápida" ou escolhe um item
 * da lista, o WhatsApp devolve o `id` do botão e o bot trata esse id como se
 * a pessoa tivesse digitado. Por isso o id é sempre um comando, ex.: "/ping".
 *
 * Atenção: botões não aparecem no WhatsApp Business.
 */

/** Botão de resposta rápida que executa um comando. */
export function quickReply(displayText, command) {
  return {
    name: "quick_reply",
    buttonParamsJson: JSON.stringify({ display_text: displayText, id: command }),
  };
}

/** Botão que abre um link. */
export function urlButton(displayText, url) {
  return {
    name: "cta_url",
    buttonParamsJson: JSON.stringify({ display_text: displayText, url }),
  };
}

/** Botão que copia um texto. */
export function copyButton(displayText, code) {
  return {
    name: "cta_copy",
    buttonParamsJson: JSON.stringify({ display_text: displayText, copy_code: code }),
  };
}

/**
 * Botão que abre uma lista de opções.
 *
 * @param {string} title Texto do botão.
 * @param {{ title: string, rows: { title: string, description?: string, id: string }[] }[]} sections
 */
export function listButton(title, sections) {
  return {
    name: "single_select",
    buttonParamsJson: JSON.stringify({
      title,
      sections: sections.map((section) => ({
        title: section.title,
        rows: section.rows.map((row) => ({
          header: "",
          title: row.title,
          description: row.description || "",
          id: row.id,
        })),
      })),
    }),
  };
}

/**
 * Envia uma mensagem com botões (opcionalmente com imagem no topo).
 *
 * @param {object} params
 * @param {import("baileys").WASocket} params.socket
 * @param {string} params.remoteJid
 * @param {string} params.text
 * @param {string} [params.footer]
 * @param {object[]} params.buttons Botões criados com as funções acima.
 * @param {Buffer|{url: string}} [params.image]
 * @param {object} [params.quoted] Mensagem a ser respondida.
 * @param {string[]} [params.mentions]
 */
export async function sendButtons({
  socket,
  remoteJid,
  text,
  footer,
  buttons,
  image,
  quoted,
  mentions,
}) {
  const content = image
    ? { image, caption: text }
    : { text };

  return await socket.sendMessage(
    remoteJid,
    {
      ...content,
      ...(footer ? { footer } : {}),
      ...(mentions?.length ? { mentions } : {}),
      interactiveButtons: buttons,
    },
    quoted ? { quoted: JSON.parse(JSON.stringify(quoted)) } : {},
  );
}
