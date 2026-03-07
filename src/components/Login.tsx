import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import banner from '@/assets/banner.webp';
import logo from '@/assets/logo.png';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [requestEmail, setRequestEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        throw error;
      }

      navigate('/');
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Ocorreu um erro desconhecido ao fazer login.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleRequestAccess = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccessMessage(null);

    try {
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
         // Don't block the user if email fails, but maybe warn
      }

      setSuccessMessage('Solicitação enviada com sucesso! Aguarde a aprovação do administrador.');
      setRequestEmail('');
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Ocorreu um erro desconhecido ao solicitar acesso.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen w-full">
      {/* Left Side - Form */}
      <div className="w-full lg:w-1/2 flex flex-col justify-center items-center p-8 lg:p-16 bg-white">
        <div className="w-full max-w-md space-y-8">
          <div className="flex flex-col items-start mb-8 w-full">
             <img src={logo} alt="Alob Express" className="h-12 mb-12" />
          </div>

          <Tabs defaultValue="login" className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-8">
              <TabsTrigger value="login">Login</TabsTrigger>
              <TabsTrigger value="request">Solicitar Acesso</TabsTrigger>
            </TabsList>
            
            <TabsContent value="login">
              <div className="mb-6">
                <h2 className="text-3xl font-bold text-gray-900">Log in</h2>
                <p className="mt-2 text-gray-600">Escolha como você quer entrar na sua conta</p>
              </div>

              <form onSubmit={handleLogin} className="space-y-6 w-full">
                <div className="space-y-2">
                  <Label htmlFor="email" className="font-medium text-gray-700">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="seu@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="w-full bg-blue-50/50 border-gray-200"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password" className="font-medium text-gray-700">Senha</Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="w-full bg-blue-50/50 border-gray-200"
                  />
                </div>

                {error && !successMessage && (
                  <div className="p-3 text-sm text-red-500 bg-red-50 rounded-md border border-red-200">
                    {error}
                  </div>
                )}

                <Button 
                  type="submit" 
                  className="w-full bg-[#fe2c55] hover:bg-[#e6254a] text-white font-bold h-12 text-md" 
                  disabled={loading}
                >
                  {loading ? 'Entrando...' : 'Log in'}
                </Button>
              </form>
            </TabsContent>

            <TabsContent value="request">
              <div className="mb-6">
                <h2 className="text-3xl font-bold text-gray-900">Solicitar Acesso</h2>
                <p className="mt-2 text-gray-600">Insira seu email para solicitar acesso ao administrador</p>
              </div>

              <form onSubmit={handleRequestAccess} className="space-y-6 w-full">
                <div className="space-y-2">
                  <Label htmlFor="request-email" className="font-medium text-gray-700">Email</Label>
                  <Input
                    id="request-email"
                    type="email"
                    placeholder="seu@email.com"
                    value={requestEmail}
                    onChange={(e) => setRequestEmail(e.target.value)}
                    required
                    className="w-full bg-blue-50/50 border-gray-200"
                  />
                </div>

                {error && !successMessage && (
                  <div className="p-3 text-sm text-red-500 bg-red-50 rounded-md border border-red-200">
                    {error}
                  </div>
                )}

                {successMessage && (
                  <div className="p-3 text-sm text-green-600 bg-green-50 rounded-md border border-green-200">
                    {successMessage}
                  </div>
                )}

                <Button 
                  type="submit" 
                  className="w-full bg-[#fe2c55] hover:bg-[#e6254a] text-white font-bold h-12 text-md" 
                  disabled={loading}
                >
                  {loading ? 'Enviando...' : 'Solicitar Acesso'}
                </Button>
              </form>
            </TabsContent>
          </Tabs>
          
        </div>
      </div>
      
      {/* Right Side - Image */}
      <div className="hidden lg:block lg:w-1/2 relative">
        <div className="absolute inset-0 bg-black/20 z-10" />
        <img 
          src={banner} 
          alt="Login Banner" 
          className="absolute inset-0 w-full h-full object-cover"
        />
      </div>
    </div>
  );
}
