import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useAuth } from '@/features/auth/hooks/useAuth'
import { Button } from '@/shared/components/ui/button'
import { Input } from '@/shared/components/ui/input'
import { Label } from '@/shared/components/ui/label'
import { Loader2, Mail, Lock, Eye, EyeOff, User, ShieldCheck, ArrowRight } from 'lucide-react'
import { useState } from 'react'

import bannerImage from '@/assets/banner-login.webp'
import logoImage from '@/assets/Logo.webp'

const loginSchema = z.object({ email: z.string().email('Invalid email'), password: z.string().min(6, 'Min 6 chars') })
type LoginForm = z.infer<typeof loginSchema>

export default function LoginPage() {
  const { login, isLoggingIn, loginError } = useAuth()
  const { register, handleSubmit, formState: { errors } } = useForm<LoginForm>({ resolver: zodResolver(loginSchema) })
  const onSubmit = (data: LoginForm) => login(data)
  
  const [showPassword, setShowPassword] = useState(false)

  const handleDemoAccount = () => {
    login({ email: "admin@mangaflow.local", password: "admin123" })
  }

  return (
    <div className='h-screen bg-gray-50/50 flex p-4 overflow-hidden'>
      <div className='flex w-full h-full bg-white rounded-[2rem] overflow-hidden shadow-2xl border border-gray-100 max-w-[1600px] mx-auto'>
        
        {/* Left Column - Banner */}
        <div className='hidden lg:flex flex-1 relative bg-black rounded-3xl m-3 mr-0 overflow-hidden'>
          {/* Background Image */}
          <img 
            src={bannerImage} 
            alt="MangaFlow Background" 
            className="absolute inset-0 w-full h-full object-cover opacity-80 mix-blend-screen"
          />
          
          {/* Gradient Overlays */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/40 to-black/10"></div>
          <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/30 to-transparent w-2/3"></div>
          
          {/* Content */}
          <div className="relative z-10 p-12 xl:p-16 flex flex-col justify-end h-full w-full">
            <div className="max-w-2xl mb-8">
              <h3 className="text-primary font-bold tracking-[0.2em] text-xs mb-4 uppercase">MangaFlow</h3>
              <h2 className="text-white text-4xl xl:text-5xl font-bold leading-[1.15] mb-6">
                Production-first<br/>
                <span className="text-primary">Manga OS</span> for<br/>
                Mangaka, Editors,<br/>
                Assistants, and Board.
              </h2>
              <p className="text-gray-300 text-base xl:text-lg max-w-xl leading-relaxed">
                From ideation to publication. Plan, create, review, and publish with one connected platform built for manga teams.
              </p>
            </div>
          </div>
        </div>

        {/* Right Column - Form */}
        <div className='w-full lg:w-[500px] xl:w-[600px] flex flex-col justify-between p-6 lg:p-10 z-10 overflow-y-auto'>
          
          {/* Header */}
          <div className='flex items-center gap-3'>
            <div className='w-12 h-12 flex items-center justify-center rounded-xl overflow-hidden bg-transparent'>
              <img src={logoImage} alt="MangaFlow Logo" className="w-full h-full object-contain" />
            </div>
            <div>
              <h1 className='text-xl font-bold tracking-tight text-primary'>MangaFlow</h1>
              <p className='text-muted-foreground text-xs'>Mangaka Studio</p>
            </div>
          </div>

          {/* Form Area */}
          <div className='w-full max-w-md mx-auto space-y-6 py-4 my-auto'>
            <div className='space-y-2 text-center'>
              <h2 className='text-3xl font-bold tracking-tight text-gray-900'>Welcome back</h2>
              <p className='text-sm text-gray-500'>Sign in to continue your manga production workflow</p>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className='space-y-5'>
              <div className='space-y-2'>
                <Label htmlFor='email' className="text-gray-700 font-medium">Email address</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3.5 h-5 w-5 text-gray-400" />
                  <Input 
                    id='email' 
                    type='email' 
                    placeholder='you@example.com' 
                    {...register('email')} 
                    className={`pl-11 h-12 bg-gray-50 border-gray-200 focus:bg-white transition-colors ${errors.email ? 'border-destructive' : ''}`} 
                  />
                </div>
                {errors.email && <p className='text-destructive text-xs'>{errors.email.message}</p>}
              </div>
              
              <div className='space-y-2'>
                <Label htmlFor='password' className="text-gray-700 font-medium">Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3.5 h-5 w-5 text-gray-400" />
                  <Input 
                    id='password' 
                    type={showPassword ? 'text' : 'password'} 
                    placeholder='Enter your password' 
                    {...register('password')} 
                    className={`pl-11 pr-11 h-12 bg-gray-50 border-gray-200 focus:bg-white transition-colors ${errors.password ? 'border-destructive' : ''}`} 
                  />
                  <button 
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-3.5 text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
                {errors.password && <p className='text-destructive text-xs'>{errors.password.message}</p>}
              </div>

              <div className='flex items-center justify-between'>
                <div className='flex items-center space-x-2'>
                  <input type="checkbox" id="remember" className="rounded border-gray-300 text-primary focus:ring-primary h-4 w-4" />
                  <Label htmlFor='remember' className="text-sm text-gray-600 font-normal cursor-pointer">Remember me</Label>
                </div>
                <a href="#" className="text-sm font-medium text-primary hover:underline">Forgot password?</a>
              </div>

              {loginError && (
                <div className='rounded-lg bg-destructive/10 border border-destructive/20 px-4 py-3'>
                  <p className='text-destructive text-sm font-medium'>Invalid email or password</p>
                </div>
              )}
              
              <Button type='submit' className='w-full h-12 text-base font-medium rounded-xl shadow-md shadow-primary/20' disabled={isLoggingIn}>
                {isLoggingIn ? <><Loader2 size={18} className='mr-2 animate-spin' />Signing in...</> : <>Sign In <ArrowRight className="ml-2 h-4 w-4" /></>}
              </Button>
            </form>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-gray-200" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-white px-3 text-gray-400">or</span>
              </div>
            </div>

            <Button type='button' variant="outline" onClick={handleDemoAccount} className='w-full h-12 text-base font-medium text-primary border-gray-200 hover:bg-primary/5 rounded-xl' disabled={isLoggingIn}>
              <User className="mr-2 h-5 w-5" /> Use Demo Account
            </Button>
            
            <div className="flex items-start gap-3 p-4 bg-gray-50/80 rounded-2xl mt-6">
              <div className="p-2 bg-primary/10 text-primary rounded-xl shrink-0">
                <ShieldCheck size={20} />
              </div>
              <div className="text-xs text-gray-500 leading-relaxed">
                <span className="font-semibold text-gray-700">Role-based access. Enterprise-grade security.</span><br />
                Your work and data are always protected.
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className='flex flex-col sm:flex-row items-center justify-between text-[11px] text-gray-400 mt-4 gap-4'>
            <p>© 2026 MangaFlow by Mangaka Studio. All rights reserved.</p>
            <div className="flex space-x-4">
              <a href="#" className="hover:text-primary transition-colors">Security</a>
              <a href="#" className="hover:text-primary transition-colors">Privacy</a>
              <a href="#" className="hover:text-primary transition-colors">Terms</a>
              <a href="#" className="hover:text-primary transition-colors">Help Center</a>
            </div>
          </div>
        </div>

      </div>
    </div>
  )
}