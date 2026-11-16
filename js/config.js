export const WEAPONS = [
  { id: 0, name: "AK-47 Rifle", scope: "2x ACOG", price: 0, dmg: 28, rate: 145, mag: 30, speed: 54, fov: 36, spread: 0.035, moveMult: 1.0, barrelLen: 1.25 },
  { id: 1, name: "MP5 SMG", scope: "1.5x Reflex", price: 1200, dmg: 19, rate: 80, mag: 35, speed: 48, fov: 41, spread: 0.055, moveMult: 1.15, barrelLen: 0.85 },
  { id: 2, name: "VPO-101 Sniper", scope: "4x Marksman", price: 2500, dmg: 88, rate: 680, mag: 10, speed: 85, fov: 21, spread: 0.004, moveMult: 0.92, barrelLen: 1.6 },
  { id: 3, name: "M4A1 Tactical", scope: "2.5x Holo", price: 3800, dmg: 32, rate: 112, mag: 30, speed: 62, fov: 32, spread: 0.02, moveMult: 1.04, barrelLen: 1.15 }
];

export const ARMORS = [
  { tier: 1, name: "Class 1 Light Vest", price: 0, ap: 50, absorb: 0.65, color: 0x546e7a },
  { tier: 2, name: "Class 2 Tactical Rig", price: 1000, ap: 100, absorb: 0.78, color: 0x2e7d32 },
  { tier: 3, name: "Class 3 Juggernaut", price: 2800, ap: 165, absorb: 0.88, color: 0x151515 }
];

export const SKINS = [
  { id: 0, name: "Classic Yellow Duck", hex: 0xf1c40f },
  { id: 1, name: "Mallard Forest Camo", hex: 0x2e7d32 },
  { id: 2, name: "Arctic Spec-Ops", hex: 0xeceff1 },
  { id: 3, name: "Hazard Blaze Orange", hex: 0xe67e22 },
  { id: 4, name: "Night Ops Violet", hex: 0x8e44ad }
];

export const LOOT_ITEMS = [
  { name: "Golden Duck Idol", val: 4500, type: "rare" },
  { name: "Military GPU", val: 2900, type: "rare" },
  { name: "Encrypted Drive", val: 1600, type: "valuables" },
  { name: "Field Medkit", val: 500, type: "medkit" },
  { name: "Armor Plate", val: 600, type: "plate" },
  { name: "Looted M4A1", val: 2200, type: "weapon", weaponId: 3 },
  { name: "Looted VPO Sniper", val: 1800, type: "weapon", weaponId: 2 }
];

export const MAPS = {
  ground_zero: {
    bg: 0x161f27, fog: 0x161f27, ground: 0x263238, isNight: false,
    structures: [
      [-18, -16, 10, 3.2, 3, 0x455a64], [-18, -6, 3, 3.2, 10, 0x455a64],
      [16, -20, 4, 3.5, 12, 0x37474f], [23, -15, 4, 3.5, 10, 0x5d4037],
      [-24, 20, 12, 2.8, 3, 0x4e342e], [14, 18, 7, 1.5, 2, 0x8d6e63],
      [0, -34, 14, 3.5, 3, 0x263238], [-6, 4, 4, 1.6, 4, 0x546e7a]
    ],
    chests: [
      [-15, -12, true], [19, -18, true], [-22, 16, false],
      [14, 15, false], [0, -30, true], [-35, -10, true], [32, 22, false]
    ],
    enemies: [
      [-14, -20, false], [20, -10, false], [-20, 12, false],
      [18, 22, false], [-32, -25, false], [2, -38, true]
    ]
  },
  warehouse: {
    bg: 0x1c1b18, fog: 0x1c1b18, ground: 0x2e2b26, isNight: false,
    structures: [
      [-14, 10, 4, 3.5, 16, 0x4e342e], [14, 10, 4, 3.5, 16, 0x37474f],
      [-14, -15, 4, 3.5, 16, 0x455a64], [14, -15, 4, 3.5, 16, 0x5d4037],
      [0, 0, 6, 2.2, 6, 0x6d4c41], [0, -32, 16, 3.8, 3, 0x263238]
    ],
    chests: [
      [-9, 10, false], [9, 10, true], [-9, -15, true],
      [9, -15, false], [0, -28, true], [26, 0, true]
    ],
    enemies: [
      [-8, 6, false], [8, 6, false], [-8, -18, false],
      [8, -18, false], [0, -36, true], [25, -12, false]
    ]
  },
  night_ops: {
    bg: 0x05080c, fog: 0x05080c, ground: 0x111820, isNight: true,
    structures: [
      [-16, -12, 10, 3.5, 3, 0x1c2833], [16, -18, 4, 3.5, 12, 0x212f3d],
      [-20, 18, 10, 3.0, 3, 0x1c2833], [14, 16, 8, 1.6, 2, 0x34495e],
      [0, -34, 14, 3.8, 3, 0x17202a]
    ],
    chests: [
      [-13, -9, true], [19, -15, true], [-18, 14, true],
      [0, -30, true], [28, 20, true]
    ],
    enemies: [
      [-12, -16, false], [18, -10, false], [-16, 10, false],
      [0, -38, true], [24, 14, false]
    ]
  }
};
