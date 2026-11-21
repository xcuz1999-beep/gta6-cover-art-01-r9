// Fixed scenes for the entry screenshots, driven by the ?shot= query string.
//   ?shot=editor  the studio with a demo scene loaded (the default showcase state)
//   ?shot=cover   the exported cover alone, filling the frame
// Optional params: layout, grade, title, subtitle, badge, stars, w, h (export size
// the cover canvas is rendered at before the page scales it into the frame).
// window.__shotReady flips true once the scene has painted two frames.

export const SAMPLES = [
  { id: 'boulevard', label: 'Sunset Boulevard', src: 'assets/boulevard.jpg' },
  { id: 'pier', label: 'Neon Pier', src: 'assets/pier.jpg' },
  { id: 'beach', label: 'Beach Aerial', src: 'assets/beach.jpg' },
];

export function sampleSrc(id) {
  const found = SAMPLES.find((s) => s.id === id);
  return (found || SAMPLES[0]).src;
}

export async function runShot(query, apply) {
  const shot = query.get('shot');
  if (shot === 'cover') document.body.classList.add('shot-cover');
  await apply({
    layout: query.get('layout') || undefined,
    grade: query.get('grade') || undefined,
    title: query.get('title') || undefined,
    subtitle: query.get('subtitle') || undefined,
    badge: query.get('badge') || undefined,
    stars: query.get('stars') ? Number(query.get('stars')) : undefined,
    w: query.get('w') ? Number(query.get('w')) : undefined,
    h: query.get('h') ? Number(query.get('h')) : undefined,
    photo: query.get('photo') || undefined,
  });
  requestAnimationFrame(() => requestAnimationFrame(() => { window.__shotReady = true; }));
}
