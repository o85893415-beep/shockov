import { WEAPONS, ARMORS, LOOT_ITEMS, MAPS } from './config.js';
import { loadSave, writeSave, resetSave, playSound } from './storage.js';
import { createDuckModel, createChestMesh } from './models.js';
import { addItemToBackpack, renderBackpack, getBackpackValue } from './inventory.js';
import { populateMenus, refreshMenuUI, updateHUD, addLootFeed, drawRadar } from './ui.js';

let saveData = loadSave();
populateMenus();
refreshMenuUI(saveData, () => writeSave(saveData));

document.getElementById('sel-weapon').addEventListener('change', () => refreshMenuUI(saveData, () => writeSave(saveData)));
document.getElementById('sel-armor').addEventListener('change', () => refreshMenuUI(saveData, () => writeSave(saveData)));

document.getElementById('btn-buy-supply').addEventListener('click', () => {
  if (saveData.cash < 400) return alert("Not enough Roubles!");
  saveData.cash -= 400;
  saveData.medkits += 1;
  saveData.plates += 1;
  writeSave(saveData);
  refreshMenuUI(saveData, () => writeSave(saveData));
  alert(`Supplies Ready! Medkits: ${saveData.medkits} | Plates: ${saveData.plates}`);
});

document.getElementById('btn-sell-all').addEventListener('click', () => {
  if (saveData.stash.length === 0) return;
  const total = saveData.stash.reduce((s, i) => s + i.val, 0);
  saveData.stash.forEach(i => {
    if (i.type === 'weapon' && !saveData.unlockedWeapons.includes(i.weaponId)) {
      saveData.unlockedWeapons.push(i.weaponId);
    }
  });
  saveData.cash += total;
  saveData.stash = [];
  writeSave(saveData);
  refreshMenuUI(saveData, () => writeSave(saveData));
});

document.getElementById('btn-reset').addEventListener('click', () => {
  saveData = resetSave();
  refreshMenuUI(saveData, () => writeSave(saveData));
});

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 0.1, 200);
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
document.body.appendChild(renderer.domElement);

window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

const hemiLight = new THREE.HemisphereLight(0xddeeff, 0x1a2228, 0.75);
scene.add(hemiLight);

const sunLight = new THREE.DirectionalLight(0xffffff, 0.95);
sunLight.position.set(25, 45, 25);
sunLight.castShadow = true;
sunLight.shadow.mapSize.set(2048, 2048);
scene.add(sunLight);

const flashLight = new THREE.SpotLight(0xfff9c4, 0, 38, Math.PI / 5, 0.35, 1);
scene.add(flashLight);
scene.add(flashLight.target);

let inRaid = false;
let backpackOpen = false;
let player = null;
let mapObjects = [];
let obstacles = [];
let chests = [];
let enemies = [];
let bullets = [];
const extractZones = [new THREE.Vector3(44, 0.05, -44), new THREE.Vector3(-44, 0.05, -42)];

function toggleBackpack(forceState) {
  backpackOpen = forceState !== undefined ? forceState : !backpackOpen;
  document.getElementById('backpack-modal').style.display = backpackOpen ? 'flex' : 'none';
  if (backpackOpen && player) renderBackpack(player);
}
document.getElementById('btn-close-bp').addEventListener('click', () => toggleBackpack(false));

function clearWorld() {
  mapObjects.forEach(obj => scene.remove(obj));
  chests.forEach(c => scene.remove(c.mesh));
  enemies.forEach(e => scene.remove(e.mesh.group));
  bullets.forEach(b => scene.remove(b.mesh));
  if (player) scene.remove(player.mesh.group);
  mapObjects = []; obstacles = []; chests = []; enemies = []; bullets = [];
}

