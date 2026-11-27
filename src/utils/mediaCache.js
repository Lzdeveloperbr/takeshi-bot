/**
 * Cache de mídias já enviadas ao WhatsApp.
 *
 * Quando uma mídia é enviada a partir de um caminho ({ url: caminho }),
 * o Baileys guarda o upload aqui e reaproveita nos próximos envios,
 * sem subir o arquivo de novo (ex.: o banner do /menu e do /painel).
 */
import NodeCache from "node-cache";

export const mediaCache = new NodeCache({
  stdTTL: 60 * 60,
  checkperiod: 10 * 60,
  useClones: false,
});

/** Use quando um arquivo reaproveitado mudar (ex.: nova imagem do menu). */
export function clearMediaCache() {
  mediaCache.flushAll();
}
