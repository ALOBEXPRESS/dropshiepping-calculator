# Exemplos de Código Completo - Implementação CSS Pack

## 📋 Índice

1. [Login Page - Completo](#login-page)
2. [Product Card - Completo](#product-card)
3. [Dashboard Card - Completo](#dashboard-card)
4. [Form Components - Completo](#form-components)
5. [Hooks Customizados](#custom-hooks)

---

## 🔐 Login Page - Completo

### src/components/Login.tsx

```tsx
'use client';

import { useState } from 'react';
import { motion, useMotionValue, useTransform } from 'framer-motion';
import { Mail, Lock, Loader2, Eye, EyeOff } from 'lucide-react';
import { toast } from 'sonner';
import { z } from 'zod';

// Schema de validação
const loginSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(6, 'Senha deve ter no mínimo 6 caracteres'),
});

export const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);

  // Validação em tempo real
  const validateField = (field: 'email' | 'password', value: string) => {
    try {
      loginSchema.shape[field].parse(value);
      setErrors(prev => ({ ...prev, [field]: '' }));
    } catch (error) {
      if (error instanceof z.ZodError) {
        setErrors(prev => ({ ...prev, [field]: error.errors[0].message }));
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validação completa
    try {
      loginSchema.parse({ email, password });
      setIsLoading(true);
      
      // Simular autenticação
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      toast.success('Login realizado com sucesso!');
      // Redirecionar...
    } catch (error) {
      if (error instanceof z.ZodError) {
        const fieldErrors: Record<string, string> = {};
        error.errors.forEach(err => {
          if (err.path[0]) {
            fieldErrors[err.path[0] as string] = err.message;
          }
        });
        setErrors(fieldErrors);
        toast.error('Verifique os campos e tente novamente');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Formulário - Esquerda */}
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.5 }}
        className="flex-1 flex items-center justify-center p-8 bg-gray-50"
      >
        {/* Card com Efeito Vidro */}
        <div className="
          w-full max-w-md
          backdrop-blur-xl bg-white/80
          border border-white/20
          shadow-[0_8px_32px_rgba(0,0,0,0.1)]
          rounded-2xl p-8
        ">
          {/* Logo com Degradê Animado */}
          <motion.h1
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="
              text-4xl font-bold mb-2
              bg-gradient-to-r from-primary via-pink-500 to-primary
              bg-clip-text text-transparent
              bg-[length:200%_100%]
              animate-gradient
            "
          >
            ALOB EXPRESS
          </motion.h1>
          
          <p className="text-gray-600 mb-8">
            Escolha como você quer entrar na sua conta
          </p>

          {/* Tabs */}
          <div className="flex gap-2 mb-6 border-b border-gray-200">
            <button className="
              relative px-4 py-2 text-primary font-medium
              after:absolute after:bottom-0 after:left-0 after:right-0
              after:h-0.5 after:bg-primary
            ">
              Login
            </button>
            <button className="px-4 py-2 text-gray-600 hover:text-primary transition-colors">
              Solicitar Acesso
            </button>
          </div>

          {/* Formulário */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Input Email com Luz */}
            <AnimatedInput
              label="Email"
              type="email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                if (errors.email) validateField('email', e.target.value);
              }}
              onBlur={() => validateField('email', email)}
              error={errors.email}
              icon={<Mail className="w-5 h-5" />}
              placeholder="seu@email.com"
              required
            />

            {/* Input Senha */}
            <AnimatedInput
              label="Senha"
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                if (errors.password) validateField('password', e.target.value);
              }}
              onBlur={() => validateField('password', password)}
              error={errors.password}
              icon={<Lock className="w-5 h-5" />}
              placeholder="••••••••"
              required
              rightIcon={
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="text-gray-400 hover:text-primary transition-colors"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              }
            />

            {/* Botão com Borda Degradê Animada */}
            <button
              type="submit"
              disabled={isLoading}
              className="
                relative w-full overflow-hidden
                min-h-[44px] px-6 py-3 rounded-lg
                bg-gradient-to-r from-primary to-pink-500
                text-white font-semibold
                before:absolute before:inset-0 before:rounded-lg
                before:p-[2px] before:bg-gradient-to-r before:from-primary before:via-pink-500 before:to-primary
                before:bg-[length:200%_100%] before:animate-gradient
                hover:shadow-lg hover:shadow-primary/50
                disabled:opacity-50 disabled:cursor-not-allowed
                transition-all duration-300
                flex items-center justify-center gap-2
              "
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Entrando...
                </>
              ) : (
                'Log in'
              )}
            </button>
          </form>
        </div>
      </motion.div>

      {/* Banner - Direita */}
      <motion.div
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
        className="hidden lg:block flex-1 relative overflow-hidden"
      >
        <div className="
          absolute inset-0
          bg-gradient-to-br from-primary/20 to-pink-500/20
        " />
        <img
          src="/banner-destaque.webp"
          alt="Banner promocional"
          className="
            w-full h-full object-cover
            transition-all duration-500
            hover:scale-105
          "
          loading="lazy"
        />
      </motion.div>
    </div>
  );
};

// Componente Input Animado com Luz
const AnimatedInput = ({
  label,
  error,
  icon,
  rightIcon,
  className,
  ...props
}: any) => {
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  
  const handleMouseMove = (e: React.MouseEvent) => {
    const rect = e.currentTarget.getBoundingClientRect();
    mouseX.set(e.clientX - rect.left);
    mouseY.set(e.clientY - rect.top);
  };
  
  const background = useTransform(
    [mouseX, mouseY],
    ([x, y]) => `radial-gradient(circle at ${x}px ${y}px, rgba(239, 68, 68, 0.1), transparent 50%)`
  );
  
  return (
    <div className="space-y-1">
      <label className="block text-sm font-medium text-gray-700">
        {label}
        {props.required && <span className="text-error ml-1">*</span>}
      </label>
      
      <motion.div
        onMouseMove={handleMouseMove}
        style={{ background }}
        className="relative group rounded-lg"
      >
        {icon && (
          <div className="
            absolute left-3 top-1/2 -translate-y-1/2
            text-gray-400 group-focus-within:text-primary
            transition-colors duration-200
          ">
            {icon}
          </div>
        )}
        
        <input
          className={`
            w-full px-4 py-3 rounded-lg
            ${icon ? 'pl-11' : ''}
            ${rightIcon ? 'pr-11' : ''}
            border-2 ${error ? 'border-error' : 'border-gray-200'}
            focus:border-primary focus:ring-4 focus:ring-primary/10
            focus:outline-none
            bg-transparent
            transition-all duration-200
            ${className}
          `}
          aria-invalid={!!error}
          {...props}
        />
        
        {rightIcon && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2">
            {rightIcon}
          </div>
        )}
      </motion.div>
      
      {error && (
        <motion.p
          initial={{ opacity: 0, y: -5 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-sm text-error flex items-center gap-1"
        >
          {error}
        </motion.p>
      )}
    </div>
  );
};
```

---

## 🛍️ Product Card - Completo

### src/components/ProductCard.tsx

```tsx
'use client';

import { motion, useMotionValue, useTransform } from 'framer-motion';
import { ShoppingCart, Heart, Eye } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

interface ProductCardProps {
  product: {
    id: string;
    name: string;
    image: string;
    price: number;
    cost: number;
    stock: number;
    sku: string;
  };
  onSelect?: (id: string) => void;
}

export const ProductCard = ({ product, onSelect }: ProductCardProps) => {
  const [isFavorite, setIsFavorite] = useState(false);
  
  // Hover dinâmico vinculado ao mouse
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  
  const rotateX = useTransform(y, [-100, 100], [5, -5]);
  const rotateY = useTransform(x, [-100, 100], [-5, 5]);
  
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    x.set(e.clientX - centerX);
    y.set(e.clientY - centerY);
  };
  
  const handleMouseLeave = () => {
    x.set(0);
    y.set(0);
  };
  
  const handleAddToCart = (e: React.MouseEvent) => {
    e.stopPropagation();
    toast.success('Produto adicionado ao carrinho!');
  };
  
  const handleToggleFavorite = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsFavorite(!isFavorite);
    toast.success(isFavorite ? 'Removido dos favoritos' : 'Adicionado aos favoritos');
  };
  
  const profit = product.price - product.cost;
  const profitMargin = ((profit / product.price) * 100).toFixed(1);
  
  return (
    <motion.div
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      onClick={() => onSelect?.(product.id)}
      style={{ rotateX, rotateY, transformStyle: 'preserve-3d' }}
      whileHover={{ 
        y: -8,
        boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)'
      }}
      whileTap={{ scale: 0.98 }}
      transition={{ type: 'spring', stiffness: 300, damping: 20 }}
      className="
        relative group
        bg-white rounded-xl p-4 border border-gray-200
        cursor-pointer
        overflow-hidden
      "
    >
      {/* Badge de Estoque */}
      {product.stock < 10 && (
        <div className="
          absolute top-2 left-2 z-10
          px-2 py-1 rounded-full
          bg-error/90 text-white text-xs font-medium
          backdrop-blur-sm
        ">
          Estoque baixo
        </div>
      )}
      
      {/* Botões de Ação */}
      <div className="
        absolute top-2 right-2 z-10
        flex flex-col gap-2
        opacity-0 group-hover:opacity-100
        transition-opacity duration-200
      ">
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={handleToggleFavorite}
          className={`
            p-2 rounded-full backdrop-blur-sm
            ${isFavorite ? 'bg-error text-white' : 'bg-white/90 text-gray-600'}
            hover:bg-error hover:text-white
            transition-colors duration-200
          `}
        >
          <Heart className={`w-4 h-4 ${isFavorite ? 'fill-current' : ''}`} />
        </motion.button>
        
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          className="
            p-2 rounded-full
            bg-white/90 text-gray-600
            hover:bg-primary hover:text-white
            backdrop-blur-sm
            transition-colors duration-200
          "
        >
          <Eye className="w-4 h-4" />
        </motion.button>
      </div>
      
      {/* Imagem com Hover Desfoque */}
      <div className="relative overflow-hidden rounded-lg mb-3 aspect-square">
        <motion.img
          src={product.image}
          alt={product.name}
          className="w-full h-full object-cover"
          whileHover={{ scale: 1.05 }}
          transition={{ duration: 0.3 }}
        />
        
        {/* Overlay no Hover */}
        <div className="
          absolute inset-0
          bg-black/0 group-hover:bg-black/10
          transition-colors duration-300
        " />
      </div>
      
      {/* Informações */}
      <div className="space-y-2">
        <h3 className="font-semibold text-gray-900 line-clamp-2 min-h-[2.5rem]">
          {product.name}
        </h3>
        
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-gray-500">SKU: {product.sku}</p>
            <p className="text-2xl font-bold text-primary">
              R$ {product.price.toFixed(2)}
            </p>
          </div>
          
          <div className="text-right">
            <p className="text-xs text-gray-500">Lucro</p>
            <p className="text-lg font-semibold text-success">
              {profitMargin}%
            </p>
          </div>
        </div>
        
        {/* Barra de Progresso de Estoque */}
        <div className="space-y-1">
          <div className="flex justify-between text-xs text-gray-500">
            <span>Estoque</span>
            <span>{product.stock} un</span>
          </div>
          <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${Math.min((product.stock / 100) * 100, 100)}%` }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className={`
                h-full rounded-full
                ${product.stock < 10 ? 'bg-error' : 'bg-success'}
              `}
            />
          </div>
        </div>
        
        {/* Botão Adicionar ao Carrinho */}
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={handleAddToCart}
          className="
            w-full mt-3 py-2 rounded-lg
            bg-primary text-white font-medium
            hover:bg-primary-hover
            transition-colors duration-200
            flex items-center justify-center gap-2
          "
        >
          <ShoppingCart className="w-4 h-4" />
          Adicionar
        </motion.button>
      </div>
    </motion.div>
  );
};
```

---

## 📊 Dashboard Card - Completo

### src/components/DashboardCard.tsx

```tsx
'use client';

import { motion } from 'framer-motion';
import { LucideIcon } from 'lucide-react';
import { ReactNode } from 'react';

interface DashboardCardProps {
  title: string;
  value: string | number;
  change?: number;
  icon: LucideIcon;
  trend?: 'up' | 'down';
  children?: ReactNode;
  variant?: 'default' | 'glass' | 'gradient';
}

export const DashboardCard = ({
  title,
  value,
  change,
  icon: Icon,
  trend,
  children,
  variant = 'default',
}: DashboardCardProps) => {
  const variants = {
    default: 'bg-white border border-gray-200',
    glass: 'backdrop-blur-xl bg-white/80 border border-white/20',
    gradient: 'bg-gradient-to-br from-primary/10 to-pink-500/10 border border-primary/20',
  };
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -4 }}
      transition={{ duration: 0.2 }}
      className={`
        rounded-xl p-6
        shadow-lg hover:shadow-xl
        transition-shadow duration-200
        ${variants[variant]}
      `}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div>
          <p className="text-sm text-gray-600 mb-1">{title}</p>
          <h3 className="text-3xl font-bold text-gray-900">{value}</h3>
        </div>
        
        <div className="
          p-3 rounded-lg
          bg-primary/10 text-primary
        ">
          <Icon className="w-6 h-6" />
        </div>
      </div>
      
      {/* Change Indicator */}
      {change !== undefined && (
        <div className="flex items-center gap-1 text-sm">
          <span className={trend === 'up' ? 'text-success' : 'text-error'}>
            {trend === 'up' ? '↑' : '↓'} {Math.abs(change)}%
          </span>
          <span className="text-gray-500">vs. mês anterior</span>
        </div>
      )}
      
      {/* Children */}
      {children && (
        <div className="mt-4 pt-4 border-t border-gray-200">
          {children}
        </div>
      )}
    </motion.div>
  );
};
```

---

## 🎯 Custom Hooks

### src/hooks/useProductCalculator.ts

```tsx
import { useState, useMemo } from 'react';