function addBox(x, z, w, h, d, color) {
  const mesh = new THREE.Mesh(
    new THREE.BoxGeometry(w, h, d),
    new THREE.MeshStandardMaterial({ color, roughness: 0.75 })
  );
  mesh.position.set(x, h / 2, z);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  scene.add(mesh);
  mapObjects.push(mesh);
  obstacles.push({ minX: x - w / 2, maxX: x + w / 2, minZ: z - d / 2, maxZ: z + d / 2 });
}

function startRaid() {
  const wIdx = parseInt(document.getElementById('sel-weapon').value);
  const aTier = parseInt(document.getElementById('sel-armor').value);
  const skinHex = parseInt(document.getElementById('sel-skin').value);
  const mapKey = document.getElementById('sel-map').value;

  const wCfg = WEAPONS[wIdx];
  const aCfg = ARMORS.find(a => a.tier === aTier);

  if (!saveData.unlockedWeapons.includes(wIdx)) {
    if (saveData.cash < wCfg.price) return alert("Insufficient Roubles for weapon!");
    saveData.cash -= wCfg.price;
    saveData.unlockedWeapons.push(wIdx);
  }
  if (!saveData.unlockedArmors.includes(aTier)) {
    if (saveData.cash < aCfg.price) return alert("Insufficient Roubles for armor!");
    saveData.cash -= aCfg.price;
    saveData.unlockedArmors.push(aTier);
  }
  writeSave(saveData);
  clearWorld();

  const mData = MAPS[mapKey];
  scene.background = new THREE.Color(mData.bg);
  scene.fog = new THREE.Fog(mData.fog, mData.isNight ? 18 : 32, mData.isNight ? 55 : 90);
  hemiLight.intensity = mData.isNight ? 0.18 : 0.75;
  sunLight.intensity = mData.isNight ? 0.1 : 0.95;
  flashLight.intensity = mData.isNight ? 2.8 : 0;

  const ground = new THREE.Mesh(
    new THREE.PlaneGeometry(120, 120),
    new THREE.MeshStandardMaterial({ color: mData.ground, roughness: 0.9 })
  );
  ground.rotation.x = -Math.PI / 2;
  ground.receiveShadow = true;
  scene.add(ground);
  mapObjects.push(ground);

  const grid = new THREE.GridHelper(120, 60, 0x37474f, 0x1f292e);
  scene.add(grid);
  mapObjects.push(grid);

  addBox(0, -60, 120, 4, 2, 0x1c252b);
  addBox(0, 60, 120, 4, 2, 0x1c252b);
  addBox(-60, 0, 2, 4, 120, 0x1c252b);
  addBox(60, 0, 2, 4, 120, 0x1c252b);
  mData.structures.forEach(s => addBox(...s));

  extractZones.forEach(pos => {
    const ring = new THREE.Mesh(
      new THREE.CylinderGeometry(4, 4, 0.12, 32),
      new THREE.MeshBasicMaterial({ color: 0x2ecc71, transparent: true, opacity: 0.35 })
    );
    ring.position.copy(pos);
    scene.add(ring);
    mapObjects.push(ring);
  });

  const duckMesh = createDuckModel(skinHex, aTier, wIdx, false);
  player = {
    mesh: duckMesh,
    pos: new THREE.Vector3(0, 0, 44),
    hp: 100, maxHp: 100,
    armor: aCfg.ap, maxArmor: aCfg.ap, armorTier: aTier, absorb: aCfg.absorb,
    stamina: 100,
    weaponIdx: wIdx, ammo: wCfg.mag,
    medkits: saveData.medkits, plates: saveData.plates,
    backpack: [], killCash: 0, kills: 0,
    lastShot: 0, isAiming: false, rollTimer: 0, extractTimer: 0
  };
  player.mesh.group.position.copy(player.pos);
  scene.add(player.mesh.group);

  mData.chests.forEach(([x, z, rare]) => {
    const mesh = createChestMesh(rare);
    mesh.position.set(x, 0.42, z);
    scene.add(mesh);
    chests.push({ mesh, pos: new THREE.Vector3(x, 0, z), opened: false });
  });

  mData.enemies.forEach(([x, z, isBoss]) => {
    const em = createDuckModel(isBoss ? 0xc0392b : 0x7f8c8d, isBoss ? 3 : 1, isBoss ? 3 : 0, true);
    if (isBoss) em.group.scale.set(1.3, 1.3, 1.3);
    em.group.position.set(x, 0, z);
    scene.add(em.group);
    enemies.push({
      mesh: em, pos: new THREE.Vector3(x, 0, z),
      hp: isBoss ? 220 : 85, lastShot: 0,
      angle: Math.random() * Math.PI * 2, isBoss
    });
  });

  document.getElementById('loot-feed').innerHTML = '';
  document.getElementById('menu-screen').style.display = 'none';
  document.getElementById('hud').style.display = 'block';
  toggleBackpack(false);
  inRaid = true;
  updateHUD(player);
}

