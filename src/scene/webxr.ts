/**
 * WebXR "immersive-ar" session (Android Chrome and other WebXR browsers): a reticle follows the
 * floor via hit-testing; a tap places the design at full size, facing the viewer.
 */
import * as THREE from 'three';
import { bakeCurrentDesign, disposeBaked } from './arExport';

export async function webXrArSupported(): Promise<boolean> {
  const xr = (navigator as Navigator & { xr?: XRSystem }).xr;
  if (!xr || !window.isSecureContext) return false;
  try {
    return await xr.isSessionSupported('immersive-ar');
  } catch {
    return false;
  }
}

export interface WebXrSession {
  end: () => void;
}

export async function startWebXrAr(opts: { overlay?: HTMLElement; onPlaced?: () => void; onEnd?: () => void }): Promise<WebXrSession> {
  const xr = (navigator as Navigator & { xr?: XRSystem }).xr;
  if (!xr) throw new Error('WebXR is not available');
  const model = await bakeCurrentDesign();

  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.xr.enabled = true;
  Object.assign(renderer.domElement.style, { position: 'fixed', inset: '0', zIndex: '9998' });
  document.body.appendChild(renderer.domElement);

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(70, window.innerWidth / window.innerHeight, 0.01, 60);
  scene.add(new THREE.HemisphereLight(0xffffff, 0x8a8a80, 1.4));
  const sun = new THREE.DirectionalLight(0xffffff, 1.6);
  sun.position.set(2, 6, 3);
  scene.add(sun);

  const reticle = new THREE.Mesh(
    new THREE.RingGeometry(0.1, 0.13, 40).rotateX(-Math.PI / 2),
    new THREE.MeshBasicMaterial({ color: 0xb4863b, transparent: true, opacity: 0.9 }),
  );
  reticle.matrixAutoUpdate = false;
  reticle.visible = false;
  scene.add(reticle);
  model.visible = false;
  scene.add(model);

  const init: XRSessionInit = { requiredFeatures: ['hit-test'] };
  if (opts.overlay) {
    init.optionalFeatures = ['dom-overlay'];
    (init as XRSessionInit & { domOverlay?: { root: Element } }).domOverlay = { root: opts.overlay };
  }
  const session = await xr.requestSession('immersive-ar', init);
  renderer.xr.setReferenceSpaceType('local');
  await renderer.xr.setSession(session);

  let hitSource: XRHitTestSource | null = null;
  let requested = false;
  const camPos = new THREE.Vector3();
  const place = () => {
    if (!reticle.visible) return;
    model.position.setFromMatrixPosition(reticle.matrix);
    camera.getWorldPosition(camPos);
    // Face the viewer: the design's front (+Z) toward the camera.
    model.rotation.y = Math.atan2(camPos.x - model.position.x, camPos.z - model.position.z);
    model.visible = true;
    opts.onPlaced?.();
  };
  const controller = renderer.xr.getController(0);
  controller.addEventListener('select', place);
  scene.add(controller);

  renderer.setAnimationLoop((_t: number, frame?: XRFrame) => {
    if (frame) {
      const ref = renderer.xr.getReferenceSpace();
      if (!requested) {
        requested = true;
        session
          .requestReferenceSpace('viewer')
          .then((space) => session.requestHitTestSource?.({ space }))
          .then((src) => {
            hitSource = src ?? null;
          })
          .catch(() => undefined);
      }
      if (hitSource && ref) {
        const hits = frame.getHitTestResults(hitSource);
        const pose = hits.length ? hits[0].getPose(ref) : null;
        reticle.visible = !!pose && !model.visible;
        if (pose) reticle.matrix.fromArray(pose.transform.matrix);
      }
    }
    renderer.render(scene, camera);
  });

  const cleanup = () => {
    renderer.setAnimationLoop(null);
    hitSource?.cancel?.();
    disposeBaked(model);
    reticle.geometry.dispose();
    (reticle.material as THREE.Material).dispose();
    renderer.dispose();
    renderer.domElement.remove();
    opts.onEnd?.();
  };
  session.addEventListener('end', cleanup, { once: true });

  return {
    end: () => {
      void session.end().catch(() => cleanup());
    },
  };
}
