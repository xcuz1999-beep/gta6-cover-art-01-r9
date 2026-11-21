// Vice Heat — Palmera Cover Studio: page wiring.
// Loads the three built-in procedural demo photos, accepts the visitor's own photos,
// keeps one editable state (layout, grade, per-panel crop, lettering), paints the live
// preview, and exports PNG covers at 1080x1080, 1080x1350 and 1920x1080.
import { LAYOUTS, drawCover, renderCoverCanvas } from './cover.js';
import { SAMPLES, runShot, sampleSrc } from './shots.js';

const canvas = document.getElementById('cover');
const ctx = canvas.getContext('2d');
const status = document.getElementById('status');
const els = {
  layout: document.getElementById('layout'),
  grade: document.getElementById('grade'),
  title: document.getElementById('title'),
  subtitle: document.getElementById('subtitle'),
  badge: document.getElementById('badge'),
  stars: document.getElementById('stars'),
  panelName: document.getElementById('panel-name'),
  panelPhoto: document.getElementById('panel-photo'),
  panelZoom: document.getElementById('panel-zoom'),
  panelOx: document.getElementById('panel-ox'),
  panelOy: document.getElementById('panel-oy'),
  thumbs: document.getElementById('thumbs'),
};

export function loadImage(url) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = url;
  });
}

const photos = [];       // loaded images, demos first
const photoNames = [];   // display name per photo
let selectedPanel = 0;

const state = {
  layout: 'grid4',
  grade: 'sunset',
  title: 'VICE HEAT',
  subtitle: 'Palmera Nights',
  badge: 'Wanted in Palmera',
  stars: 5,
  panels: [],
};

function panelCount() {
  return LAYOUTS[state.layout].rects.length;
}

function ensurePanels() {
  const need = panelCount();
  while (state.panels.length < need) {
    const i = state.panels.length;
    state.panels.push({ photo: i % Math.max(photos.length, 1), zoom: 1, ox: 0.5, oy: 0.5 });
  }
  if (selectedPanel >= need) selectedPanel = 0;
}

function redraw() {
  ensurePanels();
  drawCover(ctx, canvas.width, canvas.height, state, photos);
  syncPanelControls();
}

function syncPanelControls() {
  const panel = state.panels[selectedPanel];
  if (!panel) return;
  els.panelName.textContent = `Panel ${selectedPanel + 1}`;
  els.panelPhoto.innerHTML = '';
  photoNames.forEach((name, i) => {
    const opt = document.createElement('option');
    opt.value = String(i);
    opt.textContent = name;
    els.panelPhoto.appendChild(opt);
  });
  els.panelPhoto.value = String(Math.min(panel.photo, Math.max(photos.length - 1, 0)));
  els.panelZoom.value = String(panel.zoom);
  els.panelOx.value = String(panel.ox);
  els.panelOy.value = String(panel.oy);
}

function buildThumbs() {
  els.thumbs.innerHTML = '';
  SAMPLES.forEach((sample, i) => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.title = sample.label;
    btn.setAttribute('aria-pressed', i === 0 ? 'true' : 'false');
    const img = document.createElement('img');
    img.src = sample.src;
    img.alt = sample.label;
    btn.appendChild(img);
    btn.addEventListener('click', () => {
      state.panels[selectedPanel].photo = i;
      [...els.thumbs.children].forEach((b, j) => b.setAttribute('aria-pressed', j === i ? 'true' : 'false'));
      redraw();
    });
    els.thumbs.appendChild(btn);
  });
}

function exportPng(w, h) {
  const out = renderCoverCanvas(w, h, state, photos);
  out.toBlob((blob) => {
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `vice-heat-cover-${w}x${h}.png`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 4000);
    status.textContent = `Saved vice-heat-cover-${w}x${h}.png`;
  }, 'image/png');
}

