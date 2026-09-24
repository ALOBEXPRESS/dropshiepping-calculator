/**
 * UI Components public barrel
 *
 * Only components that are actively imported in the app are exported here.
 * "Orphan" components (zero consumers in src/) are NOT exported to avoid
 * accidental bundle inclusion. Their files are preserved for reference
 * and may be deleted in a future cleanup sprint.
 *
 * Orphan list (zero consumers as of 2026-09-24):
 *   - AnimatedTabs      (use shadcn tabs.tsx instead)
 *   - AutoplayTabs
 *   - BounceAnimation
 *   - Card3D
 *   - DynamicHoverCard
 *   - FloatingAnimation
 *   - glitch-text
 *   - InteractiveMetric
 *   - LightBar
 *   - MagneticButton
 *   - PageProgressBar
 *   - ProgressBar       (use shadcn progress.tsx instead)
 *   - ScrollCardProgress
 *   - SmoothScroll
 *   - Text3DHover
 */

// ── Actively-used custom components ──────────────────────────────────────────

export { LoadingState } from './LoadingState';
export { AnimatedCard } from './AnimatedCard';
export type { AnimatedCardProps } from './AnimatedCard';
export { GradientButton } from './GradientButton';
export { AnimatedCheckbox } from './AnimatedCheckbox';
export { ExpandableSection } from './ExpandableSection';
export { HoverBlur } from './HoverBlur';
export type { HoverBlurProps } from './HoverBlur';
export { AnimatedGradient } from './AnimatedGradient';
export type { AnimatedGradientProps } from './AnimatedGradient';
export { CopyToClipboard } from './CopyToClipboard';
export type { CopyToClipboardProps } from './CopyToClipboard';
export { CollapsibleSection } from './CollapsibleSection';