interface Product {
  price: number;
  cost: number;
  shipping: number;
  tax: number;
}

export const useProductCalculator = (product: Product) => {
  const [quantity, setQuantity] = useState(1);
  
  const calculations = useMemo(() => {
    const totalCost = (product.cost + product.shipping) * quantity;
    const totalRevenue = product.price * quantity;
    const totalTax = (totalRevenue * product.tax) / 100;
    const profit = totalRevenue - totalCost - totalTax;
    const profitMargin = (profit / totalRevenue) * 100;
    
    return {
      totalCost,
      totalRevenue,
      totalTax,
      profit,
      profitMargin,
    };
  }, [product, quantity]);
  
  return {
    quantity,
    setQuantity,
    ...calculations,
  };
};
```

### src/hooks/useVirtualizedList.ts

```tsx
import { useVirtualizer } from '@tanstack/react-virtual';
import { useRef } from 'react';

export const useVirtualizedList = <T,>(
  items: T[],
  estimateSize: number = 280
) => {
  const parentRef = useRef<HTMLDivElement>(null);
  
  const virtualizer = useVirtualizer({
    count: items.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => estimateSize,
    overscan: 5,
  });
  
  return {
    parentRef,
    virtualizer,
    virtualItems: virtualizer.getVirtualItems(),
    totalSize: virtualizer.getTotalSize(),
  };
};
```

---

**Última Atualização:** 28 de Fevereiro de 2026  
**Status:** ✅ Código Pronto para Uso  
**Próximo Passo:** Copiar e adaptar para seu projeto
