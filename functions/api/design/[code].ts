/** GET /api/design/:code → { ok, code, design, view, estimate, createdAt } (no personal data stored). */
import { normalizeCode } from '../../../src/lead/pipeline.ts';
import type { Env } from '../../_lib/env';
import { corsHeaders, corsOrigin, json } from '../../_lib/http';
import { loadDesign } from '../../_lib/store';

export const onRequestOptions: PagesFunction<Env> = async ({ request, env }) => {
  const origin = corsOrigin(request, env);
  return new Response(null, { status: origin === null ? 403 : 204, headers: corsHeaders(origin, 'GET, OPTIONS') });
};

export const onRequestGet: PagesFunction<Env, 'code'> = async ({ request, env, params }) => {
  const origin = corsOrigin(request, env);
  const cors = corsHeaders(origin, 'GET, OPTIONS');
  const code = normalizeCode(String(params.code ?? ''));
  if (!code) return json({ ok: false, error: 'Invalid code.' }, 400, cors);
  if (!env.DESIGNS) return json({ ok: false, error: 'Design storage is not configured.' }, 404, cors);
  const rec = await loadDesign(env.DESIGNS, code);
  if (!rec) return json({ ok: false, error: 'Design not found.' }, 404, cors);
  return json({ ok: true, code, ...rec }, 200, { ...cors, 'Cache-Control': 'public, max-age=300' });
};
