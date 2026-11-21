// Vice Heat cover engine: draws a multi-panel GTA-style poster onto any 2D canvas.
// Pure canvas work — panel crops, a Vice City colour grade, film grain, a vignette,
// heavy system-font lettering, a star heat meter and a badge ribbon. No libraries,
// no network, no font files: lettering uses the system heavy-sans stack only.

export const TITLE_FONT_STACK = '"Arial Black", "Archivo Black", Impact, "Helvetica Neue", Arial, sans-serif';
export const SCRIPT_FONT_STACK = '"Segoe Script", "Brush Script MT", "Comic Sans MS", cursive';
export const BODY_FONT_STACK = 'system-ui, "Helvetica Neue", Arial, sans-serif';

export const LAYOUTS = {
  grid4: {
    label: 'Grid — four panels',
    rects: [
      [0, 0, 0.5, 0.52], [0.5, 0, 0.5, 0.52],
      [0, 0.52, 0.5, 0.48], [0.5, 0.52, 0.5, 0.48],
    ],
  },
  hero: {
    label: 'Hero + two panels',
    rects: [
      [0, 0, 0.6, 1], [0.6, 0, 0.4, 0.5], [0.6, 0.5, 0.4, 0.5],
    ],
  },
  classic6: {
    label: 'Classic — six panels',
    rects: [
      [0, 0, 0.34, 0.5], [0.34, 0, 0.33, 0.5], [0.67, 0, 0.33, 0.5],
      [0, 0.5, 0.34, 0.5], [0.34, 0.5, 0.33, 0.5], [0.67, 0.5, 0.33, 0.5],
    ],
  },
  bleed: {
    label: 'Full bleed — one panel',
    rects: [[0, 0, 1, 1]],
  },
};

export const GRADES = {
  sunset: { label: 'Vice Sunset', top: 'rgba(255,120,80,0.10)', mid: 'rgba(255,60,140,0.16)', foot: 'rgba(30,6,50,0.62)', wash: '#ff7a3c' },
  neon: { label: 'Neon Night', top: 'rgba(30,220,255,0.12)', mid: 'rgba(200,40,220,0.15)', foot: 'rgba(2,4,30,0.66)', wash: '#28d8ff' },
  gold: { label: 'Golden Hour', top: 'rgba(255,190,70,0.14)', mid: 'rgba(255,120,40,0.12)', foot: 'rgba(46,16,4,0.58)', wash: '#ffb347' },
  teal: { label: 'Teal Heat', top: 'rgba(30,220,200,0.12)', mid: 'rgba(255,90,120,0.12)', foot: 'rgba(2,32,36,0.62)', wash: '#2ee6c8' },
};

export function defaultPanels(count) {
  return Array.from({ length: count }, (_, i) => ({ photo: i, zoom: 1, ox: 0.5, oy: 0.5 }));
}

function drawPhotoCover(ctx, img, x, y, w, h, zoom, ox, oy) {
  if (!img || !img.naturalWidth) {
    const g = ctx.createLinearGradient(x, y, x, y + h);
    g.addColorStop(0, '#3a2358');
    g.addColorStop(1, '#12081f');
    ctx.fillStyle = g;
    ctx.fillRect(x, y, w, h);
    return;
  }
  const scale = Math.max(w / img.naturalWidth, h / img.naturalHeight) * Math.max(zoom, 0.2);
  const dw = img.naturalWidth * scale;
  const dh = img.naturalHeight * scale;
  const dx = x + (w - dw) * ox;
  const dy = y + (h - dh) * oy;
  ctx.save();
  ctx.beginPath();
  ctx.rect(x, y, w, h);
  ctx.clip();
  ctx.drawImage(img, dx, dy, dw, dh);
  ctx.restore();
}

function applyGrade(ctx, w, h, grade) {
  const g = GRADES[grade] || GRADES.sunset;
  const grad = ctx.createLinearGradient(0, 0, 0, h);
  grad.addColorStop(0, g.top);
  grad.addColorStop(0.45, g.mid);
  grad.addColorStop(0.78, 'rgba(0,0,0,0)');
  grad.addColorStop(1, g.foot);
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, w, h);
  // warm sun band low in the frame
  const sun = ctx.createRadialGradient(w * 0.72, h * 0.3, 10, w * 0.72, h * 0.3, w * 0.55);
  sun.addColorStop(0, 'rgba(255,190,90,0.20)');
  sun.addColorStop(1, 'rgba(255,190,90,0)');
  ctx.fillStyle = sun;
  ctx.fillRect(0, 0, w, h);
}

function applyGrainAndVignette(ctx, w, h) {
  ctx.save();
  ctx.globalAlpha = 0.05;
  ctx.fillStyle = '#ffffff';
  const step = Math.max(6, Math.round(w / 160));
  let seed = 1234567;
  const rnd = () => { seed = (seed * 1103515245 + 12345) & 0x7fffffff; return seed / 0x7fffffff; };
  for (let y = 0; y < h; y += step) {
    for (let x = 0; x < w; x += step) {
      if (rnd() > 0.5) ctx.fillRect(x, y, 1.4, 1.4);
    }
  }
  ctx.restore();
  const v = ctx.createRadialGradient(w / 2, h / 2, Math.min(w, h) * 0.36, w / 2, h / 2, Math.max(w, h) * 0.74);
  v.addColorStop(0, 'rgba(0,0,0,0)');
  v.addColorStop(1, 'rgba(5,0,14,0.42)');
  ctx.fillStyle = v;
  ctx.fillRect(0, 0, w, h);
}

