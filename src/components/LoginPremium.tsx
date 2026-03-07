'use client';

import { useState } from 'react';
import { motion, useMotionValue, useTransform } from 'framer-motion';
import { Mail, Lock, Loader2, Eye, EyeOff, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { z } from 'zod';
import { supabase } from '@/lib/supabase';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import Lightning from '@/components/ui/lightning';
import MagicBento from '@/components/ui/magic-bento';
import Magnet from '@/components/ui/magnet';
import banner from '@/assets/banner.webp';
import logo from '@/assets/logo.png';
import { cn } from '@/lib/utils';

// Schema de validação
const loginSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(6, 'Senha deve ter no mínimo 6 caracteres'),
});

const requestSchema = z.object({
  email: z.string().email('Email inválido'),
});

// Componente Input Animado com Luz
interface AnimatedInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
  icon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

const AnimatedInput = ({
  label,
  error,
  icon,
  rightIcon,
  className,
  id,
  required,
  ...props
}: AnimatedInputProps) => {
  const [isHovered, setIsHovered] = useState(false);
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  
  const handleMouseMove = (e: React.MouseEvent) => {
    const rect = e.currentTarget.getBoundingClientRect();
    mouseX.set(e.clientX - rect.left);
    mouseY.set(e.clientY - rect.top);
  };
  
  const handleMouseEnter = () => setIsHovered(true);
  const handleMouseLeave = () => {
    setIsHovered(false);
    mouseX.set(0);
    mouseY.set(0);
  };
  
  const background = useTransform(
    [mouseX, mouseY],
    ([x, y]) => isHovered 
      ? `radial-gradient(circle at ${x}px ${y}px, rgba(254, 44, 85, 0.08), transparent 50%)`
      : 'transparent'
  );
  
  const inputId = id || label.toLowerCase().replace(/\s+/g, '-');
  
  return (
    <div className="space-y-1">
      <label 
        htmlFor={inputId}
        className="block text-sm font-medium text-gray-700"
      >
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>
      
      <motion.div
        onMouseMove={handleMouseMove}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        style={{ background }}
        className="relative group rounded-lg"
      >
        {icon && (
          <div className="
            absolute left-3 top-1/2 -translate-y-1/2
            text-gray-400 group-focus-within:text-[#fe2c55]
            transition-colors duration-200
          ">
            {icon}
          </div>
        )}
        
        <input
          id={inputId}
          className={cn(
            'w-full px-4 py-3 rounded-lg',
            icon && 'pl-11',
            rightIcon && 'pr-11',
            'border-2',
            error ? 'border-red-500' : 'border-gray-200',
            'focus:border-[#fe2c55] focus:ring-4 focus:ring-[#fe2c55]/10',
            'focus:outline-none',
            'bg-transparent',
            'text-gray-900',
            'placeholder:text-gray-400',
            'transition-all duration-200',
            className
          )}
          aria-invalid={!!error}
          aria-describedby={error ? `${inputId}-error` : undefined}
          required={required}
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
          id={`${inputId}-error`}
          className="text-sm text-red-500 flex items-center gap-1"
        >
          <AlertCircle className="w-4 h-4" />
          {error}
        </motion.p>
      )}
    </div>
  );
};

