import { ARMORS, WEAPONS } from './config.js';

const gltfLoader = new THREE.GLTFLoader();

export function createDuckModel(featherHex, armorTier, weaponIdx, isEnemy = false) {
  const group = new THREE.Group();
  const armorCfg = ARMORS.find(a => a.tier === armorTier) || ARMORS[0];
  const weaponCfg = WEAPONS[weaponIdx] || WEAPONS[0];

  gltfLoader.load(
    './assets/duck.glb',
    (gltf) => {
      const model = gltf.scene;
      model.scale.set(1.0, 1.0, 1.0);
      model.traverse(child => {
        if (child.isMesh) {
          child.castShadow = true;
          child.receiveShadow = true;
        }
      });
      while (group.children.length > 0) group.remove(group.children[0]);
      group.add(model);
    },
    undefined,
    () => {}
  );

  buildProceduralDuck(group, featherHex, armorCfg, weaponCfg, isEnemy);
  return { group };
}

function buildProceduralDuck(group, featherHex, armorCfg, weaponCfg, isEnemy) {
  const featherMat = new THREE.MeshStandardMaterial({ color: featherHex, roughness: 0.7 });
  const beakMat = new THREE.MeshStandardMaterial({ color: 0xff9800, roughness: 0.5 });
  const armorMat = new THREE.MeshStandardMaterial({
    color: isEnemy ? 0x8e24aa : armorCfg.color,
    metalness: 0.45,
    roughness: 0.45
  });

  const body = new THREE.Mesh(new THREE.BoxGeometry(0.95, 0.85, 1.15), featherMat);
  body.position.y = 0.65;
  body.castShadow = true;
  group.add(body);

  const vest = new THREE.Mesh(new THREE.BoxGeometry(1.08, 0.58, 0.92), armorMat);
  vest.position.y = 0.72;
  group.add(vest);

  const bag = new THREE.Mesh(
    new THREE.BoxGeometry(0.75, 0.65, 0.4),
    new THREE.MeshStandardMaterial({ color: 0x3e2723 })
  );
  bag.position.set(0, 0.75, -0.65);
  group.add(bag);

  const head = new THREE.Mesh(new THREE.BoxGeometry(0.68, 0.68, 0.68), featherMat);
  head.position.set(0, 1.38, 0.15);
  head.castShadow = true;
  group.add(head);

  const helmet = new THREE.Mesh(new THREE.BoxGeometry(0.76, 0.32, 0.76), armorMat);
  helmet.position.set(0, 1.65, 0.15);
  group.add(helmet);

  const beak = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.18, 0.48), beakMat);
  beak.position.set(0, 1.3, 0.65);
  group.add(beak);

  const gunGroup = new THREE.Group();
  const receiver = new THREE.Mesh(
    new THREE.BoxGeometry(0.14, 0.2, weaponCfg.barrelLen),
    new THREE.MeshStandardMaterial({ color: 0x151515, metalness: 0.85 })
  );
  gunGroup.add(receiver);

  const scope = new THREE.Mesh(
    new THREE.CylinderGeometry(0.06, 0.06, 0.35, 10),
    new THREE.MeshStandardMaterial({ color: 0x263238, metalness: 0.7 })
  );
  scope.rotation.x = Math.PI / 2;
  scope.position.set(0, 0.15, -0.05);
  gunGroup.add(scope);

  gunGroup.position.set(0.58, 0.82, 0.55);
  group.add(gunGroup);
}

export function createChestMesh(isRare) {
  const mesh = new THREE.Mesh(
    new THREE.BoxGeometry(1.3, 0.85, 0.85),
    new THREE.MeshStandardMaterial({
      color: isRare ? 0xd4af37 : 0x6d4c41,
      metalness: isRare ? 0.65 : 0.15,
      roughness: 0.4
    })
  );
  mesh.castShadow = true;
  return mesh;
}
