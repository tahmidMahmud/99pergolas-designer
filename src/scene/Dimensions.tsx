/** In-canvas dimension lines (drei Line, one draw call) + billboarded SDF labels (included in snapshots). */
import { Suspense, useMemo } from 'react';
import { Billboard, Line, Text } from '@react-three/drei';
import type { PergolaDesign } from '../types';
import { useDesigner } from '../state/store';
import type { PergolaLayout } from './layout';
import { isNight } from './layout';
import { ftIn } from './units';

type V3 = [number, number, number];

export interface DimSpec {
  a: V3;
  b: V3;
  /** Direction of the end ticks. */
  tick: V3;
  label: string;
  /** Label position. */
  at: V3;
}

export function DimensionSet({ dims, scale }: { dims: DimSpec[]; scale: number }) {
  const night = useDesigner((s) => isNight(s.view.hour));
  const points = useMemo(() => {
    const pts: V3[] = [];
    for (const d of dims) {
      pts.push(d.a, d.b);
      for (const p of [d.a, d.b]) {
        pts.push([p[0] - d.tick[0], p[1] - d.tick[1], p[2] - d.tick[2]], [p[0] + d.tick[0], p[1] + d.tick[1], p[2] + d.tick[2]]);
      }
    }
    return pts;
  }, [dims]);
  const ink = night ? '#f2f1ec' : '#22251f';
  const halo = night ? '#171a18' : '#ffffff';
  const fontSize = Math.min(0.34, Math.max(0.16, scale * 0.034));
  return (
    <group>
      <Line points={points} segments color={ink} lineWidth={1.6} depthTest={false} renderOrder={10} transparent />
      <Suspense fallback={null}>
        {dims.map((d, i) => (
          <Billboard key={i} position={d.at}>
            <Text
              fontSize={fontSize}
              color={ink}
              outlineWidth={fontSize * 0.14}
              outlineColor={halo}
              anchorX="center"
              anchorY="middle"
              renderOrder={11}
              material-depthTest={false}
              material-toneMapped={false}
            >
              {d.label}
            </Text>
          </Billboard>
        ))}
      </Suspense>
    </group>
  );
}

export function Dimensions({ design, layout: L }: { design: PergolaDesign; layout: PergolaLayout }) {
  const show = useDesigner((s) => s.view.showDimensions);
  const dims = useMemo<DimSpec[]>(() => {
    const { W, D, H, top } = L;
    const lift = 0.28;
    const out = 0.32;
    const t = 0.09;
    const y = top + lift;
    return [
      {
        a: [-W / 2, y, D / 2],
        b: [W / 2, y, D / 2],
        tick: [0, t, 0],
        label: `Width ${ftIn(design.width)}`,
        at: [0, y + 0.22, D / 2],
      },
      {
        a: [W / 2 + out, y, D / 2],
        b: [W / 2 + out, y, -D / 2],
        tick: [0, t, 0],
        label: `Length ${ftIn(design.depth)}`,
        at: [W / 2 + out, y + 0.22, 0],
      },
      {
        a: [W / 2 + out, 0, D / 2 + out],
        b: [W / 2 + out, H, D / 2 + out],
        tick: [t * 0.7, 0, -t * 0.7],
        label: `Height ${ftIn(design.height)}`,
        at: [W / 2 + out + 0.5, H / 2, D / 2 + out + 0.15],
      },
    ];
  }, [L, design.width, design.depth, design.height]);
  if (!show) return null;
  return <DimensionSet dims={dims} scale={Math.max(L.W, L.D, L.top)} />;
}