export default function LoginPremium() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [requestEmail, setRequestEmail] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('login');
  const navigate = useNavigate();

  // Validação em tempo real
  const validateField = (
    field: 'email' | 'password', 
    value: string, 
    isLoginSchema: boolean
  ) => {
    try {
      if (field === 'email') {
        // Ambos schemas têm email
        const schema = isLoginSchema ? loginSchema : requestSchema;
        schema.shape.email.parse(value);
      } else if (field === 'password' && isLoginSchema) {
        // Apenas loginSchema tem password
        loginSchema.shape.password.parse(value);
      } else {
        return; // requestSchema não tem password
      }
      setErrors(prev => ({ ...prev, [field]: '' }));
    } catch (error) {
      if (error instanceof z.ZodError) {
        setErrors(prev => ({ ...prev, [field]: error.issues[0].message }));
      }
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validação completa
    try {
      loginSchema.parse({ email, password });
      setIsLoading(true);
      
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        throw error;
      }

      toast.success('Login realizado com sucesso!', {
        description: 'Redirecionando para o dashboard...',
      });
      
      navigate('/');
    } catch (error) {
      if (error instanceof z.ZodError) {
        const fieldErrors: Record<string, string> = {};
        error.issues.forEach((err) => {
          if (err.path[0]) {
            fieldErrors[err.path[0] as string] = err.message;
          }
        });
        setErrors(fieldErrors);
        toast.error('Verifique os campos e tente novamente');
      } else if (error instanceof Error) {
        toast.error('Erro ao fazer login', {
          description: error.message,
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleRequestAccess = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      requestSchema.parse({ email: requestEmail });
      setIsLoading(true);
      
      // 1. Insert request into database
      const { error: dbError } = await supabase
        .from('access_requests')
        .insert([{ email: requestEmail }]);

      if (dbError) throw dbError;

      // 2. Invoke Edge Function to send email
      const { error: fnError } = await supabase.functions.invoke('request-access', {
        body: { email: requestEmail }
      });

      if (fnError) {
        console.error('Failed to send email:', fnError);
      }

      toast.success('Solicitação enviada com sucesso!', {
        description: 'Aguarde a aprovação do administrador.',
      });
      
      setRequestEmail('');
      setErrors({});
    } catch (error) {
      if (error instanceof z.ZodError) {
        const fieldErrors: Record<string, string> = {};
        error.issues.forEach((err) => {
          if (err.path[0]) {
            fieldErrors[err.path[0] as string] = err.message;
          }
        });
        setErrors(fieldErrors);
        toast.error('Verifique os campos e tente novamente');
      } else if (error instanceof Error) {
        toast.error('Erro ao solicitar acesso', {
          description: error.message,
        });
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
        className="flex-1 flex items-center justify-center p-8 relative overflow-hidden"
        style={{
          background: 'linear-gradient(270deg, rgba(0, 0, 0, 0.75) 4%, rgba(255, 255, 255, 0) 71%, rgba(23, 23, 23, 0) 100%)',
          backgroundColor: '#000000'
        }}
      >
        {/* Lightning atrás do formulário - diagonal completa esquerda para direita */}
        <div className="absolute inset-0 -left-[40%] -top-[100%] -right-[10%] rotate-[35deg] scale-[3] origin-top-left opacity-45 pointer-events-none z-0">
          <Lightning
            hue={348}
            xOffset={-0.3}
            speed={1.5}
            intensity={1.4}
            size={0.8}
          />
        </div>
        {/* Card Principal com MagicBento e Magnet */}
        <div className="relative z-10">
        <Magnet padding={50} disabled={false} magnetStrength={30}>
        <MagicBento
          textAutoHide={true}
          enableStars={false}
          enableSpotlight={false}
          enableBorderGlow={true}
          enableTilt={true}
          enableMagnetism={false}
          clickEffect={false}
          spotlightRadius={620}
          particleCount={12}
          glowColor="37, 244, 238"
          disableAnimations={false}
        >
        <div className="w-full max-w-2xl bg-white rounded-2xl p-10 shadow-2xl">
          {/* Logo Simples sem Efeitos */}
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="mb-8"
          >
            <div className="relative inline-block">
              <img 
                src={logo} 
                alt="Alob Express" 
                className="h-16" 
              />
            </div>
          </motion.div>
          
          <p className="text-gray-600 mb-8">
            Escolha como você quer entrar na sua conta
          </p>

          {/* Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-6 bg-gray-100">
              <TabsTrigger 
                value="login" 
                className="relative data-[state=active]:bg-[#fe2c55] data-[state=active]:text-white"
              >
                Login
                {activeTab === 'login' && (
                  <motion.div
                    layoutId="activeTab"
                    className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#fe2c55]"
                    transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                  />
                )}
              </TabsTrigger>
              <TabsTrigger 
                value="request" 
                className="relative data-[state=active]:bg-[#fe2c55] data-[state=active]:text-white"
              >
                Solicitar Acesso
                {activeTab === 'request' && (
                  <motion.div
                    layoutId="activeTab"
                    className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#fe2c55]"
                    transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                  />
                )}
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="login">
              {/* Formulário de Login */}
              <form onSubmit={handleLogin} className="space-y-4">
                {/* Input Email com Luz */}
                <AnimatedInput
                  label="Email"
                  type="email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (errors.email) validateField('email', e.target.value, true);
                  }}
                  onBlur={() => validateField('email', email, true)}
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
                    if (errors.password) validateField('password', e.target.value, true);
                  }}
                  onBlur={() => validateField('password', password, true)}
                  error={errors.password}
                  icon={<Lock className="w-5 h-5" />}
                  placeholder="••••••••"
                  required
                  rightIcon={
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="text-gray-400 hover:text-[#fe2c55] transition-colors"
                      aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
                    >
                      {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  }
                />

                {/* Botão com Borda Degradê Animada */}
                <Button
                  type="submit"
                  disabled={isLoading}
                  className="
                    relative w-full overflow-hidden
                    min-h-[44px] px-6 py-3 rounded-lg
                    bg-gradient-to-r from-[#fe2c55] to-pink-500
                    text-white font-semibold
                    hover:shadow-lg hover:shadow-[#fe2c55]/50
                    disabled:opacity-50 disabled:cursor-not-allowed
                    transition-all duration-300
                    flex items-center justify-center gap-2
                    before:absolute before:inset-0
                    before:bg-gradient-to-r before:from-transparent before:via-white/30 before:to-transparent
                    before:translate-x-[-200%]
                    hover:before:translate-x-[200%]
                    before:transition-transform before:duration-700
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
                </Button>
              </form>
            </TabsContent>
            
            <TabsContent value="request">
              {/* Formulário de Solicitação */}
              <form onSubmit={handleRequestAccess} className="space-y-4">
                <AnimatedInput
                  label="Email"
                  type="email"
                  value={requestEmail}
                  onChange={(e) => {
                    setRequestEmail(e.target.value);
                    if (errors.email) validateField('email', e.target.value, false);
                  }}
                  onBlur={() => validateField('email', requestEmail, false)}
                  error={errors.email}
                  icon={<Mail className="w-5 h-5" />}
                  placeholder="seu@email.com"
                  required
                />

                <Button
                  type="submit"
                  disabled={isLoading}
                  className="
                    relative w-full overflow-hidden
                    min-h-[44px] px-6 py-3 rounded-lg
                    bg-gradient-to-r from-[#fe2c55] to-pink-500
                    text-white font-semibold
                    hover:shadow-lg hover:shadow-[#fe2c55]/50
                    disabled:opacity-50 disabled:cursor-not-allowed
                    transition-all duration-300
                    flex items-center justify-center gap-2
                    before:absolute before:inset-0
                    before:bg-gradient-to-r before:from-transparent before:via-white/30 before:to-transparent
                    before:translate-x-[-200%]
                    hover:before:translate-x-[200%]
                    before:transition-transform before:duration-700
                  "
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Enviando...
                    </>
                  ) : (
                    'Solicitar Acesso'
                  )}
                </Button>
              </form>
            </TabsContent>
          </Tabs>
        </div>
        </MagicBento>
        </Magnet>
        </div>
      </motion.div>

      {/* Banner - Direita */}
      <motion.div
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
        className="hidden lg:block flex-1 relative overflow-hidden h-screen group"
        style={{
          background: 'linear-gradient(270deg, rgba(0, 0, 0, 0.75) 4%, rgba(255, 255, 255, 0) 71%, rgba(23, 23, 23, 0) 100%)',
          backgroundColor: '#000000'
        }}
      >
        {/* Gradiente adicional para suavizar a transição e remover linha */}
        <div 
          className="absolute inset-0 z-10 pointer-events-none"
          style={{
            background: 'linear-gradient(90deg, rgba(0, 0, 0, 0.9) 0%, rgba(0, 0, 0, 0.5) 15%, transparent 40%)'
          }}
        />
        
        {/* Banner Principal */}
        <img
          src={banner}
          alt="Banner promocional"
          className="w-full h-full object-cover relative z-[5]"
          loading="lazy"
        />
        
        {/* Glitch Effect Layers no Banner - Apenas no Hover */}
        <img
          src={banner}
          alt=""
          aria-hidden="true"
          className="w-full h-full object-cover absolute inset-0 opacity-0 group-hover:opacity-30 transition-opacity duration-150 pointer-events-none z-[6]"
          loading="lazy"
          style={{
            filter: 'drop-shadow(0 0 3px rgba(255, 0, 0, 0.6))',
            animation: 'glitch 2s infinite linear alternate-reverse',
            clipPath: 'inset(0 0 0 0)',
            transform: 'translateX(2px)'
          }}
        />
        <img
          src={banner}
          alt=""
          aria-hidden="true"
          className="w-full h-full object-cover absolute inset-0 opacity-0 group-hover:opacity-30 transition-opacity duration-150 pointer-events-none z-[6]"
          loading="lazy"
          style={{
            filter: 'drop-shadow(0 0 3px rgba(0, 255, 255, 0.6))',
            animation: 'glitch 1.5s infinite linear alternate-reverse',
            clipPath: 'inset(0 0 0 0)',
            transform: 'translateX(-2px)'
          }}
        />
      </motion.div>
    </div>
  );
}
