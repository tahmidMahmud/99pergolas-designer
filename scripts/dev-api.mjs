#!/usr/bin/env node
/**
 * Local stand-in for the Cloudflare Pages Functions, so the designer works with `npm run dev`.
 *
 *   npm run dev:api        # http://localhost:8787 (Vite proxies /api, /d/, /og/ here)
 *
 * POST /api/lead        same validation + server estimate as production (shared TS modules),
 *                       logs a summary, writes .leads/<timestamp>-<code>.json (+ .png snapshot,
 *                       .pdf, and sales/customer email previews as .html). No email is sent.
 * GET  /d/:code         302 → /?<design params>&code=… (read back from .leads)
 * GET  /api/design/:code  stored design JSON
 * GET  /og/:code        stored snapshot image
 *
 * Env: PORT (8787), DEV_PUBLIC_BASE (share-link origin; default = request Origin or http://localhost:5173)
 *
 * The shared modules are TypeScript; Node runs them with --experimental-strip-types (this script
 * re-launches itself with the flag when needed) plus a tiny resolver for extensionless imports.
 */
import { spawn } from 'node:child_process';
import { register } from 'node:module';
import http from 'node:http';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

if (!process.features?.typescript && !process.execArgv.includes('--experimental-strip-types')) {
  const child = spawn(process.execPath, ['--experimental-strip-types', '--no-warnings', ...process.execArgv, ...process.argv.slice(1)], {
    stdio: 'inherit',
  });
  child.on('exit', (code) => process.exit(code ?? 0));
  for (const sig of ['SIGINT', 'SIGTERM']) process.on(sig, () => child.kill(sig));
} else {
  await main();
}

