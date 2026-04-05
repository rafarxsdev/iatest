import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const METADATA_URL = 'https://fonts.google.com/metadata/icons?incomplete=1';
const OUTPUT_PATH = path.resolve(__dirname, '../src/lib/icons-catalog.ts');

interface RawIcon {
  name: string;
  categories: string[];
  tags: string[];
  unsupported_families?: string[];
}

interface CatalogIcon {
  name: string;
  label: string;
  category: string;
  tags: string[];
}

async function fetchIcons(): Promise<void> {
  console.log('Descargando catálogo de Material Symbols...');
  const res = await fetch(METADATA_URL);
  if (!res.ok) {
    throw new Error(`HTTP ${res.status}: ${res.statusText}`);
  }
  const text = await res.text();

  const cleaned = text.replace(/^\)\]\}'\s*/, '');
  const json = JSON.parse(cleaned) as { icons: RawIcon[] };
  const raw: RawIcon[] = json.icons;

  console.log(`Total de íconos recibidos: ${raw.length}`);

  const icons: CatalogIcon[] = raw
    .filter((i) => !i.unsupported_families?.includes('Material Symbols Outlined'))
    .map((i) => ({
      name: i.name,
      label: i.name
        .split('_')
        .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
        .join(' '),
      category: i.categories?.[0] ?? 'other',
      tags: i.tags ?? [],
    }));

  const categories = [...new Set(icons.map((i) => i.category))].sort();

  const output = `// ARCHIVO GENERADO AUTOMÁTICAMENTE
// Fuente: https://fonts.google.com/metadata/icons
// Total: ${icons.length} íconos · Categorías: ${categories.length}
// Regenerar con: npm run fetch:icons

export interface CatalogIcon {
  name:     string
  label:    string
  category: string
  tags:     string[]
}

export const ICONS_CATALOG: CatalogIcon[] = ${JSON.stringify(icons, null, 2)}

export const ICON_CATEGORIES: string[] = ${JSON.stringify(categories, null, 2)}
`;
  fs.writeFileSync(OUTPUT_PATH, output, 'utf-8');
  console.log(`✅ Catálogo generado en: ${OUTPUT_PATH}`);
  console.log(`   ${icons.length} íconos · ${categories.length} categorías`);
}

fetchIcons().catch((err: unknown) => {
  console.error('❌ Error al descargar catálogo:', err);
  process.exit(1);
});
