import React, { useState, useRef, useEffect } from 'react';
import logo from '../../imgs/Logonome-alobexpress.png';

interface HeaderProps {
  onLogoClick?: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onLogoClick }) => {
  const [isAnimating, setIsAnimating] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleMouseEnter = () => {
    if (isAnimating) return;
    
    setIsAnimating(true);
    
    // Animation lasts 0.3s, set cooldown to 1s
    timeoutRef.current = setTimeout(() => {
      setIsAnimating(false);
    }, 1000);
  };

  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  return (
    <div className="grid md:grid-cols-2 gap-4 items-center mb-8 header-animate">
      <div className="flex justify-center md:justify-start">
         <img 
            src={logo} 
            alt="Alob Express" 
            className={`h-12 object-contain cursor-pointer ${isAnimating ? 'glitch-active' : ''}`} 
            onMouseEnter={handleMouseEnter}
            onClick={onLogoClick || (() => window.location.reload())} 
         />
      </div>
      <div className="text-center md:text-right">
         <p className="text-gray-300 text-xl font-medium font-iceland">Calculadora de Precificação Dropshipping Nacional <span className="text-sm text-gray-500 font-normal">v3.0.0</span></p>
         <p className="text-sm text-gray-400 mt-1">Taxas reais atualizadas de Marketplaces 2026</p>
      </div>
    </div>
  );
};
