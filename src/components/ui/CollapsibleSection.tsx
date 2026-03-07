import { useState, useRef } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { ChevronDown } from 'lucide-react';
import gsap from 'gsap';

interface CollapsibleSectionProps {
  title: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
  defaultOpen?: boolean;
  className?: string;
}

export const CollapsibleSection = ({ title, icon, children, defaultOpen = false, className = "" }: CollapsibleSectionProps) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  const contentRef = useRef<HTMLDivElement>(null);
  const arrowRef = useRef<SVGSVGElement>(null);

  const toggle = () => {
    const content = contentRef.current;
    const arrow = arrowRef.current;
    
    if (isOpen) {
      gsap.to(content, { height: 0, opacity: 0, duration: 0.3, ease: "power2.out" });
      gsap.to(arrow, { rotation: 0, duration: 0.3, ease: "power2.out" });
    } else {
      gsap.to(content, { height: "auto", opacity: 1, duration: 0.3, ease: "power2.out" });
      gsap.to(arrow, { rotation: 180, duration: 0.3, ease: "power2.out" });
    }
    setIsOpen(!isOpen);
  };

  return (
    <Card className={`mt-8 shadow-xl overflow-hidden backdrop-blur-xl bg-white/95 dark:bg-gray-900/95 border border-white/20 dark:border-gray-700/20 will-change-transform ${className}`}>
      <CardHeader 
        className="cursor-pointer hover:bg-gray-50 dark:hover:bg-zinc-800 transition-colors select-none"
        onClick={toggle}
      >
        <CardTitle className="flex items-center justify-between text-xl font-bold text-gray-800 dark:text-white font-iceland">
          <div className="flex items-center gap-2">
            {icon}
            {title}
          </div>
          <ChevronDown 
            ref={arrowRef} 
            className="w-5 h-5 text-gray-500"
            style={{ transform: defaultOpen ? 'rotate(180deg)' : 'rotate(0deg)' }} 
          />
        </CardTitle>
      </CardHeader>
      <div 
                  ref={contentRef} 
                  className="collapsible-content"
                  style={{ height: defaultOpen ? 'auto' : 0, opacity: defaultOpen ? 1 : 0, overflow: 'hidden' }}
                >
        <CardContent>
          {children}
        </CardContent>
      </div>
    </Card>
  );
};
