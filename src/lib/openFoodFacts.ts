import { NUTRIENTS_BY_KEY } from '../data/nutrients';
import type { FoodItem, NutrientKey } from './types';

/**
 * Open Food Facts lookup — a free, open database of packaged foods covering millions
 * of products worldwide, searchable by name or barcode.
 *
 * The API is public, CORS-enabled and needs no key, so the browser can call it directly.
 * It does need network access, so it won't work in a sandboxed page that blocks
 * external requests.
 *
 * Docs: https://openfoodfacts.github.io/openfoodfacts-server/api/
 */

const BASE = 'https://world.openfoodfacts.org';
const PRODUCT_FIELDS =
  'code,product_name,generic_name,brands,quantity,serving_size,serving_quantity,nutriments';
const SEARCH_LIMIT = 20;
const REQUEST_TIMEOUT_MS = 12000;

/**
 * Our nutrient keys mapped to Open Food Facts nutriment names.
 *
 * Open Food Facts stores every `*_100g` / `*_serving` figure normalised to GRAMS,
 * regardless of the unit a contributor typed in (the `*_unit` field describes the
 * raw entered `*_value`, not the normalised one). So each value is converted from
 * grams into the unit this app displays. If imported numbers ever come back off by a
 * factor of 1000, this table and `fromGrams` below are the only places to look.
 */
const OFF_KEYS: Record<NutrientKey, string> = {
  protein: 'proteins',
  omega3: 'omega-3-fat',
  calcium: 'calcium',
  iron: 'iron',
  magnesium: 'magnesium',
  zinc: 'zinc',
  vitaminD: 'vitamin-d',
  vitaminA: 'vitamin-a',
  vitaminC: 'vitamin-c',
  vitaminE: 'vitamin-e',
  vitaminK: 'vitamin-k',
  thiamine: 'vitamin-b1',
  riboflavin: 'vitamin-b2',
  niacin: 'vitamin-pp',
  pantothenicAcid: 'pantothenic-acid',
  vitaminB6: 'vitamin-b6',
  biotin: 'biotin',
  folate: 'vitamin-b9',
  vitaminB12: 'vitamin-b12',
  choline: 'choline',
  iodine: 'iodine',
  selenium: 'selenium',
  copper: 'copper',
  manganese: 'manganese',
  potassium: 'potassium',
  phosphorus: 'phosphorus',
  chromium: 'chromium',
  molybdenum: 'molybdenum',
};

/** Convert a gram value into the unit a nutrient is displayed in. */
function fromGrams(grams: number, unit: string): number {
  switch (unit) {
    case 'g':
      return grams;
    case 'mg':
      return grams * 1000;
    case 'mcg':
      return grams * 1_000_000;
    default:
      return grams;
  }
}

export class OpenFoodFactsError extends Error {
  constructor(
    message: string,
    readonly retryable = false,
  ) {
    super(message);
    this.name = 'OpenFoodFactsError';
  }
}

interface OffProduct {
  code?: string;
  product_name?: string;
  generic_name?: string;
  brands?: string;
  quantity?: string;
  serving_size?: string;
  serving_quantity?: number | string;
  nutriments?: Record<string, unknown>;
}

export interface OffFood {
  /** Ready to save as a custom food. */
  food: Omit<FoodItem, 'id'>;
  barcode: string;
  brand: string;
  /** True when values are per 100 g because the product lists no serving size. */
  per100g: boolean;
  /**
   * Nutrients whose imported value looks implausibly large for one serving.
   * Surfaced in the UI so a bad source figure or unit is caught before saving.
   */
  suspicious: NutrientKey[];
}

