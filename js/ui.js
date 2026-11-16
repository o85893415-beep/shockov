import { WEAPONS, ARMORS, SKINS } from './config.js';
import { getBackpackValue, renderBunkerStash } from './inventory.js';

export function populateMenus() {
  const wSel = document.getElementById('sel-weapon');
  WEAPONS.forEach((w, idx) => {
    const opt = document.createElement('option');
    opt.value = idx;
    opt.textContent = `${w.name} (${w.scope}) - ${w.price === 0 ? 'Free' : '$' + w.price}`;
    wSel.appendChild(opt);
  });

  const aSel = document.getElementById('sel-armor');
  ARMORS.forEach(a => {
    const opt = document.createElement('option');
    opt.value = a.tier;
    opt.textContent = `${a.name} (${a.ap} AP) - ${a.price === 0 ? 'Free' : '$' + a.price}`;
    aSel.appendChild(opt);
  });

  const sSel = document.getElementById('sel-skin');
  SKINS.forEach(s => {
    const opt = document.createElement('option');
    opt.value = s.hex;
    opt.textContent = `Skin: ${s.name}`;
    sSel.appendChild(opt);
  });
}

export function refreshMenuUI(saveData, onSaveCallback) {
  document.getElementById('menu-cash').innerText = `$${saveData.cash.toLocaleString()}`;
  document.getElementById('menu-extracts').innerText = saveData.extracts;
  document.getElementById('menu-kills').innerText = saveData.kills;

  const wIdx = parseInt(document.getElementById('sel-weapon').value);
  const w = WEAPONS[wIdx];
  const ownedW = saveData.unlockedWeapons.includes(wIdx);
  document.getElementById('weapon-stats').innerText =
    `DMG: ${w.dmg} | Mag: ${w.mag} | Zoom FOV: ${w.fov}° | Status: ${ownedW ? 'UNLOCKED' : 'Buy for $' + w.price}`;

  const aTier = parseInt(document.getElementById('sel-armor').value);
  const a = ARMORS.find(item => item.tier === aTier);
  const ownedA = saveData.unlockedArmors.includes(aTier);
  document.getElementById('armor-stats').innerText =
    `Protection: ${Math.round(a.absorb * 100)}% | Durability: ${a.ap} AP | Status: ${ownedA ? 'UNLOCKED' : 'Buy for $' + a.price}`;

  renderBunkerStash(saveData, () => {
    if (onSaveCallback) onSaveCallback();
    refreshMenuUI(saveData, onSaveCallback);
  });
}

export function updateHUD(player) {
  const w = WEAPONS[player.weaponIdx];
  document.getElementById('hud-hp').innerText = Math.ceil(player.hp);
  document.getElementById('hp-fill').style.width = `${(player.hp / player.maxHp) * 100}%`;
  document.getElementById('hud-tier').innerText = player.armorTier;
  document.getElementById('hud-armor').innerText = Math.ceil(player.armor);
  document.getElementById('armor-fill').style.width = `${(player.armor / player.maxArmor) * 100}%`;
  document.getElementById('stamina-fill').style.width = `${player.stamina}%`;
  document.getElementById('hud-weapon-name').innerText = `${w.name} [${w.scope}]`;
  document.getElementById('hud-ammo').innerText = `${player.ammo} / ${w.mag}`;
  document.getElementById('hud-bag').innerText = (player.killCash + getBackpackValue(player.backpack)).toLocaleString();
  document.getElementById('hud-medkits').innerText = player.medkits;
  document.getElementById('hud-plates').innerText = player.plates;
}

export function addLootFeed(text) {
  const feed = document.getElementById('loot-feed');
  const lines = feed.innerHTML.split('</div>').filter(Boolean).slice(0, 4);
  feed.innerHTML = `<div>+ ${text}</div>` + lines.map(l => l + '</div>').join('');
}

export function drawRadar(canvas, player, extractZones, chests, enemies) {
  const ctx = canvas.getContext('2d');
  ctx.clearRect(0, 0, 170, 170);
  const cx = 85, cy = 85, scale = 1.35;

  ctx.strokeStyle = 'rgba(79, 195, 247, 0.22)';
  ctx.beginPath(); ctx.arc(cx, cy, 40, 0, Math.PI * 2); ctx.stroke();
  ctx.beginPath(); ctx.arc(cx, cy, 78, 0, Math.PI * 2); ctx.stroke();

  extractZones.forEach(ez => {
    const dx = (ez.x - player.pos.x) * scale;
    const dz = (ez.z - player.pos.z) * scale;
    if (Math.hypot(dx, dz) < 80) {
      ctx.fillStyle = '#2ecc71';
      ctx.beginPath(); ctx.arc(cx + dx, cy + dz, 5, 0, Math.PI * 2); ctx.fill();
    }
  });

  chests.forEach(c => {
    if (c.opened) return;
    const dx = (c.pos.x - player.pos.x) * scale;
    const dz = (c.pos.z - player.pos.z) * scale;
    if (Math.hypot(dx, dz) < 80) {
      ctx.fillStyle = '#f1c40f';
      ctx.fillRect(cx + dx - 2.5, cy + dz - 2.5, 5, 5);
    }
  });

  enemies.forEach(e => {
    if (e.hp <= 0) return;
    const dx = (e.pos.x - player.pos.x) * scale;
    const dz = (e.pos.z - player.pos.z) * scale;
    if (Math.hypot(dx, dz) < 80) {
      ctx.fillStyle = e.isBoss ? '#ff1744' : '#ff7043';
      ctx.beginPath(); ctx.arc(cx + dx, cy + dz, e.isBoss ? 5 : 3.5, 0, Math.PI * 2); ctx.fill();
    }
  });

  ctx.fillStyle = '#ffffff';
  ctx.beginPath(); ctx.arc(cx, cy, 4, 0, Math.PI * 2); ctx.fill();
}
