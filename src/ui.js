export const logoMark = (size = 32) => `
  <svg width="${size}" height="${size}" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect width="32" height="32" rx="8" fill="url(#wt-grad)"/>
    <path d="M9 11.5 L16 22 L23 11.5" stroke="white" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
    <circle cx="16" cy="10" r="1.8" fill="white"/>
    <defs>
      <linearGradient id="wt-grad" x1="0" y1="0" x2="32" y2="32" gradientUnits="userSpaceOnUse">
        <stop offset="0" stop-color="#0065FF"/>
        <stop offset="1" stop-color="#0052CC"/>
      </linearGradient>
    </defs>
  </svg>
`;

export const brandWordmark = () => `
  <div class="auth-brand">
    <div class="auth-brand-mark">${logoMark(32)}</div>
    <div class="auth-brand-text">Bilvantis <span class="accent">WatchTower</span></div>
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
