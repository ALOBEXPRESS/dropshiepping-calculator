import React, { useState, useRef, useEffect } from 'react';
import gsap from 'gsap';
import { ChevronDown } from 'lucide-react';

interface ObjectiveGroupSectionProps {
  groupKey: string;
  label: string;
  icon: string;
  color: string;
  borderColor: string;
  count: number;
  custo: number;
  formatBRL: (v: number) => string;
  children: React.ReactNode;
}

export const ObjectiveGroupSection: React.FC<ObjectiveGroupSectionProps> = ({
  label,
  icon,
  color,
  borderColor,
  count,
  custo,
  formatBRL,
  children,
}) => {
  const [open, setOpen] = useState(false);
  const bodyRef = useRef<HTMLDivElement>(null);
  const chevronRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    const bodyEl = bodyRef.current;
    const chevronEl = chevronRef.current;

    if (bodyEl) {
      gsap.set(bodyEl, { height: 0, opacity: 0, overflow: 'hidden' });
    }
    if (chevronEl) {
      gsap.set(chevronEl, { rotation: -90 });
    }
    return () => {
      if (bodyEl) gsap.killTweensOf(bodyEl);
      if (chevronEl) gsap.killTweensOf(chevronEl);
    };
  }, []);

  const toggle = () => {
    const el = bodyRef.current;
    if (!el) {
      setOpen((v) => !v);
      return;
    }
    if (!open) {
      setOpen(true);
      gsap.fromTo(
        el,
        { height: 0, opacity: 0 },
        {
          height: 'auto',
          opacity: 1,
          duration: 0.35,
          ease: 'power2.out',
          onComplete: () => {
            el.style.height = 'auto';
          },
        }
      );
      gsap.to(chevronRef.current, { rotation: 0, duration: 0.3, ease: 'power2.out' });
    } else {
      gsap.to(el, {
        height: 0,
        opacity: 0,
        duration: 0.28,
        ease: 'power2.in',
        onComplete: () => setOpen(false),
      });
      gsap.to(chevronRef.current, { rotation: -90, duration: 0.28, ease: 'power2.in' });
    }
  };

  return (
    <div className="space-y-2">
      <div
        role="button"
        tabIndex={0}
        onClick={toggle}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            toggle();
          }
        }}
        className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl bg-card/50 border ${borderColor} hover:bg-card/80 transition-colors cursor-pointer select-none`}
        aria-expanded={open}
      >
        <span className="text-base">{icon}</span>
        <span className={`text-xs font-semibold uppercase tracking-widest ${color}`}>{label}</span>
        <span className="text-[10px] bg-background text-muted-foreground px-2 py-0.5 rounded-full font-medium">
          {count}
        </span>
        {custo > 0 && (
          <span className="text-xs text-orange-400 font-medium ml-auto mr-2">
            Custo: R$ {formatBRL(custo)}
          </span>
        )}
        <ChevronDown
          ref={chevronRef}
          className={`w-4 h-4 text-muted-foreground ${custo > 0 ? '' : 'ml-auto'}`}
          style={{ transform: 'rotate(-90deg)' }}
        />
      </div>

      <div ref={bodyRef} style={{ overflow: 'hidden' }}>
        {open && <div className="grid gap-3 pt-1">{children}</div>}
      </div>
    </div>
  );
};
