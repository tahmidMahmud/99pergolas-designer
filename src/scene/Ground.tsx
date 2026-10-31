/** Ground: large soft plane that fades into the fog + a paver patio under the structure. */
import { useEffect, useMemo } from 'react';
import * as THREE from 'three';
import { useDesigner } from '../state/store';
import { nightFactor } from './layout';
import { paverTexture } from './textures';

export function Ground({ patioW, patioD, patioZ = 0 }: { patioW?: number; patioD?: number; patioZ?: number }) {
  const hour = useDesigner((s) => s.view.hour);
  const n = nightFactor(hour);
  const groundMat = useMemo(() => new THREE.MeshStandardMaterial({ color: '#d9d7cf', roughness: 1, metalness: 0 }), []);
  useEffect(() => () => groundMat.dispose(), [groundMat]);
  groundMat.color.set(n > 0.5 ? '#3a4150' : '#d9d7cf');

  const patioMat = useMemo(() => {
    if (!patioW || !patioD) return null;
    return new THREE.MeshStandardMaterial({ map: paverTexture(patioW, patioD), roughness: 0.9, metalness: 0 });
  }, [patioW, patioD]);
  useEffect(
    () => () => {
      patioMat?.map?.dispose();
      patioMat?.dispose();
    },
    [patioMat],
  );

  return (
    <group>
      <mesh rotation-x={-Math.PI / 2} material={groundMat} receiveShadow>
        <circleGeometry args={[60, 48]} />
      </mesh>
      {patioMat && patioW && patioD && (
        <mesh rotation-x={-Math.PI / 2} position={[0, 0.004, patioZ]} material={patioMat} receiveShadow>
          <planeGeometry args={[patioW, patioD]} />
        </mesh>
      )}
    </group>
  );
}