async function getJson(url: string): Promise<unknown> {
  if (typeof navigator !== 'undefined' && navigator.onLine === false) {
    throw new OpenFoodFactsError("You're offline. Open Food Facts needs a connection.", true);
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  let response: Response;
  try {
    response = await fetch(url, {
      signal: controller.signal,
      headers: { accept: 'application/json' },
    });
  } catch {
    throw new OpenFoodFactsError(
      'Could not reach Open Food Facts. It needs network access, so it will not work in a sandboxed page.',
      true,
    );
  } finally {
    clearTimeout(timer);
  }

  if (response.status === 429) {
    throw new OpenFoodFactsError('Open Food Facts is rate limiting. Wait a moment.', true);
  }
  if (!response.ok) {
    throw new OpenFoodFactsError(`Open Food Facts returned HTTP ${response.status}.`, response.status >= 500);
  }
  try {
    return await response.json();
  } catch {
    throw new OpenFoodFactsError('Open Food Facts sent a response we could not read.', true);
  }
}

function toNumber(value: unknown): number {
  const n = typeof value === 'string' ? Number(value) : (value as number);
  return Number.isFinite(n) ? n : 0;
}

function displayName(p: OffProduct): string {
  return (p.product_name || p.generic_name || '').trim();
}

/** Turn an Open Food Facts product into a food this app can log. */
export function mapProduct(p: OffProduct): OffFood | null {
  const name = displayName(p);
  if (!name) return null;

  const nutriments = p.nutriments ?? {};
  const servingGrams = toNumber(p.serving_quantity);
  const usePerServing = servingGrams > 0;

  const nutrients: Partial<Record<NutrientKey, number>> = {};
  const suspicious: NutrientKey[] = [];

  for (const [key, offKey] of Object.entries(OFF_KEYS)) {
    const target = NUTRIENTS_BY_KEY[key];
    if (!target) continue;

    // Prefer the per-serving figure the product supplies; otherwise scale the per-100 g one.
    let grams = 0;
    if (usePerServing) {
      const perServing = nutriments[`${offKey}_serving`];
      grams =
        perServing !== undefined
          ? toNumber(perServing)
          : (toNumber(nutriments[`${offKey}_100g`]) * servingGrams) / 100;
    } else {
      grams = toNumber(nutriments[`${offKey}_100g`]);
    }

    if (!(grams > 0)) continue;
    const value = fromGrams(grams, target.unit);
    if (!(value > 0)) continue;

    nutrients[key] = value;
    // One serving of anything legitimately clearing 50x a daily target means the
    // source figure (or its unit) is almost certainly wrong.
    if (target.dailyTarget > 0 && value > target.dailyTarget * 50) suspicious.push(key);
  }

  if (Object.keys(nutrients).length === 0) return null;

  const brand = (p.brands ?? '').split(',')[0]?.trim() ?? '';
  const servingLabel = usePerServing
    ? (p.serving_size || '').trim() || `${servingGrams} g`
    : '100 g';

  return {
    food: {
      name: brand && !name.toLowerCase().includes(brand.toLowerCase()) ? `${name} (${brand})` : name,
      emoji: '🛒',
      servingLabel,
      nutrients,
      custom: true,
    },
    barcode: (p.code ?? '').trim(),
    brand,
    per100g: !usePerServing,
    suspicious,
  };
}

/** Look up a single product by its barcode (EAN/UPC digits). */
export async function lookupBarcode(barcode: string): Promise<OffFood> {
  const code = barcode.replace(/\D/g, '');
  if (code.length < 6) throw new OpenFoodFactsError('That barcode looks too short.');

  const data = (await getJson(
    `${BASE}/api/v2/product/${encodeURIComponent(code)}.json?fields=${PRODUCT_FIELDS}`,
  )) as { status?: number; product?: OffProduct };

  if (data.status !== 1 || !data.product) {
    throw new OpenFoodFactsError(
      `No product found for ${code}. It may not be in Open Food Facts yet — you can add it there, or use AI lookup.`,
    );
  }

  const mapped = mapProduct(data.product);
  if (!mapped) {
    throw new OpenFoodFactsError(
      'That product is in Open Food Facts but has no nutrition data filled in yet.',
    );
  }
  return mapped;
}

/** Free-text search across Open Food Facts. */
export async function searchOpenFoodFacts(query: string): Promise<OffFood[]> {
  const q = query.trim();
  if (!q) return [];

  const url =
    `${BASE}/cgi/search.pl?search_terms=${encodeURIComponent(q)}` +
    `&search_simple=1&action=process&json=1&page_size=${SEARCH_LIMIT}&fields=${PRODUCT_FIELDS}`;

  const data = (await getJson(url)) as { products?: OffProduct[] };
  const products = Array.isArray(data.products) ? data.products : [];

  const seen = new Set<string>();
  const out: OffFood[] = [];
  for (const p of products) {
    const mapped = mapProduct(p);
    if (!mapped) continue;
    const dedupeKey = mapped.barcode || mapped.food.name.toLowerCase();
    if (seen.has(dedupeKey)) continue;
    seen.add(dedupeKey);
    out.push(mapped);
  }
  return out;
}
