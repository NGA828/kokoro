/**
 * Deterministic SVG portrait generator.
 *
 * In development (no external image CDN reachable), seed users get colourful
 * gradient avatars with their initials. Production seeds/real users upload
 * real photos via Cloudinary — these SVGs are just pleasing placeholders that
 * are stored locally and served by the backend at /media/avatars.
 */

const PALETTES: [string, string][] = [
  ['#ff3d8f', '#8b4dff'],
  ['#e049c9', '#5b8cff'],
  ['#ff6f61', '#c92bb0'],
  ['#7b5cff', '#ff3d8f'],
  ['#ff9a3d', '#e049c9'],
  ['#3dd6ff', '#8b4dff'],
  ['#ff5c8a', '#7b2ff7'],
  ['#43e97b', '#38f9d7'],
];

function hashSeed(seed: string): number {
  let h = 0;
  for (let i = 0; i < seed.length; i++) {
    h = (h * 31 + seed.charCodeAt(i)) >>> 0;
  }
  return h;
}

export function generateAvatarSvg(seed: string, name: string): string {
  const h = hashSeed(seed);
  const [c1, c2] = PALETTES[h % PALETTES.length];
  const initials = name
    .split(' ')
    .map((p) => p[0])
    .filter(Boolean)
    .slice(0, 2)
    .join('')
    .toUpperCase();
  const angle = h % 360;
  // Decorative floating orbs for a premium feel.
  const orbs = [0, 1, 2].map((i) => {
    const cx = 80 + ((h >> (i * 3)) % 240);
    const cy = 60 + ((h >> (i * 5 + 1)) % 320);
    const r = 40 + ((h >> (i * 7 + 2)) % 70);
    return `<circle cx="${cx}" cy="${cy}" r="${r}" fill="rgba(255,255,255,0.08)"/>`;
  });
  return `<svg xmlns="http://www.w3.org/2000/svg" width="600" height="800" viewBox="0 0 600 800">
  <defs>
    <linearGradient id="g" gradientTransform="rotate(${angle})">
      <stop offset="0%" stop-color="${c1}"/>
      <stop offset="100%" stop-color="${c2}"/>
    </linearGradient>
    <radialGradient id="v" cx="50%" cy="35%" r="75%">
      <stop offset="0%" stop-color="rgba(255,255,255,0.28)"/>
      <stop offset="100%" stop-color="rgba(255,255,255,0)"/>
    </radialGradient>
  </defs>
  <rect width="600" height="800" fill="url(#g)"/>
  ${orbs.join('')}
  <rect width="600" height="800" fill="url(#v)"/>
  <text x="300" y="430" font-family="Georgia, serif" font-size="220" font-weight="700" fill="rgba(255,255,255,0.92)" text-anchor="middle" dominant-baseline="middle">${initials}</text>
</svg>`;
}
