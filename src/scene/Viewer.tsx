/** 3D viewer: R3F canvas with demand rendering, context-loss recovery and snapshot registration. */
import { useEffect, useMemo, useState, type CSSProperties } from 'react';
import * as THREE from 'three';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import type { Design, PergolaDesign, ScreensDesign } from '../types';
import { useDesigner } from '../state/store';
import { getStructure } from './structure';
import { computeLayout } from './layout';
import { PergolaModel } from './PergolaModel';
import { ScreensModel, screensLayout, PORCH_DEPTH } from './ScreensModel';
import { Lighting } from './Environment';
import { Ground } from './Ground';
import { CameraRig, type Bounds } from './CameraRig';
import { registerScene } from './snapshot';

export interface ViewerProps {
  className?: string;
}

/** Re-render on any store change (frameloop="demand"). Registers the renderer for snapshots. */
function SceneBridge() {
  const gl = useThree((s) => s.gl);
  const scene = useThree((s) => s.scene);
  const camera = useThree((s) => s.camera);
  const invalidate = useThree((s) => s.invalidate);
  useEffect(() => useDesigner.subscribe(() => invalidate()), [invalidate]);
  // Invalidations fired while the root mounts can be dropped; kick a few frames once it is live.
  useEffect(() => {
    const raf = requestAnimationFrame(() => invalidate(2));
    const t = window.setTimeout(() => invalidate(), 400);
    return () => {
      cancelAnimationFrame(raf);
      window.clearTimeout(t);
    };
  }, [invalidate]);
  useEffect(() => {
    registerScene({ gl, scene, camera, invalidate });
    return () => registerScene(null);
  }, [gl, scene, camera, invalidate]);
  return null;
}

/** Dev-only: expose last-frame draw calls (window.__pergolaScene). Negative priority: never take over rendering. */
function DevStats() {
  const gl = useThree((s) => s.gl);
  const scene = useThree((s) => s.scene);
  const get = useThree((s) => s.get);
  useEffect(() => {
    (window as unknown as { __pergolaThree?: unknown }).__pergolaThree = { gl, scene, get };
  }, [gl, scene, get]);
  useFrame(() => {
    (window as unknown as { __pergolaScene?: unknown }).__pergolaScene = {
      calls: gl.info.render.calls,
      triangles: gl.info.render.triangles,
      geometries: gl.info.memory.geometries,
      textures: gl.info.memory.textures,
    };
  }, -1);
  return null;
}

function PergolaScene({ design }: { design: PergolaDesign }) {
  const structure = useMemo(() => getStructure(design), [design]);
  const layout = useMemo(() => computeLayout(design, structure), [design, structure]);
  const bounds = useMemo<Bounds>(
    () => ({
      center: [0, layout.top * 0.45, 0],
      radius: 0.5 * Math.hypot(layout.W, layout.D, layout.top),
    }),
    [layout.W, layout.D, layout.top],
  );
  const frameKey = `p|${design.width}|${design.depth}|${design.height}|${design.mounting}`;
  const margin = 1.2;
  const patioD = layout.hasHouse ? layout.D + margin : layout.D + 2 * margin;
  const patioZ = layout.hasHouse ? margin / 2 : 0;
  return (
    <>
      <Lighting radius={Math.max(layout.W, layout.D) / 2} height={layout.top} />
      <Ground patioW={layout.W + 2 * margin} patioD={patioD} patioZ={patioZ} />
      <PergolaModel design={design} structure={structure} layout={layout} />
      <CameraRig bounds={bounds} frameKey={frameKey} />
    </>
  );
}

function ScreensScene({ design }: { design: ScreensDesign }) {
  const L = useMemo(() => screensLayout(design), [design]);
  const bounds = useMemo<Bounds>(
    () => ({ center: [0, L.wallH * 0.45, -0.6], radius: 0.5 * Math.hypot(L.wallW, L.wallH, PORCH_DEPTH * 0.6) }),
    [L],
  );
  const frameKey = `s|${design.openings.map((o) => `${o.width}x${o.height}`).join(',')}`;
  return (
    <>
      <Lighting radius={Math.max(L.wallW, PORCH_DEPTH) / 2} height={L.wallH} />
      <Ground patioW={L.wallW + 2} patioD={2.4} patioZ={1.2} />
      <ScreensModel design={design} />
      <CameraRig bounds={bounds} frameKey={frameKey} />
    </>
  );
}

function PlaceholderScene({ kind }: { kind: Design['kind'] }) {
  const bounds = useMemo<Bounds>(() => ({ center: [0, 0.9, 0], radius: 2.6 }), []);
  return (
    <>
      <Lighting radius={3} height={2} />
      <Ground />
      <mesh position={[0, 0.003, 0]} rotation-x={-Math.PI / 2} receiveShadow>
        <ringGeometry args={[1.35, 1.42, 64]} />
        <meshStandardMaterial color="#b4863b" roughness={0.5} metalness={0.2} />
      </mesh>
      <CameraRig bounds={bounds} frameKey={`x|${kind}`} />
    </>
  );
}

function SceneContent() {
  const design = useDesigner((s) => s.design);
  if (design.kind === 'pergola') return <PergolaScene design={design} />;
  if (design.kind === 'screens') return <ScreensScene design={design} />;
  return <PlaceholderScene kind={design.kind} />;
}

const overlayStyle: CSSProperties = {
  position: 'absolute',
  inset: 0,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  background: 'rgba(242,241,236,0.92)',
  color: '#22251f',
  border: 0,
  font: '600 15px "Instrument Sans", system-ui, sans-serif',
  cursor: 'pointer',
  borderRadius: 'inherit',
};

export function Viewer({ className }: ViewerProps) {
  const [lost, setLost] = useState(false);
  const [generation, setGeneration] = useState(0);

  return (
    <div
      className={className}
      style={{ position: 'relative', width: '100%', height: '100%', minHeight: 220, background: '#F2F1EC', overflow: 'hidden' }}
    >
      <Canvas
        key={generation}
        frameloop="demand"
        dpr={[1, 1.75]}
        shadows="percentage"
        camera={{ fov: 40, near: 0.05, far: 400, position: [8, 4, 10] }}
        gl={{ antialias: true, preserveDrawingBuffer: false, powerPreference: 'high-performance' }}
        style={{ touchAction: 'none' }}
        onCreated={({ gl }) => {
          gl.toneMapping = THREE.NeutralToneMapping;
          gl.toneMappingExposure = 1.1;
          gl.outputColorSpace = THREE.SRGBColorSpace;
          const canvas = gl.domElement;
          canvas.addEventListener('webglcontextlost', (e) => {
            e.preventDefault();
            setLost(true);
          });
          canvas.addEventListener('webglcontextrestored', () => setLost(false));
        }}
      >
        <SceneBridge />
        {import.meta.env.DEV && <DevStats />}
        <SceneContent />
      </Canvas>
      {lost && (
        <button
          type="button"
          style={overlayStyle}
          onClick={() => {
            setLost(false);
            setGeneration((g) => g + 1);
          }}
        >
          Tap to reload the 3D view
        </button>
      )}
    </div>
  );
}

export default Viewer;
