import React, { useState, useEffect } from 'react';
import { CAMPAIGN_OBJECTIVE_CATEGORIES } from '@/types/campaigns';
import type { CampaignObjective } from '@/types/campaigns';

interface ObjectivePickerProps {
  value: CampaignObjective | null;
  onChange: (objective: CampaignObjective) => void;
}

export const ObjectivePicker: React.FC<ObjectivePickerProps> = ({ value, onChange }) => {
  // Auto-select category that contains the current value
  const findCategory = (v: CampaignObjective | null) => {
    if (!v) return CAMPAIGN_OBJECTIVE_CATEGORIES[0].key;
    for (const cat of CAMPAIGN_OBJECTIVE_CATEGORIES) {
      if (cat.options.some((o) => o.value === v)) return cat.key;
    }
    return CAMPAIGN_OBJECTIVE_CATEGORIES[0].key;
  };

  const [selectedCategory, setSelectedCategory] = useState(() => findCategory(value));

  useEffect(() => {
    setSelectedCategory(findCategory(value));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  const currentCategoryData = CAMPAIGN_OBJECTIVE_CATEGORIES.find((c) => c.key === selectedCategory)
    ?? CAMPAIGN_OBJECTIVE_CATEGORIES[0];

  return (
    <div className="flex border border-zinc-700 rounded-xl overflow-hidden min-h-[200px]">
      {/* Left: Category list */}
      <div className="w-44 flex-shrink-0 bg-zinc-800/60 p-2 space-y-1 border-r border-zinc-700">
        {CAMPAIGN_OBJECTIVE_CATEGORIES.map((cat) => {
          const isActive = cat.key === selectedCategory;
          return (
            <button
              key={cat.key}
              type="button"
              onClick={() => setSelectedCategory(cat.key)}
              className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                isActive
                  ? 'bg-zinc-700 text-white font-semibold border-l-2 border-orange-400 pl-[10px]'
                  : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-700/50'
              }`}
            >
              {cat.label}
            </button>
          );
        })}
      </div>

      {/* Right: Options */}
      <div className="flex-1 bg-zinc-900/50 p-4 space-y-3">
        <p className="text-xs text-zinc-500 uppercase tracking-wide font-medium mb-3">
          {currentCategoryData.label}
        </p>
        {currentCategoryData.options.map((opt) => {
          const isSelected = value === opt.value;
          return (
            <button
              key={opt.value}
              type="button"
              onClick={() => onChange(opt.value)}
              className={`w-full text-left p-3 rounded-lg border transition-all ${
                isSelected
                  ? 'border-orange-500 bg-orange-500/10 ring-1 ring-orange-500/50'
                  : 'border-zinc-700 hover:border-zinc-500 bg-zinc-900/30'
              }`}
              role="radio"
              aria-checked={isSelected}
            >
              <div className="flex items-center gap-2">
                <span className={`w-3.5 h-3.5 rounded-full border-2 flex-shrink-0 transition-colors ${
                  isSelected ? 'border-orange-400 bg-orange-400' : 'border-zinc-500'
                }`} />
                <div>
                  <p className="text-sm font-medium text-zinc-200">{opt.label}</p>
                  <p className="text-xs text-zinc-500 mt-0.5">{opt.description}</p>
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};
