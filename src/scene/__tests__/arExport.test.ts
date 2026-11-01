import { describe, expect, it } from 'vitest';
import * as THREE from 'three';
import { bakeForAr } from '../arExport';

function std(color: string) {
  return new THREE.MeshStandardMaterial({ color });
}

describe('bakeForAr', () => {
  it('expands instanced meshes, merges by material and skips arSkip subtrees', () => {
    const scene = new THREE.Scene();
    const root = new THREE.Group();
    root.userData.arRoot = true;
    root.position.set(5, 0, 0); // root transform must NOT leak into the export
    scene.add(root);

    const frame = std('#111');
    const post = new THREE.Mesh(new THREE.BoxGeometry(0.1, 2, 0.1), frame);
    post.position.set(1, 1, 0);
    root.add(post);
    const beam = new THREE.Mesh(new THREE.BoxGeometry(2, 0.2, 0.2), frame);
    beam.position.set(0, 2.1, 0);
    root.add(beam);

    const louverMat = std('#222');
    const louvers = new THREE.InstancedMesh(new THREE.BoxGeometry(1, 0.02, 0.1), louverMat, 3);
    const m = new THREE.Matrix4();
    for (let i = 0; i < 3; i++) {
      m.makeTranslation(0, 2.3, i * 0.2);
      louvers.setMatrixAt(i, m);
    }
    root.add(louvers);

    const house = new THREE.Group();
    house.userData.arSkip = true;
    house.add(new THREE.Mesh(new THREE.BoxGeometry(4, 3, 0.3), std('#aaa')));
    root.add(house);

    const label = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), new THREE.MeshBasicMaterial());
    root.add(label); // non-standard material: ignored

    const baked = bakeForAr(scene);
    expect(baked.children).toHaveLength(2); // frame + louvers
    const box = new THREE.Box3().setFromObject(baked);
    expect(box.min.x).toBeCloseTo(-1, 5);
    expect(box.max.x).toBeCloseTo(1.05, 5);
    expect(box.min.y).toBeCloseTo(0, 5);
    expect(box.max.y).toBeCloseTo(2.31, 5);
    expect(box.max.z).toBeCloseTo(0.45, 5);

    const louverPart = baked.children.find((c) => ((c as THREE.Mesh).material as THREE.MeshStandardMaterial).color.getHexString() === '222222') as THREE.Mesh;
    // 3 blades × 12 triangles × 3 vertices
    expect(louverPart.geometry.getAttribute('position').count).toBe(3 * 36);
    expect(louverPart.geometry.getAttribute('uv')).toBeTruthy();
    expect(louverPart.geometry.getAttribute('normal')).toBeTruthy();
  });

  it('clamps emissive intensity and drops maps on exported materials', () => {
    const scene = new THREE.Scene();
    const root = new THREE.Group();
    root.userData.arRoot = true;
    scene.add(root);
    const led = new THREE.MeshStandardMaterial({ emissive: '#ffd9a0', emissiveIntensity: 3.5 });
    led.map = new THREE.Texture();
    root.add(new THREE.Mesh(new THREE.BoxGeometry(1, 0.01, 0.01), led));
    const baked = bakeForAr(scene);
    const mat = (baked.children[0] as THREE.Mesh).material as THREE.MeshStandardMaterial;
    expect(mat.emissiveIntensity).toBe(1);
    expect(mat.map).toBeNull();
    expect(led.emissiveIntensity).toBe(3.5); // original untouched
  });
});
