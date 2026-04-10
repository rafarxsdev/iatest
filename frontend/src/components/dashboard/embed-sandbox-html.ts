/**
 * Tamaño del iframe del agente (px). Ajusta aquí el “lienzo” del widget; en Dashboard.tsx el iframe usa estos mismos valores.
 */
export const MODAL_IFRAME_WIDTH_PX = 375;
export const MODAL_IFRAME_HEIGHT_PX = 600;

/**
 * Documento mínimo para srcDoc: un documento por iframe (sin colisiones de ids / window).
 * Dimensiones fijas = tamaño real del widget; overflow hidden evita franjas vacías por scroll del body.
 */
export function buildEmbedSandboxDocument(htmlFragment: string, widthPx: number, heightPx: number): string {
  const w = String(widthPx);
  const h = String(heightPx);
  return `<!DOCTYPE html><html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=${w},initial-scale=1"><style>
html{height:100%;margin:0;padding:0;box-sizing:border-box;overflow:hidden;}
body{margin:0;padding:0;box-sizing:border-box;width:${w}px;height:${h}px;overflow:hidden;display:block;position:relative;line-height:0;}
</style></head><body>${htmlFragment}</body></html>`;
}

/**
 * Si `html_content` es solo una URL https (sin más HTML), el iframe debe usar `src`, no `srcDoc`.
 * Así el documento es del mismo origen que el host remoto y los `type="module"` no chocan con CORS.
 */
const FULL_PAGE_EMBED_URL = /^\s*(https?:\/\/[^\s<>'"]+)\s*$/i;
const WRAPPED_P_URL = /^\s*<p>\s*(https?:\/\/[^<\s]+)\s*<\/p>\s*$/i;

function normalizeToHttpUrl(raw: string): string | null {
  try {
    const u = new URL(raw);
    if (u.protocol !== 'http:' && u.protocol !== 'https:') {
      return null;
    }
    return u.href;
  } catch {
    return null;
  }
}

export function tryParseFullPageEmbedUrl(htmlFragment: string): string | null {
  const t = htmlFragment.trim();
  const plain = FULL_PAGE_EMBED_URL.exec(t);
  if (plain) {
    return normalizeToHttpUrl(plain[1]);
  }
  const wrapped = WRAPPED_P_URL.exec(t);
  if (wrapped) {
    return normalizeToHttpUrl(wrapped[1]);
  }
  return null;
}