// --- control wiring -------------------------------------------------------
els.layout.addEventListener('change', () => { state.layout = els.layout.value; selectedPanel = 0; redraw(); });
els.grade.addEventListener('change', () => { state.grade = els.grade.value; redraw(); });
els.title.addEventListener('input', () => { state.title = els.title.value; redraw(); });
els.subtitle.addEventListener('input', () => { state.subtitle = els.subtitle.value; redraw(); });
els.badge.addEventListener('input', () => { state.badge = els.badge.value; redraw(); });
els.stars.addEventListener('change', () => { state.stars = Number(els.stars.value); redraw(); });
els.panelPhoto.addEventListener('change', () => { state.panels[selectedPanel].photo = Number(els.panelPhoto.value); redraw(); });
els.panelZoom.addEventListener('input', () => { state.panels[selectedPanel].zoom = Number(els.panelZoom.value); redraw(); });
els.panelOx.addEventListener('input', () => { state.panels[selectedPanel].ox = Number(els.panelOx.value); redraw(); });
els.panelOy.addEventListener('input', () => { state.panels[selectedPanel].oy = Number(els.panelOy.value); redraw(); });

document.getElementById('photo-file').addEventListener('change', async (e) => {
  for (const file of e.target.files) {
    const img = await loadImage(URL.createObjectURL(file));
    photos.push(img);
    photoNames.push(file.name);
  }
  if (e.target.files.length) {
    state.panels[selectedPanel].photo = photos.length - 1;
    status.textContent = `${e.target.files.length} photo(s) added — pick any panel to place them.`;
  }
  redraw();
});

document.getElementById('export-square').addEventListener('click', () => exportPng(1080, 1080));
document.getElementById('export-portrait').addEventListener('click', () => exportPng(1080, 1350));
document.getElementById('export-wide').addEventListener('click', () => exportPng(1920, 1080));

// Click a panel to select it; drag on the preview to pan that panel's photo.
canvas.addEventListener('pointerdown', (e) => {
  const rect = canvas.getBoundingClientRect();
  const nx = (e.clientX - rect.left) / rect.width;
  const ny = (e.clientY - rect.top) / rect.height;
  const rects = LAYOUTS[state.layout].rects;
  const hit = rects.findIndex((r) => nx >= r[0] && nx < r[0] + r[2] && ny >= r[1] && ny < r[1] + r[3]);
  if (hit >= 0) selectedPanel = hit;
  const panel = state.panels[selectedPanel];
  const startX = e.clientX;
  const startY = e.clientY;
  const startOx = panel.ox;
  const startOy = panel.oy;
  const move = (ev) => {
    panel.ox = Math.min(1, Math.max(0, startOx - (ev.clientX - startX) / rect.width));
    panel.oy = Math.min(1, Math.max(0, startOy - (ev.clientY - startY) / rect.height));
    redraw();
  };
  const up = () => {
    window.removeEventListener('pointermove', move);
    window.removeEventListener('pointerup', up);
  };
  window.addEventListener('pointermove', move);
  window.addEventListener('pointerup', up);
  redraw();
});

// --- boot: demos first, then the shot scene or the showcase state ---------
async function boot() {
  buildThumbs();
  for (const sample of SAMPLES) {
    photos.push(await loadImage(sample.src));
    photoNames.push(sample.label);
  }
  const query = new URLSearchParams(location.search);
  if (query.get('shot')) {
    await runShot(query, async (scene) => {
      if (scene.layout && LAYOUTS[scene.layout]) { state.layout = scene.layout; els.layout.value = scene.layout; }
      if (scene.grade) { state.grade = scene.grade; els.grade.value = scene.grade; }
      if (scene.title !== undefined) { state.title = scene.title; els.title.value = scene.title; }
      if (scene.subtitle !== undefined) { state.subtitle = scene.subtitle; els.subtitle.value = scene.subtitle; }
      if (scene.badge !== undefined) { state.badge = scene.badge; els.badge.value = scene.badge; }
      if (scene.stars !== undefined) { state.stars = scene.stars; els.stars.value = String(scene.stars); }
      if (scene.photo) {
        const idx = SAMPLES.findIndex((s) => s.id === scene.photo);
        if (idx >= 0) state.panels = state.panels.map((p) => ({ ...p }));
        ensurePanels();
        state.panels[0].photo = idx >= 0 ? idx : 0;
        // Frame the named demo's subject in the hero panel instead of a
        // dead-centre crop (the pier's diner sits left of centre).
        state.panels[0].ox = scene.photo === 'pier' ? 0.3 : 0.5;
        // keep the referenced demo visible: load it explicitly so a missing
        // sample fails loudly instead of painting the placeholder gradient
        await loadImage(sampleSrc(scene.photo));
      }
      if (scene.w && scene.h) { canvas.width = scene.w; canvas.height = scene.h; }
      ensurePanels();
      redraw();
    });
  } else {
    redraw();
  }
}

boot();
