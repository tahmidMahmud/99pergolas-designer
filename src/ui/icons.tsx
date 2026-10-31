/** Inline SVG icons and product illustrations. All use currentColor so they follow the theme. */
import type { ReactNode, SVGProps } from 'react';
import type { Mounting, RoofType, ShadeStyle, SideId } from '../types';

type P = SVGProps<SVGSVGElement> & { size?: number };

function Svg({ size = 18, children, ...rest }: P & { children: ReactNode }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8}
      strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false" {...rest}>
      {children}
    </svg>
  );
}

export const IconArrow = (p: P) => <Svg {...p}><path d="M5 12h14M13 6l6 6-6 6" /></Svg>;
export const IconBack = (p: P) => <Svg {...p}><path d="M19 12H5M11 6l-6 6 6 6" /></Svg>;
export const IconPhone = (p: P) => <Svg {...p}><path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2" /></Svg>;
export const IconSun = (p: P) => <Svg {...p}><circle cx="12" cy="12" r="4" /><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" /></Svg>;
export const IconMoon = (p: P) => <Svg {...p}><path d="M20 14.5A8 8 0 1 1 9.5 4a6.5 6.5 0 0 0 10.5 10.5z" /></Svg>;
export const IconCamera = (p: P) => <Svg {...p}><path d="M4 8h3l2-3h6l2 3h3v11H4z" /><circle cx="12" cy="13" r="3.5" /></Svg>;
export const IconReset = (p: P) => <Svg {...p}><path d="M4 4v6h6" /><path d="M5.5 15a7 7 0 1 0 1.3-7.6L4 10" /></Svg>;
export const IconCopy = (p: P) => <Svg {...p}><rect x="9" y="9" width="11" height="11" rx="2" /><path d="M5 15V5a1 1 0 0 1 1-1h10" /></Svg>;
export const IconCheck = (p: P) => <Svg {...p}><path d="M5 12.5l4.5 4.5L19 7.5" /></Svg>;
export const IconInfo = (p: P) => <Svg {...p}><circle cx="12" cy="12" r="9" /><path d="M12 11v5M12 8h.01" /></Svg>;
export const IconClose = (p: P) => <Svg {...p}><path d="M6 6l12 12M18 6L6 18" /></Svg>;
export const IconDownload = (p: P) => <Svg {...p}><path d="M12 4v11M7 10l5 5 5-5M5 20h14" /></Svg>;
export const IconPlus = (p: P) => <Svg {...p}><path d="M12 5v14M5 12h14" /></Svg>;
export const IconMinus = (p: P) => <Svg {...p}><path d="M5 12h14" /></Svg>;
export const IconTrash = (p: P) => <Svg {...p}><path d="M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3" /></Svg>;
export const IconCalendar = (p: P) => <Svg {...p}><rect x="4" y="5" width="16" height="15" rx="2" /><path d="M4 10h16M9 3v4M15 3v4" /></Svg>;
export const IconRuler = (p: P) => <Svg {...p}><path d="M3 17L17 3l4 4L7 21z" /><path d="M7 13l2 2M10 10l2 2M13 7l2 2" /></Svg>;
export const IconLouvers = (p: P) => <Svg {...p}><path d="M4 7l4-3M9 7l4-3M14 7l4-3M4 13l4-3M9 13l4-3M14 13l4-3M3 18h18" /></Svg>;
export const IconAlert = (p: P) => <Svg {...p}><path d="M12 3l9.5 17h-19z" /><path d="M12 10v4M12 17h.01" /></Svg>;

/* ---------- Mounting illustrations (120 x 80, oblique view) ---------- */

const louverLines = (x0: number, x1: number) => {
  const out: ReactNode[] = [];
  for (let x = x0 + 7; x < x1 - 2; x += 7) out.push(<line key={x} x1={x} y1={30} x2={x + 24} y2={18} strokeWidth={1} opacity={0.55} />);
  return out;
};

function Wall() {
  return (
    <g>
      <rect x={30} y={2} width={86} height={60} fill="currentColor" opacity={0.08} stroke="none" />
      {[10, 18, 26, 34, 42, 50, 58].map((y) => (
        <line key={y} x1={30} y1={y} x2={116} y2={y} strokeWidth={0.6} opacity={0.25} />
      ))}
    </g>
  );
}

export function MountingArt({ kind }: { kind: Mounting }) {
  const roof = (
    <g>
      <path d="M20 30 L84 30 L108 18 L44 18 Z" fill="var(--card)" />
      {louverLines(20, 84)}
      <path d="M20 30 L84 30 L84 35 L20 35 Z" fill="currentColor" />
      <path d="M84 30 L108 18 L108 23 L84 35 Z" fill="currentColor" opacity={0.75} />
    </g>
  );
  const post = (x: number, y0: number, y1: number, w = 4) => <rect x={x} y={y0} width={w} height={y1 - y0} fill="currentColor" stroke="none" />;
  return (
    <svg viewBox="0 0 128 80" className="mount-art" aria-hidden="true" focusable="false" fill="none" stroke="currentColor" strokeWidth={1.4} strokeLinejoin="round">
      <line x1={4} y1={74} x2={124} y2={74} strokeWidth={1} opacity={0.35} />
      {kind === 'freestanding' && (
        <>
          {post(44, 23, 62, 3)}
          {post(104, 23, 62, 3)}
          {roof}
          {post(20, 35, 74)}
          {post(80, 35, 74)}
        </>
      )}
      {kind === 'attached' && (
        <>
          <Wall />
          <rect x={44} y={16} width={64} height={4} fill="currentColor" stroke="none" opacity={0.9} />
          {roof}
          {post(20, 35, 74)}
          {post(80, 35, 74)}
        </>
      )}
      {kind === 'floating' && (
        <>
          <Wall />
          {roof}
          {post(30, 35, 74, 2.5)}
          {post(72, 35, 74, 2.5)}
          <path d="M84 33 L96 27" strokeDasharray="2 2" opacity={0.5} />
        </>
      )}
      {kind === 'cantilever' && (
        <>
          {post(44, 23, 66, 4)}
          {post(104, 23, 66, 4)}
          <path d="M46 26 L28 33 M106 26 L88 33" strokeWidth={2} />
          {roof}
          <path d="M30 66 L34 58 L50 56 L60 50 L80 50 L90 58 L98 60 L98 68 L30 68 Z" fill="var(--card)" strokeWidth={1.2} />
          <circle cx={44} cy={68} r={4} fill="currentColor" stroke="none" />
          <circle cx={86} cy={68} r={4} fill="currentColor" stroke="none" />
        </>
      )}
    </svg>
  );
}

