import { PREFIX } from "../../../config.js";
import { InvalidParameterError } from "../../../errors/index.js";
import { getBook } from "../../../services/brasil-api.js";

export default {
  name: "isbn",
  description: "Consulta um livro pelo ISBN.",
  commands: ["isbn", "livro"],
  usage: `${PREFIX}isbn 9788545702870`,
  /**
   * @param {CommandHandleProps} props
   */
  handle: async ({ args, sendReply, sendImageFromURL, sendWaitReact, sendSuccessReact }) => {
    const isbn = String(args[0] || "").replace(/[^0-9Xx]/g, "");

    if (![10, 13].includes(isbn.length)) {
      throw new InvalidParameterError(`Envie um ISBN com 10 ou 13 dígitos! Exemplo: ${PREFIX}isbn 9788545702870`);
    }

    await sendWaitReact();
    const book = await getBook(isbn);

    const synopsis = (book.synopsis || "").trim();
    const text = [
      `📚 *${book.title}*${book.subtitle ? ` — ${book.subtitle}` : ""}`,
      book.authors?.length && `✍️ Autor(es): ${book.authors.join(", ")}`,
      book.publisher && `🏢 Editora: ${book.publisher}`,
      book.year && `📅 Ano: ${book.year}`,
      book.page_count && `📄 Páginas: ${book.page_count}`,
      synopsis && `\n📝 ${synopsis.length > 600 ? `${synopsis.slice(0, 600)}...` : synopsis}`,
    ]
      .filter(Boolean)
      .join("\n");

    await sendSuccessReact();

    if (book.cover_url) {
      await sendImageFromURL(book.cover_url, text);
    } else {
      await sendReply(text);
    }
  },
};
