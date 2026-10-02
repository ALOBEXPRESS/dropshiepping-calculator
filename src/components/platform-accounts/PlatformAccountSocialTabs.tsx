import React from 'react';
import {
  TikTokLogo,
  GoogleLogo,
  InstagramLogo,
  FacebookLogo,
  ThreadsLogo,
} from '@/components/ui/PlatformLogos';

export interface SocialCounts {
  all: number;
  tiktok: number;
  instagram: number;
  facebook: number;
  threads: number;
  google: number;
}

interface PlatformAccountSocialTabsProps {
  selectedTab: string;
  onSelectTab: (tabId: string) => void;
  counts: SocialCounts;
}

const TAB_CONFIGS = [
  {
    id: 'all',
    label: 'Todas as Redes',
    Icon: null,
    activeClass: 'bg-zinc-800 border-zinc-600 text-white shadow-md ring-1 ring-white/10',
  },
  {
    id: 'tiktok',
    label: 'TikTok',
    Icon: TikTokLogo,
    activeClass: 'bg-zinc-900 border-cyan-500/60 text-cyan-300 shadow-md ring-1 ring-cyan-500/20',
  },
  {
    id: 'instagram',
    label: 'Instagram',
    Icon: InstagramLogo,
    activeClass: 'bg-pink-950/70 border-pink-500/60 text-pink-300 shadow-md ring-1 ring-pink-500/20',
  },
  {
    id: 'facebook',
    label: 'Facebook',
    Icon: FacebookLogo,
    activeClass: 'bg-blue-950/70 border-blue-500/60 text-blue-300 shadow-md ring-1 ring-blue-500/20',
  },
  {
    id: 'threads',
    label: 'Threads',
    Icon: ThreadsLogo,
    activeClass: 'bg-zinc-800 border-zinc-500 text-zinc-100 shadow-md ring-1 ring-white/10',
  },
  {
    id: 'google',
    label: 'Google',
    Icon: GoogleLogo,
    activeClass: 'bg-amber-950/70 border-amber-500/60 text-amber-300 shadow-md ring-1 ring-amber-500/20',
  },
] as const;

export const PlatformAccountSocialTabs: React.FC<PlatformAccountSocialTabsProps> = React.memo(
  ({ selectedTab, onSelectTab, counts }) => {
    return (
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none" role="tablist">
        {TAB_CONFIGS.map((tab) => {
          const isSelected = selectedTab === tab.id;
          const Icon = tab.Icon;
          const count = counts[tab.id as keyof SocialCounts] ?? 0;

          return (
            <button
              key={tab.id}
              type="button"
              role="tab"
              aria-selected={isSelected}
              onClick={() => onSelectTab(tab.id)}
              className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all border shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand ${
                isSelected
                  ? tab.activeClass
                  : 'bg-zinc-900/60 border-zinc-800 text-zinc-400 hover:text-white hover:bg-zinc-800/80 hover:border-zinc-700'
              }`}
            >
              {Icon && <Icon className="w-3.5 h-3.5 flex-shrink-0" />}
              <span>{tab.label}</span>
              <span
                className={`px-1.5 py-0.5 rounded-full text-[10px] font-mono leading-none transition-colors ${
                  isSelected ? 'bg-white/20 text-white' : 'bg-zinc-800 text-zinc-500'
                }`}
              >
                {count}
              </span>
            </button>
          );
        })}
      </div>
    );
  }
);

PlatformAccountSocialTabs.displayName = 'PlatformAccountSocialTabs';
