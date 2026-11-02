import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const descriptions = {
  dashboard: {
    de: ['Heimkino von IPTV Schweiz 8K mit einem Skirennfahrer auf dem Hauptbildschirm, Filmplakaten und Blick auf See und Alpen.', 'IPTV Schweiz 8K: Sport und Film auf dem Fernseher'],
    fr: ['Salon IPTV Suisse 8K avec un skieur sur l’écran central, des affiches de films et une vue sur le lac et les Alpes.', 'IPTV Suisse 8K : sport et cinéma sur votre téléviseur']
  },
  sports: {
    de: ['Bildschirmwand von IPTV Schweiz 8K mit Skirennfahrer, Eishockey, Radsport und Fussball.', 'Live-Sport beim IPTV-Test in der Schweiz prüfen'],
    fr: ['Mur d’écrans IPTV Suisse 8K avec ski alpin, hockey sur glace, cyclisme et football.', 'Tester un direct sportif sur IPTV en Suisse']
  },
  cinema: {
    de: ['Fiktive Filmplakate für Thriller, Drama, Science-Fiction und Familienkomödie in einem Heimkino von IPTV Schweiz 8K.', 'Filme und Tonspuren beim IPTV-Test vergleichen'],
    fr: ['Affiches fictives de thriller, drame, science-fiction et comédie familiale dans un salon cinéma IPTV Suisse 8K.', 'Comparer les pistes audio d’un film avec IPTV Suisse']
  }
};

function dimensions(filename) {
  const bytes = readFileSync(filename);
  const codec = bytes.toString('ascii', 12, 16);
  if (codec === 'VP8X') return [bytes.readUIntLE(24, 3) + 1, bytes.readUIntLE(27, 3) + 1];
  if (codec === 'VP8 ') return [bytes.readUInt16LE(26) & 0x3fff, bytes.readUInt16LE(28) & 0x3fff];
  if (codec === 'VP8L') {
    const bits = bytes.readUInt32LE(21);
    return [(bits & 0x3fff) + 1, ((bits >>> 14) & 0x3fff) + 1];
  }
  throw new Error('Expected a WebP image: ' + filename);
}

export function artwork(type, lang, publicDir) {
  const filename = '/images/iptv-schweiz-8k-' + type + '.webp';
  const [width, height] = dimensions(resolve(publicDir, '.' + filename));
  const [alt, title] = descriptions[type][lang];
  const small = '/images/iptv-schweiz-8k-dashboard-800.webp';
  return {
    src: filename, width, height,
    small: type === 'dashboard' && existsSync(resolve(publicDir, '.' + small)) ? small : '',
    alt, title
  };
}
