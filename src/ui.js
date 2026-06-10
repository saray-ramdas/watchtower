export const logoMark = (size = 32) => `
  <img
    src="/image.png"
    width="${size}"
    height="${size}"
    alt="Bilvantis WatchTower"
    style="display:block;width:${size}px;height:${size}px;object-fit:contain;border-radius:${Math.round(size / 4)}px"
  />
`;

export const brandWordmark = (tagline) => `
  <div class="auth-brand">
    <div class="auth-brand-mark auth-brand-mark-lg">${logoMark(184)}</div>
    <div class="auth-brand-text"><span class="accent">WatchTower</span></div>
    ${tagline ? `<div class="auth-brand-tagline">${tagline}</div>` : ''}
  </div>
`;

export const initials = (name = '') => {
  const parts = name.trim().split(/\s+/);
  if (!parts[0]) return '?';
  if (parts.length === 1) return parts[0][0].toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
};

export const alertIcon = `
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" style="flex-shrink:0;margin-top:1px">
    <circle cx="8" cy="8" r="7" stroke="currentColor" stroke-width="1.5"/>
    <path d="M8 5v3.5M8 11h.01" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
  </svg>
`;
