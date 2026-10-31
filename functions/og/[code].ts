/** GET /og/:code → the snapshot PNG/JPEG stored at submit time (used as og:image and in emails). */
import { normalizeCode } from '../../src/lead/pipeline.ts';
import type { Env } from '../_lib/env';

export const onRequestGet: PagesFunction<Env, 'code'> = async ({ env, params }) => {
  const code = normalizeCode(String(params.code ?? '').replace(/\.(png|jpe?g|webp)$/i, ''));
  if (!code || !env.DESIGNS) return new Response('Not found', { status: 404 });
  const { value, metadata } = await env.DESIGNS.getWithMetadata<{ type?: string }>(`img:${code}`, 'arrayBuffer');
  if (!value) return new Response('Not found', { status: 404 });
  return new Response(value, {
    headers: {
      'Content-Type': metadata?.type ?? 'image/png',
      'Cache-Control': 'public, max-age=86400, immutable',
      'X-Robots-Tag': 'noindex',
    },
  });
};
