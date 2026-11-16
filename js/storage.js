const SAVE_KEY = 'duckov_v2_save';

const DEFAULT_SAVE = {
  cash: 5000,
  extracts: 0,
  kills: 0,
  medkits: 1,
  plates: 1,
  stash: [],
  unlockedWeapons:,
  unlockedArmors: [1]
};

export function loadSave() {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    return raw ? { ...DEFAULT_SAVE, ...JSON.parse(raw) } : { ...DEFAULT_SAVE };
  } catch {
    return { ...DEFAULT_SAVE };
  }
}

export function writeSave(data) {
  localStorage.setItem(SAVE_KEY, JSON.stringify(data));
}

export function resetSave() {
  localStorage.removeItem(SAVE_KEY);
  return { ...DEFAULT_SAVE };
}

const audioCtx = new (window.AudioContext || window.webkitAudioContext)();

export function playSound(freq, type = 'sine', duration = 0.1, vol = 0.1) {
  if (audioCtx.state === 'suspended') audioCtx.resume();
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, audioCtx.currentTime);
  osc.frequency.exponentialRampToValueAtTime(40, audioCtx.currentTime + duration);
  gain.gain.setValueAtTime(vol, audioCtx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + duration);
  osc.connect(gain);
  gain.connect(audioCtx.destination);
  osc.start();
  osc.stop(audioCtx.currentTime + duration);
}
