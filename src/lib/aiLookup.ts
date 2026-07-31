import { NUTRIENT_TARGETS, WATER_KEY } from '../data/nutrients';
import type { FoodItem, NutrientKey } from './types';

/**
 * Look up any food or drink by name and have Claude estimate its per-serving
 * nutrient values, so the user isn't limited to the bundled database.
 *
 * The request goes straight from the browser to the Anthropic API using a key the
 * user supplies in Settings. That means it needs real network access — it cannot
 * work inside a sandboxed embed that blocks external requests, and it needs the
 * direct-browser-access header for CORS.
 */

const API_URL = 'https://api.anthropic.com/v1/messages';
const MODEL = 'claude-opus-5';
const FALLBACK_BETA = 'server-side-fallback-2026-07-01';

/** Nutrients Claude is asked to estimate — water comes from the water tracker, not food. */
const LOOKUP_KEYS = NUTRIENT_TARGETS.filter((t) => t.key !== WATER_KEY);

export class AiLookupError extends Error {
  constructor(
    message: string,
    /** True when retrying might work (network blip, rate limit, overload). */
    readonly retryable = false,
  ) {
    super(message);
    this.name = 'AiLookupError';
  }
}

function nutrientSchema() {
  const properties: Record<string, { type: 'number'; description: string }> = {};
  for (const t of LOOKUP_KEYS) {
    properties[t.key] = {
      type: 'number',
      description: `${t.label} in ${t.unit} per serving. Use 0 if the food contains none.`,
    };
  }
  return {
    type: 'object',
    properties,
    required: LOOKUP_KEYS.map((t) => t.key),
    additionalProperties: false,
  };
}

const RESPONSE_SCHEMA = {
  type: 'object',
  properties: {
    name: { type: 'string', description: 'Short display name for the food or drink.' },
    emoji: { type: 'string', description: 'A single emoji that best represents it.' },
    servingLabel: {
      type: 'string',
      description: 'The serving these amounts describe, e.g. "1 cup (240 ml)" or "100 g".',
    },
    nutrients: nutrientSchema(),
    note: {
      type: 'string',
      description: 'One short sentence on what was assumed about the serving or preparation.',
    },
  },
  required: ['name', 'emoji', 'servingLabel', 'nutrients', 'note'],
  additionalProperties: false,
};

const SYSTEM_PROMPT = [
  'You estimate nutrition data for a personal food-tracking app used by a teenager.',
  'Given a food or drink, return your best per-serving estimate for every nutrient in the schema,',
  'each in the unit named in its description. Base it on standard reference data such as USDA',
  'FoodData Central. Pick a realistic everyday serving and say what you assumed in the note.',
  'Estimates are expected — never refuse because you lack exact figures. Use 0 for nutrients the',
  'food genuinely does not contain, and never return a negative number.',
].join(' ');

interface LookupResult {
  food: Omit<FoodItem, 'id'>;
  note: string;
}

interface AnthropicContentBlock {
  type: string;
  text?: string;
}

interface AnthropicResponse {
  content?: AnthropicContentBlock[];
  stop_reason?: string;
}

function buildBody(query: string, withFallbacks: boolean) {
  const body: Record<string, unknown> = {
    model: MODEL,
    max_tokens: 16000,
    system: SYSTEM_PROMPT,
    output_config: {
      effort: 'medium',
      format: { type: 'json_schema', schema: RESPONSE_SCHEMA },
    },
    messages: [{ role: 'user', content: `Estimate the nutrition for: ${query}` }],
  };
  // Claude Opus 5's safety classifiers can decline a request; a server-side fallback
  // retries it on another model in the same call instead of surfacing the refusal.
  if (withFallbacks) body.fallbacks = 'default';
  return body;
}

