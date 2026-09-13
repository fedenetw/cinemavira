/** Mini-renderer di testo semplice in HTML (uso: layout Astro + campi Decap).
 *
 *  Il contenuto si scrive come TESTO PIANO, senza HTML. Sintassi minima
 *  supportata:
 *    - **grassetto**            → <strong>grassetto</strong>
 *    - [etichetta](https://…)   → <a target="_blank" rel="noopener noreferrer">
 *  I paragrafi si separano con una riga vuota → <p>…</p>.
 *  Tutto il resto viene escapato: nessun HTML grezzo arriva al rendering.
 */

function esc(s: string): string {
  return s
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;');
}

/** Testo di una riga (oppure più righe unite in una spaziatura singola). */
export function renderInlineText(raw: string): string {
  let out = esc(String(raw ?? '').replace(/\r\n?/g, '\n'));
  out = out.replace(/\n+/g, ' ');
  out = out.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
  out = out.replace(
    /\[([^\]]+)\]\((https?:\/\/[^)\s]+)\)/g,
    '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>',
  );
  return out;
}

/** Una o più righe separate da righe vuote → paragrafi <p>. */
export function renderTextBlocks(raw: string): string {
  return String(raw ?? '')
    .replace(/\r\n?/g, '\n')
    .split(/\n{2,}/)
    .map((b) => b.trim())
    .filter(Boolean)
    .map((b) => `<p>${renderInlineText(b)}</p>`)
    .join('');
}