function fitFontSize(ctx, text, maxWidth, start, weightPrefix) {
  let size = start;
  ctx.font = `${weightPrefix} ${size}px ${TITLE_FONT_STACK}`;
  while (ctx.measureText(text).width > maxWidth && size > 14) {
    size -= 3;
    ctx.font = `${weightPrefix} ${size}px ${TITLE_FONT_STACK}`;
  }
  return size;
}

function drawLettering(ctx, w, h, state) {
  const title = (state.title || '').trim().toUpperCase();
  const sub = (state.subtitle || '').trim();
  ctx.textAlign = 'center';
  ctx.textBaseline = 'alphabetic';
  const titleSize = title ? fitFontSize(ctx, title, w * 0.92, h * 0.115, '900') : 0;
  const titleY = h * 0.965;
  if (sub) {
    // The neon script sits just above the title block, never underneath it.
    ctx.save();
    ctx.font = `${Math.round(h * 0.045)}px ${SCRIPT_FONT_STACK}`;
    ctx.shadowColor = '#ff2e9a';
    ctx.shadowBlur = h * 0.018;
    ctx.fillStyle = '#7df3ff';
    ctx.fillText(sub, w / 2, titleY - titleSize * 1.18);
    ctx.restore();
  }
  if (title) {
    const size = titleSize;
    const y = titleY;
    const grad = ctx.createLinearGradient(0, y - size, 0, y);
    grad.addColorStop(0, '#ffffff');
    grad.addColorStop(0.55, '#ffd9ec');
    grad.addColorStop(1, '#ff9a3c');
    ctx.save();
    ctx.font = `900 ${size}px ${TITLE_FONT_STACK}`;
    ctx.lineWidth = size * 0.16;
    ctx.strokeStyle = '#16051f';
    ctx.shadowColor = 'rgba(0,0,0,0.55)';
    ctx.shadowBlur = size * 0.22;
    ctx.shadowOffsetY = size * 0.06;
    ctx.strokeText(title, w / 2, y);
    ctx.shadowBlur = 0;
    ctx.fillStyle = grad;
    ctx.fillText(title, w / 2, y);
    ctx.restore();
  }
}

function drawStarsAndBadge(ctx, w, h, state) {
  const stars = Math.max(0, Math.min(5, state.stars | 0));
  if (stars > 0) {
    ctx.save();
    ctx.font = `${Math.round(h * 0.042)}px ${TITLE_FONT_STACK}`;
    ctx.textAlign = 'right';
    ctx.shadowColor = '#ffb300';
    ctx.shadowBlur = h * 0.012;
    ctx.fillStyle = '#ffd23c';
    ctx.fillText('★'.repeat(stars), w * 0.965, h * 0.075);
    ctx.restore();
  }
  const badge = (state.badge || '').trim().toUpperCase();
  if (badge) {
    ctx.save();
    ctx.translate(w * 0.085, h * 0.085);
    ctx.rotate(-0.1);
    ctx.font = `900 ${Math.round(h * 0.03)}px ${TITLE_FONT_STACK}`;
    const tw = ctx.measureText(badge).width;
    // Keep the whole ribbon on-canvas even for a long badge: shift the anchor
    // right when half the ribbon would otherwise fall off the left edge.
    const half = tw / 2 + 16;
    if (half > w * 0.085) ctx.translate(half - w * 0.085 + w * 0.012, h * 0.012);
    ctx.fillStyle = '#ff2e7e';
    ctx.fillRect(-tw / 2 - 16, -h * 0.038, tw + 32, h * 0.052);
    ctx.fillStyle = '#ffffff';
    ctx.textAlign = 'center';
    ctx.fillText(badge, 0, 0);
    ctx.restore();
  }
}

// Draws the full cover described by state onto ctx at w x h.
// state: { layout, grade, title, subtitle, badge, stars, panels: [{photo, zoom, ox, oy}] }
// photos: array of loaded images; a panel's photo index cycles through it.
export function drawCover(ctx, w, h, state, photos) {
  ctx.fillStyle = '#170a28';
  ctx.fillRect(0, 0, w, h);
  const layout = LAYOUTS[state.layout] || LAYOUTS.grid4;
  const gutter = Math.max(4, Math.round(w * 0.008));
  layout.rects.forEach((r, i) => {
    const panel = state.panels[i] || { photo: i, zoom: 1, ox: 0.5, oy: 0.5 };
    const img = photos.length ? photos[Math.abs(panel.photo | 0) % photos.length] : null;
    const x = r[0] * w + gutter / 2;
    const y = r[1] * h + gutter / 2;
    const pw = r[2] * w - gutter;
    const ph = r[3] * h - gutter;
    drawPhotoCover(ctx, img, x, y, pw, ph, panel.zoom, panel.ox, panel.oy);
    ctx.save();
    ctx.strokeStyle = 'rgba(255,255,255,0.9)';
    ctx.lineWidth = Math.max(2, w * 0.0035);
    ctx.strokeRect(x, y, pw, ph);
    ctx.restore();
  });
  applyGrade(ctx, w, h, state.grade);
  applyGrainAndVignette(ctx, w, h);
  drawStarsAndBadge(ctx, w, h, state);
  drawLettering(ctx, w, h, state);
}

export function renderCoverCanvas(width, height, state, photos) {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  drawCover(canvas.getContext('2d'), width, height, state, photos);
  return canvas;
}
