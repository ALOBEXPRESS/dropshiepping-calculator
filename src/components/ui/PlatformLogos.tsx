import React from 'react';

/** TikTok logo SVG — black & white compatible or vibrant multi-color */
export const TikTokLogo: React.FC<{ className?: string; colored?: boolean }> = ({
  className = 'w-5 h-5',
  colored = true,
}) => {
  if (!colored) {
    return (
      <svg viewBox="0 0 48 48" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
        <path
          d="M34.145 13.696a10.26 10.26 0 0 1-2.39-3.56A10.11 10.11 0 0 1 31 6.5h-6.16v21.48a5.55 5.55 0 0 1-1.63 3.92 5.53 5.53 0 0 1-3.93 1.63 5.56 5.56 0 0 1-5.56-5.56 5.56 5.56 0 0 1 5.56-5.56c.58 0 1.14.09 1.67.26v-6.3a11.72 11.72 0 0 0-1.67-.12 11.72 11.72 0 0 0-11.72 11.72A11.72 11.72 0 0 0 19.28 39.7a11.72 11.72 0 0 0 11.72-11.72V16.46a16.32 16.32 0 0 0 9.56 3.08v-6.16a10.27 10.27 0 0 1-6.42.31Z"
          fill="currentColor"
        />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 48 48" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M34.145 13.696a10.26 10.26 0 0 1-2.39-3.56A10.11 10.11 0 0 1 31 6.5h-6.16v21.48a5.55 5.55 0 0 1-1.63 3.92 5.53 5.53 0 0 1-3.93 1.63 5.56 5.56 0 0 1-5.56-5.56 5.56 5.56 0 0 1 5.56-5.56c.58 0 1.14.09 1.67.26v-6.3a11.72 11.72 0 0 0-1.67-.12 11.72 11.72 0 0 0-11.72 11.72A11.72 11.72 0 0 0 19.28 39.7a11.72 11.72 0 0 0 11.72-11.72V16.46a16.32 16.32 0 0 0 9.56 3.08v-6.16a10.27 10.27 0 0 1-6.42.31Z"
        fill="#25F4EE"
        transform="translate(-1.5, -1)"
        opacity="0.95"
      />
      <path
        d="M34.145 13.696a10.26 10.26 0 0 1-2.39-3.56A10.11 10.11 0 0 1 31 6.5h-6.16v21.48a5.55 5.55 0 0 1-1.63 3.92 5.53 5.53 0 0 1-3.93 1.63 5.56 5.56 0 0 1-5.56-5.56 5.56 5.56 0 0 1 5.56-5.56c.58 0 1.14.09 1.67.26v-6.3a11.72 11.72 0 0 0-1.67-.12 11.72 11.72 0 0 0-11.72 11.72A11.72 11.72 0 0 0 19.28 39.7a11.72 11.72 0 0 0 11.72-11.72V16.46a16.32 16.32 0 0 0 9.56 3.08v-6.16a10.27 10.27 0 0 1-6.42.31Z"
        fill="#FE2C55"
        transform="translate(1.5, 1)"
        opacity="0.95"
      />
      <path
        d="M34.145 13.696a10.26 10.26 0 0 1-2.39-3.56A10.11 10.11 0 0 1 31 6.5h-6.16v21.48a5.55 5.55 0 0 1-1.63 3.92 5.53 5.53 0 0 1-3.93 1.63 5.56 5.56 0 0 1-5.56-5.56 5.56 5.56 0 0 1 5.56-5.56c.58 0 1.14.09 1.67.26v-6.3a11.72 11.72 0 0 0-1.67-.12 11.72 11.72 0 0 0-11.72 11.72A11.72 11.72 0 0 0 19.28 39.7a11.72 11.72 0 0 0 11.72-11.72V16.46a16.32 16.32 0 0 0 9.56 3.08v-6.16a10.27 10.27 0 0 1-6.42.31Z"
        fill="#FFFFFF"
      />
    </svg>
  );
};

/** Meta logo SVG (infinity loop) */
export const MetaLogo: React.FC<{ className?: string }> = ({ className = 'w-5 h-5' }) => (
  <svg viewBox="0 0 48 48" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M10.1 15.2c2.3-3.5 5.4-5.7 8.6-5.7 2.5 0 4.7 1.2 6.9 4 1.2 1.5 2.4 3.5 3.7 6l.8 1.6c1.6 3.2 2.7 5.2 3.6 6.3 1.2 1.5 2.3 2.2 3.7 2.2 1.6 0 3-1 4.1-2.8 1.2-2 1.9-4.6 1.9-7.4 0-4-1.2-7.3-3.4-9.6-2.2-2.3-5.3-3.5-9-3.5-4.4 0-8.3 2-11.3 5.5-2.8 3.3-4.6 7.8-4.6 12.7 0 5.2 1.6 9.3 4.5 12.1 2.7 2.6 6.3 3.9 10.4 3.9 1.6 0 3.1-.2 4.5-.6v-4.8c-1.4.5-2.9.7-4.5.7-2.9 0-5.3-1-7-2.9-1.8-2-2.8-5-2.8-8.8 0-3.5 1-6.6 2.7-8.9Zm27.6-5.1c-.8-.1-1.5-.2-2.3-.2-2.5 0-4.8 1.2-6.8 3.5l.9 1.7c.5 1 1 1.9 1.4 2.8 1.3-2.3 3-3.4 5-3.4.6 0 1.2.1 1.8.3v-4.7Z" fill="currentColor" />
  </svg>
);

/** Google "G" logo — simplified */
export const GoogleLogo: React.FC<{ className?: string }> = ({ className = 'w-5 h-5' }) => (
  <svg viewBox="0 0 48 48" className={className} xmlns="http://www.w3.org/2000/svg">
    <path d="M44.5 20H24v8.5h11.8C34.7 33.9 30.1 37 24 37c-7.2 0-13-5.8-13-13s5.8-13 13-13c3.1 0 5.9 1.1 8.1 2.9l6.4-6.4C34.6 4.1 29.6 2 24 2 11.8 2 2 11.8 2 24s9.8 22 22 22c11 0 21-8 21-22 0-1.3-.2-2.7-.5-4Z" fill="#4285F4" />
    <path d="M5.3 14.7l7 5.1C14.1 16.2 18.5 13 24 13c3.1 0 5.9 1.1 8.1 2.9l6.4-6.4C34.6 5.1 29.6 3 24 3 16.3 3 9.7 7.8 5.3 14.7Z" fill="#EA4335" />
    <path d="M24 45c5.4 0 10.3-1.8 14.2-5l-7-5.4c-2 1.4-4.5 2.2-7.2 2.2-6 0-11.1-4-12.9-9.5l-7.1 5.5C7.5 39.4 15 45 24 45Z" fill="#34A853" />
    <path d="M44.5 20H24v8.5h11.8c-1 3.1-3 5.7-5.6 7.3l7 5.4C41.3 37.5 46 31.5 46 24c0-1.3-.2-2.7-.5-4h-1Z" fill="#FBBC05" />
  </svg>
);

/** Instagram gradient logo */
export const InstagramLogo: React.FC<{ className?: string }> = ({ className = 'w-5 h-5' }) => (
  <svg viewBox="0 0 48 48" className={className} xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="ig_grad" x1="0%" y1="100%" x2="100%" y2="0%">
        <stop offset="0%" stopColor="#feda75" />
        <stop offset="25%" stopColor="#fa7e1e" />
        <stop offset="50%" stopColor="#d62976" />
        <stop offset="75%" stopColor="#962fbf" />
        <stop offset="100%" stopColor="#4f5bd5" />
      </linearGradient>
    </defs>
    <rect x="4" y="4" width="40" height="40" rx="11" fill="url(#ig_grad)" />
    <circle cx="24" cy="24" r="9" stroke="white" strokeWidth="3" fill="none" />
    <circle cx="35" cy="13" r="2.5" fill="white" />
  </svg>
);

/** Facebook logo */
export const FacebookLogo: React.FC<{ className?: string }> = ({ className = 'w-5 h-5' }) => (
  <svg viewBox="0 0 48 48" className={className} xmlns="http://www.w3.org/2000/svg">
    <circle cx="24" cy="24" r="22" fill="#1877F2" />
    <path d="M33.2 31l1-6.5h-6.3V21c0-1.8.9-3.5 3.7-3.5H34.5v-5.5s-2.3-.4-4.6-.4c-4.7 0-7.8 2.9-7.8 8v5h-5.2V31h5.2v15.7c1 .2 2.1.3 3.2.3 1.1 0 2.2-.1 3.2-.3V31H33.2Z" fill="white" />
  </svg>
);

/** Threads logo */
export const ThreadsLogo: React.FC<{ className?: string }> = ({ className = 'w-5 h-5' }) => (
  <svg viewBox="0 0 48 48" className={className} xmlns="http://www.w3.org/2000/svg">
    <path d="M33 21.7c-.2-.1-.4-.2-.6-.3-1-5.4-4.5-8.4-9.6-8.5h-.1c-3 0-5.5 1.3-7 3.6l3.3 2.3c1.1-1.6 2.8-2 4-2h.1c1.5 0 2.7.5 3.4 1.3.5.6.9 1.4 1 2.4-1.3-.2-2.7-.3-4.2-.2-5 .3-8.2 3.2-8 7.2.1 2 1 3.8 2.5 5 1.3 1.1 3 1.6 4.8 1.5 2.4-.1 4.3-1.1 5.6-2.9.9-1.3 1.5-3 1.7-5.1.9.6 1.6 1.3 2.1 2.2 .9 1.6 1 4.3-.7 6.5-1.5 1.9-3.3 2.9-6.3 3.1-3.3-.2-5.8-1.3-7.4-3.2-1.5-1.8-2.3-4.4-2.4-7.5.1-3.2.9-5.7 2.4-7.5 1.6-1.9 4.1-3 7.4-3.2 3.3.2 5.9 1.3 7.5 3.3.8 1 1.4 2.2 1.8 3.5l3.5-1c-.5-1.9-1.3-3.5-2.5-4.9-2.2-2.7-5.7-4.2-10.2-4.4h-.2c-4.5.2-8.1 1.8-10.4 4.6-2.1 2.5-3.2 5.7-3.3 9.6.1 3.9 1.2 7.2 3.3 9.6 2.3 2.8 5.9 4.4 10.4 4.6h.2c3.9-.2 6.7-1.6 8.7-4 2.6-3.2 2.5-7.2 1-9.8-.9-1.8-2.6-3.3-4.8-4.2Zm-8.3 10.8c-2 .1-3.6-1-3.6-2.7-.1-1.3.9-2.8 4.5-3 .4 0 .8 0 1.2 0 .9 0 1.8.1 2.6.3-.3 4.2-2.6 5.3-4.7 5.4Z" fill="currentColor" />
  </svg>
);

/** Returns the appropriate logo component for a given platform */
export function getPlatformLogo(platform: string): React.FC<{ className?: string; colored?: boolean }> {
  switch (platform) {
    case 'tiktok': return TikTokLogo;
    case 'meta': return MetaLogo;
    case 'google': return GoogleLogo;
    default: return TikTokLogo;
  }
}

/** Static PlatformLogo component to avoid dynamic component creation in render */
export const PlatformLogo: React.FC<{
  platform?: string | null;
  className?: string;
  colored?: boolean;
}> = ({ platform = 'tiktok', className = 'w-5 h-5', colored = true }) => {
  switch (platform) {
    case 'tiktok':
      return <TikTokLogo className={className} colored={colored} />;
    case 'meta':
      return <MetaLogo className={className} />;
    case 'google':
      return <GoogleLogo className={className} />;
    default:
      return <TikTokLogo className={className} colored={colored} />;
  }
};

/** Returns the appropriate color class for a given platform */
export function getPlatformColor(platform: string): string {
  switch (platform) {
    case 'tiktok': return 'text-cyan-400';
    case 'meta': return 'text-blue-400';
    case 'google': return 'text-yellow-400';
    default: return 'text-purple-400';
  }
}

/** Returns a human-readable label for a platform */
export function getPlatformLabel(platform: string): string {
  switch (platform) {
    case 'tiktok': return 'TikTok';
    case 'meta': return 'Meta';
    case 'google': return 'Google';
    default: return platform;
  }
}

export interface SocialPlatformDetails {
  key: 'tiktok' | 'instagram' | 'facebook' | 'threads' | 'google';
  name: string;
  Logo: React.FC<{ className?: string; colored?: boolean }>;
  badgeBg: string;
  badgeBorder: string;
  badgeText: string;
  badgePill: string;
  tabActiveClass: string;
  avatarBadgeBorder: string;
}

export function getSocialPlatformDetails(
  platform: string,
  metaType?: string | null
): SocialPlatformDetails {
  if (platform === 'tiktok') {
    return {
      key: 'tiktok',
      name: 'TikTok',
      Logo: TikTokLogo,
      badgeBg: 'bg-cyan-500/10',
      badgeBorder: 'border-cyan-500/30',
      badgeText: 'text-cyan-300',
      badgePill: 'bg-zinc-900 border-zinc-700/80 text-zinc-100 shadow-sm hover:border-cyan-500/50',
      tabActiveClass: 'bg-zinc-900 border-cyan-500/50 text-cyan-300 shadow-md',
      avatarBadgeBorder: 'border-cyan-500/50',
    };
  }

  if (platform === 'meta') {
    if (metaType === 'facebook') {
      return {
        key: 'facebook',
        name: 'Facebook',
        Logo: FacebookLogo,
        badgeBg: 'bg-blue-500/10',
        badgeBorder: 'border-blue-500/30',
        badgeText: 'text-blue-300',
        badgePill: 'bg-blue-950/40 border-blue-500/30 text-blue-300 shadow-sm hover:border-blue-400/60',
        tabActiveClass: 'bg-blue-950/80 border-blue-500 text-blue-300 shadow-md',
        avatarBadgeBorder: 'border-blue-400/50',
      };
    }
    if (metaType === 'threads') {
      return {
        key: 'threads',
        name: 'Threads',
        Logo: ThreadsLogo,
        badgeBg: 'bg-zinc-800',
        badgeBorder: 'border-zinc-700',
        badgeText: 'text-zinc-200',
        badgePill: 'bg-zinc-900 border-zinc-700 text-zinc-200 shadow-sm hover:border-zinc-500',
        tabActiveClass: 'bg-zinc-800 border-zinc-500 text-white shadow-md',
        avatarBadgeBorder: 'border-zinc-500/50',
      };
    }
    return {
      key: 'instagram',
      name: 'Instagram',
      Logo: InstagramLogo,
      badgeBg: 'bg-pink-500/10',
      badgeBorder: 'border-pink-500/30',
      badgeText: 'text-pink-300',
      badgePill: 'bg-pink-950/30 border-pink-500/30 text-pink-300 shadow-sm hover:border-pink-400/60',
      tabActiveClass: 'bg-pink-950/80 border-pink-500 text-pink-300 shadow-md',
      avatarBadgeBorder: 'border-pink-400/50',
    };
  }

  if (platform === 'google') {
    return {
      key: 'google',
      name: 'Google',
      Logo: GoogleLogo,
      badgeBg: 'bg-amber-500/10',
      badgeBorder: 'border-amber-500/30',
      badgeText: 'text-amber-300',
      badgePill: 'bg-amber-950/30 border-amber-500/30 text-amber-300 shadow-sm hover:border-amber-400/60',
      tabActiveClass: 'bg-amber-950/80 border-amber-500 text-amber-300 shadow-md',
      avatarBadgeBorder: 'border-amber-400/50',
    };
  }

  return {
    key: 'tiktok',
    name: 'TikTok',
    Logo: TikTokLogo,
    badgeBg: 'bg-cyan-500/10',
    badgeBorder: 'border-cyan-500/30',
    badgeText: 'text-cyan-300',
    badgePill: 'bg-zinc-900 border-zinc-700/80 text-zinc-100 shadow-sm hover:border-cyan-500/50',
    tabActiveClass: 'bg-zinc-900 border-cyan-500/50 text-cyan-300 shadow-md',
    avatarBadgeBorder: 'border-cyan-500/50',
  };
}
