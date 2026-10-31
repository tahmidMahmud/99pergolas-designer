/**
 * GET /d/:code → 302 to /?<design params> (built with designToParams from src/config).
 * Link-preview crawlers (iMessage, Facebook, Slack, WhatsApp, …) instead get a tiny HTML page
 * with Open Graph tags and the stored snapshot, so shared links unfurl with a picture.
 * Falls back to "/" when KV is not bound or the code is unknown. Always noindex.
 */
import { designQuery, normalizeCode } from '../../src/lead/pipeline.ts';
import { designTitle, moneyRange } from '../../src/lead/format.ts';
import { escapeHtml } from '../../src/lead/email.ts';
import type { Env } from '../_lib/env';
import { baseUrl } from '../_lib/http';
import { loadDesign } from '../_lib/store';

const BOT_RE =
  /facebookexternalhit|facebot|twitterbot|slackbot|linkedinbot|whatsapp|telegrambot|discordbot|skypeuripreview|applebot|pinterest|redditbot|embedly|vkshare|googlebot|bingbot|iframely|outbrain|quora link preview|bitlybot|nuzzel|w3c_validator/i;

function redirect(location: string): Response {
  return new Response(null, {
    status: 302,
    headers: { Location: location, 'Cache-Control': 'no-store', 'X-Robots-Tag': 'noindex' },
  });
}

export const onRequestGet: PagesFunction<Env, 'code'> = async ({ request, env, params }) => {
  const code = normalizeCode(String(params.code ?? ''));
  if (!code) return redirect('/');
  const rec = await loadDesign(env.DESIGNS, code).catch(() => null);
  if (!rec) return redirect('/');

  const incoming = new URL(request.url).searchParams;
  const qs = new URLSearchParams(designQuery(rec.design, { ...rec.view, step: 'review' }));
  qs.set('code', code);
  for (const [k, v] of incoming) if (/^(utm_|gclid|fbclid|embed$)/.test(k)) qs.set(k, v);
  const target = `/?${qs.toString()}`;

  if (!BOT_RE.test(request.headers.get('User-Agent') ?? '')) return redirect(target);

  const base = baseUrl(request, env);
  const title = `${designTitle(rec.design)} | 99 Pergolas`;
  const desc = `Custom design, estimated ${moneyRange(rec.estimate.low, rec.estimate.high)} installed. Open it in 3D and make it yours.`;
  const img = rec.hasImage ? `${base}/og/${code}` : '';
  const html = `<!doctype html><html lang="en"><head><meta charset="utf-8">
<title>${escapeHtml(title)}</title>
<meta name="robots" content="noindex">
<meta name="description" content="${escapeHtml(desc)}">
<meta property="og:type" content="website">
<meta property="og:site_name" content="99 Pergolas">
<meta property="og:title" content="${escapeHtml(title)}">
<meta property="og:description" content="${escapeHtml(desc)}">
<meta property="og:url" content="${escapeHtml(`${base}/d/${code}`)}">
${img ? `<meta property="og:image" content="${escapeHtml(img)}">\n<meta name="twitter:card" content="summary_large_image">` : ''}
<meta http-equiv="refresh" content="0;url=${escapeHtml(target)}">
</head><body><a href="${escapeHtml(target)}">Open the design</a></body></html>`;
  return new Response(html, {
    headers: { 'Content-Type': 'text/html; charset=utf-8', 'X-Robots-Tag': 'noindex', 'Cache-Control': 'public, max-age=300' },
  });
};