export function RoofArt({ kind }: { kind: RoofType }) {
  return (
    <svg viewBox="0 0 96 40" className="roof-art" aria-hidden="true" focusable="false" fill="none" stroke="currentColor" strokeWidth={1.4}>
      <rect x={6} y={6} width={84} height={28} rx={2} fill={kind === 'solid' ? 'currentColor' : 'none'} opacity={kind === 'solid' ? 0.85 : 1} />
      {kind === 'louvered' &&
        Array.from({ length: 11 }, (_, i) => <line key={i} x1={12 + i * 7} y1={9} x2={10 + i * 7} y2={31} strokeWidth={2.2} />)}
    </svg>
  );
}

/** Top-down square with the chosen side highlighted. */
export function SideArt({ side, active }: { side: SideId; active: boolean }) {
  const lines: Record<SideId, [number, number, number, number]> = {
    front: [6, 34, 34, 34],
    back: [6, 6, 34, 6],
    left: [6, 6, 6, 34],
    right: [34, 6, 34, 34],
  };
  const [x1, y1, x2, y2] = lines[side];
  return (
    <svg viewBox="0 0 40 40" width={36} height={36} aria-hidden="true" focusable="false" fill="none">
      <rect x={6} y={6} width={28} height={28} stroke="currentColor" strokeWidth={1} opacity={0.35} />
      {[6, 34].flatMap((x) => [6, 34].map((y) => <rect key={`${x}${y}`} x={x - 2} y={y - 2} width={4} height={4} fill="currentColor" opacity={0.6} />))}
      <line x1={x1} y1={y1} x2={x2} y2={y2} stroke={active ? 'var(--brass)' : 'currentColor'} strokeWidth={4} strokeLinecap="round" />
    </svg>
  );
}

/* ---------- Indoor shade style previews ---------- */

export function ShadeArt({ style, drop = 0.62, color = 'var(--brass)', large = false }: { style: ShadeStyle; drop?: number; color?: string; large?: boolean }) {
  const W = 80, H = 100, x0 = 8, y0 = 10, w = W - 16, h = H - 18;
  const fabricH = h * drop;
  const parts: ReactNode[] = [];
  if (style === 'roller') {
    parts.push(<rect key="f" x={x0} y={y0} width={w} height={fabricH} fill={color} opacity={0.55} />);
    parts.push(<rect key="b" x={x0} y={y0 + fabricH - 2} width={w} height={3} fill={color} />);
  } else if (style === 'zebra') {
    for (let y = 0; y < fabricH; y += 8) parts.push(<rect key={y} x={x0} y={y0 + y} width={w} height={Math.min(4, fabricH - y)} fill={color} opacity={0.7} />);
    parts.push(<rect key="s" x={x0} y={y0} width={w} height={fabricH} fill={color} opacity={0.15} />);
  } else if (style === 'honeycomb') {
    parts.push(<rect key="f" x={x0} y={y0} width={w} height={fabricH} fill={color} opacity={0.4} />);
    for (let y = 5; y < fabricH; y += 5) parts.push(<line key={y} x1={x0} y1={y0 + y} x2={x0 + w} y2={y0 + y} stroke={color} strokeWidth={1} />);
  } else if (style === 'roman') {
    parts.push(<rect key="f" x={x0} y={y0} width={w} height={fabricH} fill={color} opacity={0.45} />);
    for (let y = fabricH - 2; y > 6; y -= 11) parts.push(<path key={y} d={`M${x0} ${y0 + y - 4} Q ${x0 + w / 2} ${y0 + y + 4} ${x0 + w} ${y0 + y - 4}`} stroke={color} strokeWidth={1.4} fill="none" />);
  } else if (style === 'shangri-la') {
    parts.push(<rect key="s" x={x0} y={y0} width={w} height={fabricH} fill={color} opacity={0.18} />);
    for (let y = 4; y < fabricH; y += 7) parts.push(<rect key={y} x={x0} y={y0 + y} width={w} height={2.4} fill={color} opacity={0.75} />);
  } else {
    for (let x = 0; x < w; x += 7) parts.push(<rect key={x} x={x0 + x} y={y0} width={5} height={h} fill={color} opacity={0.6} />);
  }
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className={large ? 'shade-art shade-art-lg' : 'shade-art'} aria-hidden="true" focusable="false">
      <rect x={x0 - 3} y={y0 - 3} width={w + 6} height={h + 6} rx={2} fill="#dfe8ee" stroke="currentColor" strokeWidth={2} />
      <line x1={x0 + w / 2} y1={y0} x2={x0 + w / 2} y2={y0 + h} stroke="currentColor" strokeWidth={1} opacity={0.3} />
      {parts}
      <rect x={x0 - 4} y={y0 - 6} width={w + 8} height={5} rx={1.5} fill="currentColor" />
    </svg>
  );
}
