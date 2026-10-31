import { useEffect, useMemo } from 'react';
import type { Part } from './parts';
import { mergeByMaterial } from './parts';
import { castsShadow, getMat } from './materials';

/** Renders a list of Parts as one mesh per material key. `build` must be memoized by the caller's deps. */
export function MergedMeshes({ parts, receiveShadow = true, castShadow = true }: { parts: Part[]; receiveShadow?: boolean; castShadow?: boolean }) {
  const merged = useMemo(() => mergeByMaterial(parts), [parts]);
  useEffect(() => () => merged.forEach((g) => g.dispose()), [merged]);
  return (
    <>
      {[...merged.entries()].map(([key, geo]) => {
        const mat = getMat(key);
        const transparent = mat.transparent;
        return (
          <mesh
            key={key}
            geometry={geo}
            material={mat}
            castShadow={castShadow && castsShadow(key)}
            receiveShadow={receiveShadow && !transparent}
            renderOrder={transparent ? 2 : 0}
          />
        );
      })}
    </>
  );
}
