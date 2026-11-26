import { PREFIX } from "../../../config.js";
import { InvalidParameterError } from "../../../errors/index.js";
import { brl, formatDate, getCnpj, onlyDigits } from "../../../services/brasil-api.js";

function formatCnpj(cnpj) {
  return cnpj.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/, "$1.$2.$3/$4-$5");
}

function formatPhone(value) {
  const digits = onlyDigits(value);
  if (digits.length < 10) return null;
  return `(${digits.slice(0, 2)}) ${digits.slice(2, -4)}-${digits.slice(-4)}`;
}

export default {
  name: "cnpj",
  description: "Consulta dados públicos de uma empresa pelo CNPJ (Receita Federal).",
  commands: ["cnpj", "empresa"],
  usage: `${PREFIX}cnpj 00.000.000/0001-91`,
  /**
   * @param {CommandHandleProps} props
   */
  handle: async ({ fullArgs, sendReply, sendWaitReact, sendSuccessReact }) => {
    const cnpj = onlyDigits(fullArgs);

    if (cnpj.length !== 14) {
      throw new InvalidParameterError(`Envie um CNPJ válido! Exemplo: ${PREFIX}cnpj 00.000.000/0001-91`);
    }

    await sendWaitReact();
    const data = await getCnpj(cnpj);

    const address = [
      [data.descricao_tipo_de_logradouro, data.logradouro].filter(Boolean).join(" "),
      data.numero,
      data.complemento,
      data.bairro,
      data.municipio && `${data.municipio}/${data.uf}`,
    ]
      .filter((part) => part && String(part).trim())
      .join(", ");

    const phone = formatPhone(data.ddd_telefone_1);

    const lines = [
      `🏢 *${data.razao_social}*`,
      data.nome_fantasia && `🏷️ Nome fantasia: ${data.nome_fantasia}`,
      `🆔 CNPJ: ${formatCnpj(cnpj)}`,
      `📌 Situação: *${data.descricao_situacao_cadastral || "-"}*`,
      `📅 Abertura: ${formatDate(data.data_inicio_atividade)}`,
      data.porte && `📏 Porte: ${data.porte}`,
      data.natureza_juridica && `⚖️ Natureza: ${data.natureza_juridica}`,
      data.cnae_fiscal_descricao && `💼 Atividade: ${data.cnae_fiscal_descricao}`,
      data.capital_social != null && `💰 Capital social: ${brl(data.capital_social)}`,
      address && `📍 Endereço: ${address}`,
      data.cep && `📮 CEP: ${data.cep}`,
      phone && `☎️ Telefone comercial: ${phone}`,
      Array.isArray(data.qsa) && `👥 Sócios: ${data.qsa.length}`,
    ].filter(Boolean);

    await sendSuccessReact();
    await sendReply(`${lines.join("\n")}\n\n_Fonte: Receita Federal (dados públicos)._`);
  },
};
