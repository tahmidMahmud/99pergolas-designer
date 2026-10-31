/** Minimal toast queue: call toast('Copied') from anywhere; <Toaster/> is mounted once in App. */
import { useSyncExternalStore } from 'react';
import { IconAlert, IconCheck } from './icons';

type ToastItem = { id: number; text: string; kind: 'ok' | 'error' };
let items: ToastItem[] = [];
let seq = 0;
const subs = new Set<() => void>();
const emit = () => subs.forEach((f) => f());

export function toast(text: string, kind: ToastItem['kind'] = 'ok') {
  const id = ++seq;
  items = [...items, { id, text, kind }].slice(-3);
  emit();
  window.setTimeout(() => {
    items = items.filter((t) => t.id !== id);
    emit();
  }, 3200);
}

export function Toaster() {
  const list = useSyncExternalStore(
    (f) => { subs.add(f); return () => { subs.delete(f); }; },
    () => items,
  );
  return (
    <div className="toaster" role="status" aria-live="polite">
      {list.map((t) => (
        <div key={t.id} className={`toast toast-${t.kind}`}>
          {t.kind === 'ok' ? <IconCheck size={16} /> : <IconAlert size={16} />}
          <span>{t.text}</span>
        </div>
      ))}
    </div>
  );
}

/** Copy text with a toast; falls back to a selection prompt when the Clipboard API is blocked (iframes). */
export async function copyText(text: string, okMsg = 'Link copied') {
  try {
    await navigator.clipboard.writeText(text);
    toast(okMsg);
  } catch {
    const ta = document.createElement('textarea');
    ta.value = text;
    ta.setAttribute('readonly', '');
    ta.style.position = 'fixed';
    ta.style.opacity = '0';
    document.body.appendChild(ta);
    ta.select();
    const ok = document.execCommand('copy');
    ta.remove();
    toast(ok ? okMsg : 'Copy blocked — select the link and copy it manually', ok ? 'ok' : 'error');
  }
}

export function downloadDataUrl(url: string, filename: string) {
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
}
