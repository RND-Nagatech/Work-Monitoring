import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { useAuthStore } from '@/stores/authStore';
import { authApi } from '@/services/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from '@/hooks/use-toast';
import { ClipboardList, Eye, EyeOff, Loader2 } from 'lucide-react';

interface LoginForm {
  username: string;
  password: string;
}

export default function Login() {
  const navigate = useNavigate();
  const login = useAuthStore((state) => state.login);
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginForm>();

  const onSubmit = async (data: LoginForm) => {
    setIsLoading(true);
    try {
      const response = await authApi.login(data.username, data.password);
      // Backend returns { success, message, data: { token, user } }
      const { token, user: backendUser } = response.data || {};
      if (!token || !backendUser) {
        throw new Error('Invalid login response');
      }
      // Map backend user to frontend User type
      const mappedUser = {
        id: backendUser.id || backendUser._id,
        username: backendUser.username,
        name: backendUser.name,
        role: backendUser.role,
        employeeId: backendUser.pegawai_id?._id || backendUser.pegawai_id || undefined,
        divisionId: backendUser.pegawai_id?.kode_divisi?._id || undefined,
        divisionName: backendUser.pegawai_id?.kode_divisi?.nama_divisi || undefined,
      };
      login(token, mappedUser);
      toast({
        title: 'Welcome back!',
        description: `Logged in as ${mappedUser.name}`,
      });
      navigate('/dashboard');
    } catch (error) {
      console.log('Login error:', error); // Tambahan log error detail
      toast({
        title: 'Login failed',
        description: 'Invalid username or password',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-muted/20">
      {/* Left side - Branding (dark wave style) */}
      <div className="hidden lg:flex lg:w-1/2 items-center justify-center p-16 relative overflow-hidden rounded-r-[48px]"
           style={{
             background:
               'radial-gradient(1200px 600px at 0% 100%, rgba(255,255,255,0.06) 0%, rgba(255,255,255,0) 40%), radial-gradient(900px 500px at 100% 0%, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0) 40%), linear-gradient(135deg, #0b0b0c 0%, #0f1115 100%)'
           }}
      >
        <div className="absolute inset-0 opacity-[0.35]" style={{
          background:
            'radial-gradient(800px 400px at 40% 60%, #0a2a66 0%, rgba(10,42,102,0) 60%), radial-gradient(700px 350px at 70% 30%, #0b3a88 0%, rgba(11,58,136,0) 60%)'
        }} />
        <div className="relative z-10 max-w-lg text-center">
          <div className="w-20 h-20 rounded-2xl bg-white/10 shadow-lg backdrop-blur-sm flex items-center justify-center mx-auto mb-8">
            <ClipboardList className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-4xl font-bold text-white tracking-tight mb-4">
            Work Monitoring System
          </h1>
          <p className="text-white/80 text-lg leading-relaxed">
            Efficiently manage and track tasks across all divisions. Monitor progress, assign work, and generate comprehensive reports.
          </p>
        </div>
      </div>

      {/* Right side - Login form */}
      <div className="flex-1 flex items-center justify-center p-6 lg:p-10">
        <div className="w-full max-w-md">
          <div className="lg:hidden mb-8 text-center">
            <div className="w-16 h-16 rounded-xl gradient-primary shadow-md flex items-center justify-center mx-auto mb-4">
              <ClipboardList className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-2xl font-semibold text-foreground">Work Monitor</h1>
          </div>

          <div className="bg-card rounded-3xl shadow-card p-8 border border-border/70">
            <div className="mb-8">
              <h2 className="text-2xl font-bold text-foreground tracking-tight">Sign In</h2>
              <p className="text-muted-foreground mt-2">
                Enter your credentials to access your account
              </p>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="username">Username</Label>
                <Input
                  id="username"
                  placeholder="Enter your username"
                  {...register('username', { required: 'Username is required' })}
                  className={errors.username ? 'border-destructive focus-visible:ring-destructive rounded-full h-11' : 'rounded-full h-11'}
                />
                {errors.username && (
                  <p className="text-sm text-destructive">{errors.username.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Enter your password"
                    {...register('password', { required: 'Password is required' })}
                    className={errors.password ? 'border-destructive pr-10 focus-visible:ring-destructive rounded-full h-11' : 'pr-10 rounded-full h-11'}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {errors.password && (
                  <p className="text-sm text-destructive">{errors.password.message}</p>
                )}
              </div>

              <Button
                type="submit"
                variant="brand"
                className="w-full rounded-full h-11 shadow-md"
                disabled={isLoading}
              >
                {isLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Sign in
              </Button>
            </form>

            <div className="mt-6 pt-6 border-t border-border">
              <p className="text-sm text-muted-foreground text-center">
                Demo credentials:
              </p>
              <div className="mt-2 text-xs text-muted-foreground text-center space-y-1">
                <p>Admin: <code className="bg-muted px-1.5 py-0.5 rounded">admin / admin123</code></p>
                <p>Employee: <code className="bg-muted px-1.5 py-0.5 rounded">ROBI / ROBI12345</code></p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
