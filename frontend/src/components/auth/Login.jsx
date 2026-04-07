import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mail, Lock, User, Stethoscope, ArrowRight } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { SegmentedControl } from '../ui/SegmentedControl';

export default function Login() {
  const [isLogin, setIsLogin] = useState(true);
  const [role, setRole] = useState('patient');
  const [formData, setFormData] = useState({ name: '', email: '', password: '', specialization: 'General' });
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    
    const endpoint = isLogin ? '/api/auth/login' : '/api/auth/signup';
    const payload = isLogin 
      ? { email: formData.email, password: formData.password }
      : { ...formData, role };

    try {
      const response = await fetch(`http://localhost:8000${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok) throw new Error(data.detail || 'Authentication failed');

      if (isLogin) {
        login(data.user, data.access_token);
      } else {
        const loginRes = await fetch('http://localhost:8000/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: formData.email, password: formData.password }),
        });
        const loginData = await loginRes.json();
        login(loginData.user, loginData.access_token);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div 
      className="fixed inset-0 w-full h-full flex flex-col items-center justify-center p-4 font-sans text-slate-100 z-50 overflow-hidden bg-[#050B14]"
      // UNCOMMENT the line below and add your clean background image to your public folder!
      // style={{ backgroundImage: "url('/your-clean-network-bg.jpg')", backgroundSize: 'cover', backgroundPosition: 'center' }}
    >
      
      {/* Fallback CSS Glowing effects (You can remove these if you use a real background image) */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[400px] bg-blue-600/20 rounded-[100%] blur-[120px] pointer-events-none transform -rotate-12" />
      <div className="absolute top-1/2 left-1/4 w-[500px] h-[300px] bg-indigo-500/10 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute top-1/2 right-1/4 w-[500px] h-[300px] bg-cyan-500/10 rounded-full blur-[100px] pointer-events-none" />

      {/* Floating Background Overlay to darken it slightly so the card pops */}
      <div className="absolute inset-0 bg-[#050B14]/40 backdrop-blur-[2px]"></div>

      {/* Top Main Logo as seen in the generated design */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="relative z-10 mb-8 mt-[-40px]"
      >
        <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-white drop-shadow-lg">
          <span className="text-blue-400">Medi</span>Bridge
        </h1>
      </motion.div>

      {/* Login Card */}
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ 
          opacity: 1, 
          scale: 1,
          x: error ? [-10, 10, -5, 5, 0] : 0 
        }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-[420px] bg-[#1E232E]/95 backdrop-blur-xl rounded-2xl border border-slate-700/50 p-8 shadow-[0_20px_50px_rgba(0,0,0,0.5)] relative z-10"
      >
        <div className="text-center mb-8 relative flex flex-col items-center">
          <motion.div 
            initial={{ scale: 0.8 }}
            animate={{ scale: 1 }}
            className="inline-flex items-center justify-center mb-4"
          >
            {/* Outline icon matching the mockup */}
            <Stethoscope size={42} className="text-slate-200" strokeWidth={1.5} />
          </motion.div>
          <h2 className="text-2xl font-bold tracking-tight text-white mb-2">MediBridge</h2>
          <p className="text-slate-400 text-sm">
            {isLogin ? 'Welcome back. Please enter your details.' : 'Create your account to get started.'}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <AnimatePresence mode="popLayout">
            {!isLogin && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="space-y-4"
              >
                <SegmentedControl 
                  options={[
                    { label: 'Patient', value: 'patient' },
                    { label: 'Doctor', value: 'doctor' }
                  ]}
                  selected={role}
                  onChange={setRole}
                />

                <Input
                  icon={User}
                  type="text"
                  placeholder="Full Name"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  className="bg-[#151921] border-slate-700/50 text-white placeholder:text-slate-500"
                />
              </motion.div>
            )}
          </AnimatePresence>

          <Input
            icon={Mail}
            type="email"
            placeholder="Email address"
            required
            value={formData.email}
            onChange={(e) => setFormData({...formData, email: e.target.value})}
            className="bg-[#151921] border-slate-700/50 text-white placeholder:text-slate-500"
          />

          <Input
            icon={Lock}
            type="password"
            placeholder="Password"
            required
            value={formData.password}
            onChange={(e) => setFormData({...formData, password: e.target.value})}
            className="bg-[#151921] border-slate-700/50 text-white placeholder:text-slate-500"
          />

          <AnimatePresence>
            {error && (
              <motion.div 
                initial={{ opacity: 0, y: -10 }} 
                animate={{ opacity: 1, y: 0 }} 
                exit={{ opacity: 0, y: -10 }}
                className="bg-rose-500/10 border border-rose-500/50 text-rose-400 text-sm p-3 rounded-xl text-center"
              >
                {error}
              </motion.div>
            )}
          </AnimatePresence>

          <Button
            type="submit"
            className="w-full mt-4 bg-blue-500 hover:bg-blue-600 text-white font-medium py-2.5 rounded-lg transition-colors"
            isLoading={isLoading}
          >
            {isLogin ? 'Sign In' : 'Create Account'}
            {!isLoading && <ArrowRight size={18} className="ml-2 inline-block" />}
          </Button>
        </form>

        <p className="text-center text-slate-400 text-[13px] mt-8">
          {isLogin ? "Don't have an account? " : "Already have an account? "}
          <button 
            onClick={() => {
              setIsLogin(!isLogin);
              setError('');
            }} 
            className="text-blue-400 hover:text-blue-300 hover:underline transition-colors"
          >
            {isLogin ? 'Sign up' : 'Log in'}
          </button>
        </p>
      </motion.div>
    </div>
  );
}