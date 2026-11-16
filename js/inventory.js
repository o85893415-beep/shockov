import { WEAPONS } from './config.js';
import { playSound } from './storage.js';
import { addLootFeed, updateHUD } from './ui.js';

export const MAX_BACKPACK_SLOTS = 10;

export function getBackpackValue(backpack) {
  return backpack.reduce((sum, item) => sum + item.val, 0);
}

export function addItemToBackpack(player, item) {
  if (player.backpack.length >= MAX_BACKPACK_SLOTS) {
    addLootFeed("Backpack Full! Press [Tab] to drop an item.");
    return false;
  }
  player.backpack.push({ ...item });
  addLootFeed(`Looted ${item.name} ($${item.val})`);
  renderBackpack(player);
  return true;
}

export function renderBackpack(player) {
  const grid = document.getElementById('backpack-grid');
  grid.innerHTML = '';
  document.getElementById('bp-slots').innerText = player.backpack.length;
  document.getElementById('bp-value').innerText = getBackpackValue(player.backpack).toLocaleString();

  player.backpack.forEach((item, idx) => {
    const slot = document.createElement('div');
    slot.className = `grid-slot ${item.type === 'rare' ? 'rare' : item.type === 'weapon' ? 'weapon' : ''}`;
    slot.innerHTML = `<strong>${item.name}</strong><span>$${item.val}</span>`;

    slot.addEventListener('click', () => {
      if (item.type === 'medkit' && player.hp < player.maxHp) {
        player.hp = Math.min(player.maxHp, player.hp + 50);
        player.backpack.splice(idx, 1);
        playSound(440, 'sine', 0.18, 0.1);
        addLootFeed("Used Field Medkit (+50 HP)");
      } else if (item.type === 'plate' && player.armor < player.maxArmor) {
        player.armor = Math.min(player.maxArmor, player.armor + 50);
        player.backpack.splice(idx, 1);
        playSound(360, 'triangle', 0.18, 0.1);
        addLootFeed("Inserted Armor Plate (+50 AP)");
      } else if (item.type === 'weapon') {
        player.weaponIdx = item.weaponId;
        player.ammo = WEAPONS[item.weaponId].mag;
        player.backpack.splice(idx, 1);
        playSound(300, 'square', 0.15, 0.1);
        addLootFeed(`Equipped ${WEAPONS[item.weaponId].name}!`);
      }
      renderBackpack(player);
      updateHUD(player);
    });

    slot.addEventListener('contextmenu', (e) => {
      e.preventDefault();
      const removed = player.backpack.splice(idx, 1);
      addLootFeed(`Dropped ${removed[0].name}`);
      renderBackpack(player);
      updateHUD(player);
    });

    grid.appendChild(slot);
  });
}

export function renderBunkerStash(saveData, onUpdate) {
  const grid = document.getElementById('stash-grid');
  grid.innerHTML = '';
  document.getElementById('stash-count').innerText = saveData.stash.length;

  saveData.stash.forEach((item, idx) => {
    const slot = document.createElement('div');
    slot.className = `grid-slot ${item.type === 'rare' ? 'rare' : item.type === 'weapon' ? 'weapon' : ''}`;
    slot.innerHTML = `<strong>${item.name}</strong><span>Sell $${item.val}</span>`;
    slot.addEventListener('click', () => {
      saveData.cash += item.val;
      if (item.type === 'weapon' && !saveData.unlockedWeapons.includes(item.weaponId)) {
        saveData.unlockedWeapons.push(item.weaponId);
      }
      saveData.stash.splice(idx, 1);
      onUpdate();
    });
    grid.appendChild(slot);
  });
}