async function postLookup(query: string, apiKey: string, withFallbacks: boolean): Promise<Response> {
  const headers: Record<string, string> = {
    'content-type': 'application/json',
    'x-api-key': apiKey,
    'anthropic-version': '2023-06-01',
    // Required for browser-originated calls; the key is the user's own, stored on device.
    'anthropic-dangerous-direct-browser-access': 'true',
  };
  if (withFallbacks) headers['anthropic-beta'] = FALLBACK_BETA;

  return fetch(API_URL, {
    method: 'POST',
    headers,
    body: JSON.stringify(buildBody(query, withFallbacks)),
  });
}

function describeHttpError(status: number, raw: string): AiLookupError {
  if (status === 401) return new AiLookupError('That API key was rejected. Check it in Settings.');
  if (status === 403) return new AiLookupError("That API key doesn't have access to this model.");
  if (status === 429) return new AiLookupError('Rate limited — wait a moment and try again.', true);
  if (status >= 500) return new AiLookupError('Anthropic had a problem. Try again shortly.', true);

  let detail = '';
  try {
    detail = (JSON.parse(raw) as { error?: { message?: string } }).error?.message ?? '';
  } catch {
    detail = '';
  }
  return new AiLookupError(detail || `Lookup failed (HTTP ${status}).`);
}

export async function lookupFoodWithAi(query: string, apiKey: string): Promise<LookupResult> {
  if (!apiKey.trim()) {
    throw new AiLookupError('Add your Anthropic API key in Settings to use AI lookup.');
  }
  if (typeof navigator !== 'undefined' && navigator.onLine === false) {
    throw new AiLookupError("You're offline. AI lookup needs a connection.", true);
  }

  let response: Response;
  try {
    response = await postLookup(query, apiKey, true);
    // The fallback parameter is a beta; if this deployment doesn't accept it, retry plain
    // rather than losing the feature entirely.
    if (response.status === 400) {
      const retry = await postLookup(query, apiKey, false);
      if (retry.ok || retry.status !== 400) response = retry;
    }
  } catch {
    throw new AiLookupError(
      'Could not reach the Anthropic API. AI lookup needs network access, so it will not work in a sandboxed page.',
      true,
    );
  }

  if (!response.ok) throw describeHttpError(response.status, await response.text());

  const data = (await response.json()) as AnthropicResponse;

  if (data.stop_reason === 'refusal') {
    throw new AiLookupError('Claude declined that request. Try describing the food differently.');
  }
  if (data.stop_reason === 'max_tokens') {
    throw new AiLookupError('The reply was cut short. Try a simpler description.', true);
  }

  const text = data.content?.find((b) => b.type === 'text')?.text;
  if (!text) throw new AiLookupError('Got an empty response. Try again.', true);

  let parsed: {
    name?: string;
    emoji?: string;
    servingLabel?: string;
    note?: string;
    nutrients?: Record<string, unknown>;
  };
  try {
    parsed = JSON.parse(text);
  } catch {
    throw new AiLookupError("Couldn't read the nutrition data that came back. Try again.", true);
  }

  const nutrients: Partial<Record<NutrientKey, number>> = {};
  for (const t of LOOKUP_KEYS) {
    const value = Number(parsed.nutrients?.[t.key]);
    if (Number.isFinite(value) && value > 0) nutrients[t.key] = value;
  }

  return {
    food: {
      name: parsed.name?.trim() || query.trim(),
      emoji: parsed.emoji?.trim() || '🍽️',
      servingLabel: parsed.servingLabel?.trim() || '1 serving',
      nutrients,
      custom: true,
    },
    note: parsed.note?.trim() || '',
  };
}

/** Storage key for the user's API key — kept out of the main app data blob. */
export const API_KEY_STORAGE = 'growthtracker.apiKey';

export function loadApiKey(): string {
  if (typeof localStorage === 'undefined') return '';
  try {
    return localStorage.getItem(API_KEY_STORAGE) ?? '';
  } catch {
    return '';
  }
}

export function saveApiKey(key: string): void {
  if (typeof localStorage === 'undefined') return;
  try {
    if (key.trim()) localStorage.setItem(API_KEY_STORAGE, key.trim());
    else localStorage.removeItem(API_KEY_STORAGE);
  } catch {
    // Storage blocked — the key just won't persist past this session.
  }
}
