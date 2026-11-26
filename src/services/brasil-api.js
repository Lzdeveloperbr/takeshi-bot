/**
 * BrasilAPI: dados PÚBLICOS do Brasil, grátis e sem cadastro.
 * https://brasilapi.com.br
 *
 * Apenas dados públicos (empresas, bancos, DDD, feriados, livros,
 * domínios, taxas). Este bot não consulta dados pessoais de pessoas.
 */
import axios from "axios";
import { WarningError } from "../errors/index.js";

const api = axios.create({
  baseURL: "https://brasilapi.com.br/api",
  timeout: 20_000,
  headers: { "User-Agent": "WhatsAppBot/1.0" },
});

async function get(path, notFoundMessage) {
  try {
    const { data } = await api.get(path);
    return data;
  } catch (error) {
    const status = error.response?.status;

    if (status === 404 || status === 400) {
      throw new WarningError(notFoundMessage);
    }

    if (status === 429) {
      throw new WarningError("Muitas consultas seguidas. Tente de novo em alguns segundos.");
    }

    throw new WarningError("O serviço de consultas está fora do ar agora. Tente novamente mais tarde.");
  }
}

export const onlyDigits = (value) => String(value || "").replace(/\D/g, "");

export function getCnpj(cnpj) {
  return get(`/cnpj/v1/${onlyDigits(cnpj)}`, "CNPJ não encontrado!");
}

export function getDdd(ddd) {
  return get(`/ddd/v1/${onlyDigits(ddd)}`, "DDD não encontrado!");
}

export function getBank(code) {
  return get(`/banks/v1/${onlyDigits(code)}`, "Banco não encontrado!");
}

export function getHolidays(year) {
  return get(`/feriados/v1/${year}`, "Não encontrei feriados para esse ano.");
}

export function getBook(isbn) {
  return get(`/isbn/v1/${String(isbn).replace(/[^0-9Xx]/g, "")}`, "Livro não encontrado!");
}

export function getBrDomain(domain) {
  return get(`/registrobr/v1/${encodeURIComponent(domain)}`, "Domínio inválido!");
}

export function getRates() {
  return get("/taxas/v1", "Não encontrei as taxas.");
}

export function getCep(cep) {
  return get(`/cep/v2/${onlyDigits(cep)}`, "CEP não encontrado!");
}

export const brl = (value) =>
  Number(value || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

/** "2024-03-15" -> "15/03/2024" sem problemas de fuso horário. */
export function formatDate(isoDate) {
  const [year, month, day] = String(isoDate || "").slice(0, 10).split("-");
  return year && month && day ? `${day}/${month}/${year}` : "-";
}