document.getElementById('btn-deploy').addEventListener('click', startRaid);

const keys = {};
const mouse = new THREE.Vector2();
const raycaster = new THREE.Raycaster();
const aimPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), -0.9);
const aimPoint = new THREE.Vector3();
let firing = false;

window.addEventListener('keydown', e => {
  keys[e.code] = true;
  if (!inRaid) return;

  if (e.code === 'Tab' || e.code === 'KeyI') {
    e.preventDefault();
    toggleBackpack();
  }
  if (e.code === 'ShiftLeft' || e.code === 'ShiftRight') {
    player.isAiming = !player.isAiming;
  }
  if (e.code === 'KeyR') {
    player.ammo = WEAPONS[player.weaponIdx].mag;
    playSound(320, 'triangle', 0.15, 0.08);
  }
  if (e.code === 'Space' && player.rollTimer <= 0 && player.stamina >= 35) {
    player.rollTimer = 0.34;
    player.stamina -= 35;
    playSound(180, 'sine', 0.2, 0.1);
  }
  if (e.code === 'KeyE') {
    chests.forEach(c => {
      if (!c.opened && c.pos.distanceTo(player.pos) < 2.8) {
        const item = LOOT_ITEMS[Math.floor(Math.random() * LOOT_ITEMS.length)];
        if (addItemToBackpack(player, item)) {
          c.opened = true;
          c.mesh.material.color.setHex(0x1c252b);
          playSound(520, 'sine', 0.18, 0.12);
        }
      }
    });
  }
  if (e.code === 'Digit1' && player.medkits > 0 && player.hp < player.maxHp) {
    player.medkits--;
    player.hp = Math.min(player.maxHp, player.hp + 50);
    playSound(440, 'sine', 0.2, 0.1);
    addLootFeed("Used Quick Medkit (+50 HP)");
  }
  if (e.code === 'Digit2' && player.plates > 0 && player.armor < player.maxArmor) {
    player.plates--;
    player.armor = Math.min(player.maxArmor, player.armor + 50);
    playSound(360, 'triangle', 0.2, 0.1);
    addLootFeed("Used Quick Armor Plate (+50 AP)");
  }
});

window.addEventListener('keyup', e => keys[e.code] = false);
window.addEventListener('mousemove', e => {
  mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
  mouse.y = -(e.clientY / window.innerHeight) * 2 + 1;
});
window.addEventListener('mousedown', e => {
  if (backpackOpen) return;
  if (e.button === 0) firing = true;
  if (e.button === 2 && player) player.isAiming = true;
});
window.addEventListener('mouseup', e => {
  if (e.button === 0) firing = false;
  if (e.button === 2 && player) player.isAiming = false;
});
window.addEventListener('contextmenu', e => e.preventDefault());

