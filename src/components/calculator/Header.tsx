import React from 'react';
import { Link } from 'react-router-dom';
import logo from '../../imgs/Logonome-alobexpress.png';

interface HeaderProps {
  onLogoClick?: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onLogoClick }) => {
  return (
    <div className="grid md:grid-cols-2 gap-4 items-center mb-8 header-animate">
      <div className="flex justify-center md:justify-start">
         <Link to="/dashboard" onClick={onLogoClick} className="cursor-pointer transition-all hover:opacity-85 hover:scale-[1.02] active:scale-[0.98] inline-block">
           <img 
              src={logo} 
              alt="Alob Express" 
              className="h-12 object-contain" 
           />
         </Link>
      </div>
      <div className="text-center md:text-right">
         <p className="text-gray-300 text-xl font-medium font-iceland">Calculadora de Precificação Dropshipping Nacional <span className="text-sm text-gray-500 font-normal">v3.0.0</span></p>
         <p className="text-sm text-gray-400 mt-1">Taxas reais atualizadas de Marketplaces 2026</p>
      </div>
    </div>
  );
};
