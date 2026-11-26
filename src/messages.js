/**
 * Utilize este arquivo para definir as mensagens de boas-vindas e despedidas do grupo.
 * As mensagens podem conter a menção ao membro que entrou ou saiu do grupo.
 * Você pode personalizar as mensagens conforme necessário.
 *
 * Para colocar a menção ao membro, use "@member" na mensagem.
 * Para colocar o nome do grupo, use "@group".
 * Para colocar a quantidade de membros, use "@count".
 * Para colocar o prefixo do bot no grupo, use "@prefix".
 *
 * @author Dev Gui
 */
export const welcomeMessage =
  "Seja bem-vindo(a) ao *@group*, @member! 🎉\nAgora somos @count membros. Leia as regras com @prefixregras.";
export const exitMessage =
  "Poxa, @member saiu do grupo... Sentiremos sua falta!";

export function clearChat() {
  return `🗑️${"\n".repeat(1891)}🗑️`;
}