function hitsWall(pos, r = 0.65) {
Use code with caution.
return obstacles.some(o => pos.x + r > o.minX && pos.x - r < o.maxX && pos.z + r > o.minZ && pos.z - r < o.maxZ);
}
function spawnBullet(origin, dir, speed, dmg, fromPlayer) {
const mesh = new THREE.Mesh(
new THREE.SphereGeometry(0.13, 6, 6),
new THREE.MeshBasicMaterial({ color: fromPlayer ? 0xffeb3b : 0xff5252 })
);
mesh.position.copy(origin).add(new THREE.Vector3(0, 0.9, 0));
scene.add(mesh);
bullets.push({ mesh, dir, speed, dmg, fromPlayer, life: 1.6 });
}
function endRaid(extracted) {
inRaid = false;
firing = false;
toggleBackpack(false);
document.getElementById('hud').style.display = 'none';
document.getElementById('menu-screen').style.display = 'flex';
saveData.medkits = player.medkits;
saveData.plates = player.plates;
if (extracted) {
saveData.cash += player.killCash;
saveData.extracts += 1;
saveData.kills += player.kills;
const spaceLeft = 12 - saveData.stash.length;
const savedItems = player.backpack.slice(0, spaceLeft);
saveData.stash.push(...savedItems);
writeSave(saveData);
alert(EXTRACTED! Banked $${player.killCash.toLocaleString()} bounty + ${savedItems.length} items moved to Stash!);
} else {
writeSave(saveData);
alert(KIA! You lost all items in your backpack.);
}
refreshMenuUI(saveData, () => writeSave(saveData));
}
const clock = new THREE.Clock();
const radarCanvas = document.getElementById('radar');
function animate() {
requestAnimationFrame(animate);
const dt = Math.min(clock.getDelta(), 0.1);
const now = performance.now();
if (!inRaid || !player) {
renderer.render(scene, camera);
return;
}
player.stamina = Math.min(100, player.stamina + 18 * dt);
let mx = 0, mz = 0;
if (keys['KeyW']) mz -= 1;
if (keys['KeyS']) mz += 1;
if (keys['KeyA']) mx -= 1;
if (keys['KeyD']) mx += 1;
const w = WEAPONS[player.weaponIdx];
let spd = 7.5 * w.moveMult;
if (player.isAiming) spd *= 0.62;
if (player.rollTimer > 0) {
spd *= 2.15;
player.rollTimer -= dt;
player.mesh.group.rotation.x += dt * 18;
} else {
player.mesh.group.rotation.x = 0;
}
const moveVec = new THREE.Vector3(mx, 0, mz).normalize();
const nextPos = player.pos.clone().addScaledVector(moveVec, spd * dt);
if (!hitsWall(nextPos)) player.pos.copy(nextPos);
player.mesh.group.position.copy(player.pos);
raycaster.setFromCamera(mouse, camera);
raycaster.ray.intersectPlane(aimPlane, aimPoint);
const lookVec = aimPoint.clone().sub(player.pos);
lookVec.y = 0;
if (lookVec.lengthSq() > 0.01) {
player.mesh.group.rotation.y = Math.atan2(lookVec.x, lookVec.z);
}
flashLight.position.copy(player.pos).add(new THREE.Vector3(0, 1.4, 0));
flashLight.target.position.copy(player.pos).add(lookVec.clone().normalize().multiplyScalar(10));
if (firing && !backpackOpen && now - player.lastShot > w.rate && player.ammo > 0) {
player.lastShot = now;
player.ammo--;
playSound(140, 'sawtooth', 0.08, 0.09);
const shotDir = lookVec.clone().normalize();
shotDir.x += (Math.random() - 0.5) * w.spread;
shotDir.z += (Math.random() - 0.5) * w.spread;
shotDir.normalize();
spawnBullet(player.pos, shotDir, w.speed, w.dmg, true);
}
const nearChest = chests.some(c => !c.opened && c.pos.distanceTo(player.pos) < 2.8);
document.getElementById('prompt-text').style.display = nearChest ? 'block' : 'none';
enemies.forEach(en => {
if (en.hp <= 0) return;
const d = en.pos.distanceTo(player.pos);
if (d < 22) {
const toP = player.pos.clone().sub(en.pos).normalize();
en.mesh.group.rotation.y = Math.atan2(toP.x, toP.z);
if (d > 8) {
const step = en.pos.clone().addScaledVector(toP, (en.isBoss ? 4.4 : 3.8) * dt);
if (!hitsWall(step)) en.pos.copy(step);
}
if (now - en.lastShot > (en.isBoss ? 420 : 880)) {
en.lastShot = now;
playSound(110, 'square', 0.07, 0.04);
spawnBullet(en.pos, toP, 32, en.isBoss ? 22 : 12, false);
}
} else {
en.angle += dt * 0.55;
const pStep = new THREE.Vector3(Math.cos(en.angle), 0, Math.sin(en.angle));
const nextEn = en.pos.clone().addScaledVector(pStep, 2.2 * dt);
if (!hitsWall(nextEn)) en.pos.copy(nextEn);
en.mesh.group.rotation.y = Math.atan2(pStep.x, pStep.z);
}
en.mesh.group.position.copy(en.pos);
});
for (let i = bullets.length - 1; i >= 0; i--) {
const b = bullets[i];
b.mesh.position.addScaledVector(b.dir, b.speed * dt);
b.life -= dt;
let hit = hitsWall(b.mesh.position, 0.15);
if (!hit && b.fromPlayer) {
enemies.forEach(en => {
if (en.hp > 0 && en.pos.distanceTo(b.mesh.position) < 0.95) {
en.hp -= b.dmg;
hit = true;
playSound(600, 'sine', 0.05, 0.07);
if (en.hp <= 0) {
scene.remove(en.mesh.group);
player.kills++;
const reward = en.isBoss ? 5500 : 950;
player.killCash += reward;
addLootFeed(en.isBoss ? Boss Killa-Duck Down (+$${reward}) : Scav Eliminated (+$${reward}));
}
}
});
} else if (!hit && !b.fromPlayer && player.rollTimer <= 0) {
if (player.pos.distanceTo(b.mesh.position) < 0.85) {
hit = true;
playSound(90, 'sawtooth', 0.12, 0.12);
if (player.armor > 0) {
const absorbed = Math.min(player.armor, b.dmg * player.absorb);
player.armor -= absorbed;
player.hp -= (b.dmg - absorbed);
} else {
player.hp -= b.dmg;
}
if (player.hp <= 0) return endRaid(false);
}
}
if (hit || b.life <= 0) {
scene.remove(b.mesh);
bullets.splice(i, 1);
}
}
const alertBox = document.getElementById('center-alert');
if (extractZones.some(ez => ez.distanceTo(player.pos) < 4.0)) {
player.extractTimer += dt;
alertBox.style.display = 'block';
alertBox.style.color = '#2ecc71';
alertBox.innerText = EXTRACTING IN ${(5 - player.extractTimer).toFixed(1)}s...;
if (player.extractTimer >= 5.0) return endRaid(true);
} else {
player.extractTimer = 0;
alertBox.style.display = 'none';
}
const targetFov = player.isAiming ? w.fov : 50;
camera.fov += (targetFov - camera.fov) * 10 * dt;
camera.updateProjectionMatrix();
const zoomShift = player.isAiming ? lookVec.clone().clampLength(0, 5.5) : new THREE.Vector3();
const targetCam = new THREE.Vector3(player.pos.x + zoomShift.x, 19, player.pos.z + 15 + zoomShift.z);
camera.position.lerp(targetCam, 8 * dt);
camera.lookAt(player.pos.x + zoomShift.x, 0.8, player.pos.z + zoomShift.z);
updateHUD(player);
drawRadar(radarCanvas, player, extractZones, chests, enemies);
renderer.render(scene, camera);
}
animate();
