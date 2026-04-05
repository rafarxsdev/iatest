import type { CatalogIcon } from './icons-catalog';

export type { CatalogIcon };

const FEATURED_NAMES = [
  'analytics',
  'dashboard',
  'trending_up',
  'insights',
  'bar_chart',
  'settings_suggest',
  'hub',
  'rocket_launch',
  'lightbulb',
  'psychology',
  'groups',
  'handshake',
  'eco',
  'shield',
  'flag',
  'article',
  'play_circle',
  'quiz',
  'assignment',
  'web_asset',
  'notifications',
  'campaign',
  'forum',
  'share',
  'email',
  'code',
  'cloud',
  'api',
  'memory',
  'smart_toy',
] as const;

export interface IconsBundle {
  catalog: CatalogIcon[];
  categories: string[];
  featured: CatalogIcon[];
}

let bundlePromise: Promise<IconsBundle> | null = null;

/**
 * Carga perezosa del catálogo (~miles de íconos) para no bloquear Vite ni el bundle principal.
 */
export function loadIconsBundle(): Promise<IconsBundle> {
  if (!bundlePromise) {
    bundlePromise = import('./icons-catalog').then((m) => {
      const featured = FEATURED_NAMES.map((name) => m.ICONS_CATALOG.find((i) => i.name === name)).filter(
        (i): i is CatalogIcon => i !== undefined,
      );
      return {
        catalog: m.ICONS_CATALOG,
        categories: m.ICON_CATEGORIES,
        featured,
      };
    });
  }
  return bundlePromise;
}

const CATEGORY_LABELS: Record<string, string> = {
  action: 'Acciones',
  alert: 'Alertas',
  av: 'Audio y Video',
  communication: 'Comunicación',
  content: 'Contenido',
  device: 'Dispositivos',
  editor: 'Editor',
  file: 'Archivos',
  hardware: 'Hardware',
  home: 'Hogar',
  image: 'Imágenes',
  maps: 'Mapas',
  navigation: 'Navegación',
  notification: 'Notificaciones',
  places: 'Lugares',
  search: 'Búsqueda',
  social: 'Social',
  toggle: 'Toggles',
  transportation: 'Transporte',
  travel: 'Viajes',
  weather: 'Clima',
  other: 'Otros',
};

export function getCategoryLabel(code: string): string {
  return CATEGORY_LABELS[code] ?? code.charAt(0).toUpperCase() + code.slice(1);
}

export function getIconsByCategory(catalog: CatalogIcon[], category: string): CatalogIcon[] {
  return catalog.filter((i) => i.category === category);
}

export function searchIcons(catalog: CatalogIcon[], query: string, limit = 80): CatalogIcon[] {
  const q = query.toLowerCase().trim();
  if (!q) return [];

  const exact: CatalogIcon[] = [];
  const prefix: CatalogIcon[] = [];
  const tagHit: CatalogIcon[] = [];
  const partial: CatalogIcon[] = [];

  for (const icon of catalog) {
    const nameLower = icon.name.toLowerCase();
    const labelLower = icon.label.toLowerCase();
    const tagsText = icon.tags.join(' ').toLowerCase();

    if (nameLower === q) {
      exact.push(icon);
    } else if (nameLower.startsWith(q)) {
      prefix.push(icon);
    } else if (tagsText.includes(q)) {
      tagHit.push(icon);
    } else if (nameLower.includes(q) || labelLower.includes(q)) {
      partial.push(icon);
    }
  }

  return [...exact, ...prefix, ...tagHit, ...partial].slice(0, limit);
}