async function main() {
  // Resolve `./catalog` → `./catalog.ts` (src/config uses bundler-style extensionless imports).
  register(
    'data:text/javascript,' +
      encodeURIComponent(`
export async function resolve(spec, ctx, next) {
  try { return await next(spec, ctx); } catch (e) {
    if (/^\\.{1,2}\\//.test(spec) && !/\\.[cm]?[jt]sx?$/.test(spec)) {
      for (const ext of ['.ts', '/index.ts']) { try { return await next(spec + ext, ctx); } catch {} }
    }
    throw e;
  }
}`),
  );

  const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
  const LEADS = path.join(ROOT, '.leads');
  const PORT = Number(process.env.PORT) || 8787;
  const lib = (p) => import(path.join(ROOT, p));

  const { validateLead } = await lib('src/lead/validate.ts');
  const { prepareLead, newCode, normalizeCode, designQuery } = await lib('src/lead/pipeline.ts');
  const email = await lib('src/lead/email.ts');
  const { moneyRange, designTitle } = await lib('src/lead/format.ts');

  await fs.mkdir(LEADS, { recursive: true });

  const hits = new Map(); // ip -> { n, t }
  const limited = (ip) => {
    const now = Date.now();
    const r = hits.get(ip);
    if (!r || now - r.t > 600_000) {
      hits.set(ip, { n: 1, t: now });
      return false;
    }
    r.n++;
    return r.n > (Number(process.env.RATE_LIMIT) || 5);
  };

  const cors = (req) => ({
    'Access-Control-Allow-Origin': req.headers.origin || '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Accept',
    Vary: 'Origin',
  });
  const send = (req, res, status, data, headers = {}) => {
    res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8', ...cors(req), ...headers });
    res.end(JSON.stringify(data));
  };
  const readBody = (req) =>
    new Promise((resolve, reject) => {
      let size = 0;
      const chunks = [];
      req.on('data', (c) => {
        size += c.length;
        if (size > 10 * 1024 * 1024) {
          reject(Object.assign(new Error('too large'), { status: 413 }));
          req.destroy();
        } else chunks.push(c);
      });
      req.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')));
      req.on('error', reject);
    });

  async function findLead(code) {
    const files = (await fs.readdir(LEADS)).filter((f) => f.endsWith(`-${code}.json`));
    if (!files.length) return null;
    const file = path.join(LEADS, files.sort().at(-1));
    return { file, rec: JSON.parse(await fs.readFile(file, 'utf8')) };
  }

  const server = http.createServer(async (req, res) => {
    const url = new URL(req.url ?? '/', `http://${req.headers.host ?? 'localhost'}`);
    try {
      if (req.method === 'OPTIONS') {
        res.writeHead(204, cors(req));
        return res.end();
      }

      if (req.method === 'POST' && url.pathname === '/api/lead') {
        let body;
        try {
          body = JSON.parse(await readBody(req));
        } catch (e) {
          return send(req, res, e.status ?? 400, { ok: false, error: e.status ? 'Request too large.' : 'Invalid JSON.' });
        }
        const v = validateLead(body);
        if (!v.ok) {
          console.log('\n✗ lead rejected', v.errors);
          return send(req, res, 422, { ok: false, error: 'Please check the highlighted fields.', errors: v.errors });
        }
        const base = (process.env.DEV_PUBLIC_BASE || req.headers.origin || 'http://localhost:5173').replace(/\/+$/, '');
        if (v.honeypot) {
          console.log('\n• honeypot hit — pretending success');
          return send(req, res, 200, { ok: true, id: newCode(), shareUrl: `${base}/` });
        }
        const ip = req.socket.remoteAddress ?? 'local';
        if (limited(ip)) return send(req, res, 429, { ok: false, error: 'Too many requests. Please try again in a few minutes.' });

        const p = v.payload;
        const prepared = prepareLead(p, base);
        const id = newCode();
        const createdAt = new Date().toISOString();
        const stem = `${createdAt.replace(/[:.]/g, '-')}-${id}`;
        const shareUrl = `${base}/d/${id}`;
        const lead = { ...p, design: prepared.design, estimate: prepared.estimate, shareUrl };

        let snapshotFile;
        const snap = p.snapshot && /^data:image\/(png|jpeg|webp);base64,(.+)$/.exec(p.snapshot);
        if (snap) {
          snapshotFile = `${stem}.${snap[1] === 'jpeg' ? 'jpg' : snap[1]}`;
          await fs.writeFile(path.join(LEADS, snapshotFile), Buffer.from(snap[2], 'base64'));
        }
        if (typeof body.pdf === 'string' && body.pdf.startsWith('JVBER')) {
          await fs.writeFile(path.join(LEADS, `${stem}.pdf`), Buffer.from(body.pdf, 'base64'));
        }
        const { snapshot: _s, ...rest } = lead;
        await fs.writeFile(
          path.join(LEADS, `${stem}.json`),
          JSON.stringify(
            {
              id,
              createdAt,
              ...rest,
              longUrl: prepared.longUrl,
              snapshotFile,
              priceNote: prepared.priceNote,
              clientEstimate: { low: p.estimate.low, high: p.estimate.high },
              cf7: prepared.cf7,
            },
            null,
            2,
          ),
        );
        const ctx = {
          id,
          shareUrl,
          estimate: prepared.estimate,
          priceNote: prepared.priceNote,
          snapshotUrl: snapshotFile,
          receivedAt: createdAt,
          cf7: prepared.cf7,
        };
        await fs.writeFile(path.join(LEADS, `${stem}.sales.html`), email.salesEmailHtml(lead, ctx));
        await fs.writeFile(path.join(LEADS, `${stem}.customer.html`), email.customerEmailHtml(lead, ctx));

        console.log(
          `\n✓ lead ${id}  ${lead.site.name} <${lead.site.email}> ${lead.site.phone}\n` +
            `  ${designTitle(lead.design)} — ${moneyRange(prepared.estimate.low, prepared.estimate.high)}` +
            (prepared.priceNote ? `\n  ! ${prepared.priceNote}` : '') +
            `\n  subject: ${email.salesSubject(lead)}` +
            `\n  share:   ${shareUrl}\n  files:   .leads/${stem}.{json,sales.html,customer.html${snapshotFile ? ',' + snapshotFile.split('.').pop() : ''}${body.pdf ? ',pdf' : ''}}`,
        );
        return send(req, res, 200, { ok: true, id, shareUrl });
      }

      const m = /^\/(d|api\/design|og)\/([^/]+?)(?:\.(?:png|jpe?g|webp))?\/?$/.exec(url.pathname);
      if (req.method === 'GET' && m) {
        const code = normalizeCode(m[2]);
        const found = code ? await findLead(code) : null;
        if (m[1] === 'd') {
          const loc = found ? `/?${designQuery(found.rec.design, { ...found.rec.view, step: 'review' })}&code=${code}` : '/';
          res.writeHead(302, { Location: loc, 'Cache-Control': 'no-store' });
          return res.end();
        }
        if (!found) return send(req, res, 404, { ok: false, error: 'Design not found.' });
        if (m[1] === 'og') {
          if (!found.rec.snapshotFile) return send(req, res, 404, { ok: false, error: 'No snapshot.' });
          const buf = await fs.readFile(path.join(LEADS, found.rec.snapshotFile));
          res.writeHead(200, { 'Content-Type': `image/${found.rec.snapshotFile.split('.').pop().replace('jpg', 'jpeg')}` });
          return res.end(buf);
        }
        const { design, view, estimate, createdAt } = found.rec;
        return send(req, res, 200, { ok: true, code, design, view, estimate, createdAt });
      }

      if (url.pathname === '/' || url.pathname === '/health') {
        return send(req, res, 200, { ok: true, service: 'pergola-designer dev api', leads: LEADS });
      }
      send(req, res, 404, { ok: false, error: 'Not found' });
    } catch (e) {
      console.error(e);
      send(req, res, 500, { ok: false, error: 'Server error' });
    }
  });

  server.listen(PORT, () => {
    console.log(`99 Pergolas dev API on http://localhost:${PORT}  (leads → ${path.relative(process.cwd(), LEADS) || '.leads'}/)`);
  });
}
