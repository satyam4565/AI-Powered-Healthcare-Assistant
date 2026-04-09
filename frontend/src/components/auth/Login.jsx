import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mail, Lock, User, Eye, EyeOff, ArrowRight, ShieldCheck } from 'lucide-react'; 
import { useAuth } from '../../context/AuthContext';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { SegmentedControl } from '../ui/SegmentedControl';

export default function Login() {
  const [isLogin, setIsLogin] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [role, setRole] = useState('patient');
  const [formData, setFormData] = useState({ name: '', email: '', password: '', specialization: 'General' });
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();

  // --- Validation Logic ---
  const validateForm = () => {
    if (!formData.email.trim() || !formData.password.trim()) {
      setError('Email and password are required.');
      return false;
    }
    
    // Basic email format check
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      setError('Please enter a valid email address.');
      return false;
    }

    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters long.');
      return false;
    }

    if (!isLogin) {
      if (!formData.name.trim()) {
        setError('Full Name is required to create an account.');
        return false;
      }
    }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    // Run frontend validation before hitting the server
    if (!validateForm()) return;

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
      className="fixed inset-0 flex items-center justify-center p-4 font-sans text-white selection:bg-blue-500/30 overflow-hidden"
      style={{
        backgroundImage: "url('/MediBridgeBg.jpeg')", 
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
      }}
    >
      {/* Enhanced Dark Overlay */}
      <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-[2px]"></div>

      {/* Decorative Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-blue-600/20 rounded-full blur-[120px] pointer-events-none"></div>

      {/* Login Card */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{
          opacity: 1,
          scale: 1,
          y: 0,
          x: error ? [-8, 8, -5, 5, 0] : 0 // Shake animation on error
        }}
        transition={{ duration: 0.4, type: "spring", stiffness: 100 }}
        className="relative z-10 w-full max-w-[420px] bg-[#111622]/90 backdrop-blur-xl rounded-3xl border border-slate-700/50 p-8 sm:p-10 shadow-2xl shadow-black/50"
      >
        {/* Brand Header */}
        <div className="text-center mb-10">
          <motion.div 
            initial={{ scale: 0.8, rotate: -10 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ type: "spring", stiffness: 200, delay: 0.1 }}
            className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-blue-500/20 to-indigo-600/20 rounded-2xl flex items-center justify-center border border-blue-500/30 shadow-[0_0_30px_rgba(59,130,246,0.3)]"
          >
            <img src="/favicon.png" alt="Logo" className="w-10 h-10 object-contain" />
          </motion.div>
          <img 
            src="/logotext.png" 
            alt="MediBridge" 
            className="h-7 mx-auto mb-3 object-contain"
          />
          <p className="text-slate-400 text-sm font-medium">
            {isLogin ? 'Welcome back to your dashboard' : 'Join the secure medical network'}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <AnimatePresence mode="wait">
            {!isLogin && (
              <motion.div 
                key="signup-fields"
                initial={{ opacity: 0, height: 0, filter: 'blur(10px)' }} 
                animate={{ opacity: 1, height: 'auto', filter: 'blur(0px)' }}
                exit={{ opacity: 0, height: 0, filter: 'blur(10px)' }}
                transition={{ duration: 0.3 }}
                className="space-y-5 overflow-hidden"
              >
                <div className="bg-slate-900/50 p-1.5 rounded-xl border border-slate-800">
                  <SegmentedControl
                    options={[
                      { label: 'Patient', value: 'patient' },
                      { label: 'Doctor', value: 'doctor' }
                    ]}
                    selected={role}
                    onChange={setRole}
                  />
                </div>
                <Input
                  icon={User}
                  placeholder="Full Name"
                  required
                  value={formData.name}
                  onChange={(e) => {
                    setError('');
                    setFormData({ ...formData, name: e.target.value });
                  }}
                  className="bg-slate-900/50 border-slate-700 focus:border-blue-500 focus:ring-1 focus:ring-blue-500/50"
                />
              </motion.div>
            )}
          </AnimatePresence>

          <Input
            icon={Mail}
            type="email"
            placeholder="Email Address"
            required
            value={formData.email}
            onChange={(e) => {
              setError('');
              setFormData({ ...formData, email: e.target.value });
            }}
            className="bg-slate-900/50 border-slate-700 focus:border-blue-500 focus:ring-1 focus:ring-blue-500/50 transition-all"
          />

          <div className="relative group">
            <Input
              icon={Lock}
              type={showPassword ? "text" : "password"}
              placeholder="Password"
              required
              value={formData.password}
              onChange={(e) => {
                setError('');
                setFormData({ ...formData, password: e.target.value });
              }}
              className="bg-slate-900/50 border-slate-700 focus:border-blue-500 focus:ring-1 focus:ring-blue-500/50 pr-12 transition-all"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-blue-400 transition-colors focus:outline-none"
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>

          <AnimatePresence>
            {error && (
              <motion.div 
                initial={{ opacity: 0, y: -10 }} 
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="flex items-center gap-2 bg-red-500/10 border border-red-500/20 text-red-400 text-xs py-3 px-4 rounded-xl"
              >
                <div className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse"></div>
                {error}
              </motion.div>
            )}
          </AnimatePresence>

          <Button 
            type="submit" 
            disabled={isLoading}
            className="w-full h-12 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-semibold shadow-[0_0_20px_rgba(37,99,235,0.3)] hover:shadow-[0_0_25px_rgba(37,99,235,0.5)] transition-all active:scale-[0.98] mt-2 group relative overflow-hidden"
          >
            {/* Shimmer Effect */}
            <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/20 to-transparent group-hover:animate-shimmer"></div>
            
            <span className="relative flex items-center justify-center gap-2">
              {isLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  Processing...
                </>
              ) : (
                <>
                  {isLogin ? 'Sign In Securely' : 'Create Account'}
                  {isLogin ? <ShieldCheck size={18} className="opacity-80" /> : <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />}
                </>
              )}
            </span>
          </Button>
        </form>

        <div className="mt-8 pt-6 border-t border-slate-800 text-center">
          <p className="text-slate-400 text-sm">
            {isLogin ? "Don't have an account?" : "Already a member?"}
            <button
              onClick={() => {
                setIsLogin(!isLogin);
                setError(''); 
              }}
              className="text-blue-400 font-semibold ml-2 hover:text-blue-300 hover:underline decoration-2 underline-offset-4 transition-all"
            >
              {isLogin ? 'Sign up now' : 'Login here'}
            </button>
          </p>
        </div>
      </motion.div>
    </div>
  );
}