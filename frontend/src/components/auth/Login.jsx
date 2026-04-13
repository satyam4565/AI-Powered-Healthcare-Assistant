import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ShieldCheck, Lock, Eye, EyeOff } from 'lucide-react'; 
import { useAuth } from '../../context/AuthContext';

export default function Login() {
  const [isLogin, setIsLogin] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [role, setRole] = useState('patient'); // 'patient' or 'doctor'
  const [formData, setFormData] = useState({ name: '', email: '', password: '', specialization: 'General' });
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();

  // --- OAuth Handlers ---
  const handleGoogleSignIn = () => {
    // Redirect to your backend Google OAuth endpoint
    // window.location.href = 'http://localhost:8000/api/auth/google';
    console.log("Initiating Google Sign-In...");
  };

  const handleAppleSignIn = () => {
    // Redirect to your backend Apple OAuth endpoint
    // window.location.href = 'http://localhost:8000/api/auth/apple';
    console.log("Initiating Apple Sign-In...");
  };

  // --- Validation Logic ---
  const validateForm = () => {
    if (!formData.email.trim() || !formData.password.trim()) {
      setError('Email and password are required.');
      return false;
    }
    
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
    
    if (!validateForm()) return;

    setIsLoading(true);

    const endpoint = isLogin ? '/api/auth/login' : '/api/auth/signup';
    
    // Role is naturally included in the signup payload here
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
    <div className="min-h-screen flex items-center justify-center bg-[#f4f7fb] relative font-sans text-slate-900 p-4 selection:bg-blue-200 overflow-hidden">
      
      {/* Background ambient gradients */}
      <div className="absolute top-[-10%] right-[-5%] w-[600px] h-[600px] bg-blue-100/50 rounded-full blur-[100px] pointer-events-none"></div>
      <div className="absolute bottom-[-10%] left-[-5%] w-[600px] h-[600px] bg-indigo-50/50 rounded-full blur-[100px] pointer-events-none"></div>

      {/* --- Top Navigation --- */}
      <div className="absolute top-0 left-0 w-full px-6 sm:px-10 py-8 flex justify-between items-center z-20">
        <div className="flex items-center gap-4">
          <img src="/logo.png" alt="MediBridge" className="h-14 sm:h-16 w-auto object-contain drop-shadow-sm" />
        </div>
        <div className="hidden sm:flex gap-8 text-[15px] font-medium text-slate-600">
          <a href="#" className="hover:text-slate-900 transition-colors">Support</a>
          <a href="#" className="hover:text-slate-900 transition-colors">Privacy Policy</a>
        </div>
      </div>

      {/* --- Main Login Card --- */}
      <motion.div
        initial={{ opacity: 0, scale: 0.97, y: 10 }}
        animate={{
          opacity: 1,
          scale: 1,
          y: 0,
          x: error ? [-5, 5, -3, 3, 0] : 0 
        }}
        transition={{ duration: 0.5, type: "spring", stiffness: 120 }}
        className="relative z-10 w-full max-w-[440px] bg-white rounded-[2rem] p-8 sm:p-10 shadow-[0_8px_40px_rgba(0,0,0,0.04)] border border-white/60"
      >
        <div className="text-center mb-8">
          <h1 className="text-[28px] font-bold text-slate-900 mb-1.5">
            {isLogin ? 'Welcome Back' : 'Create Account'}
          </h1>
          <p className="text-slate-500 text-[15px] font-medium">
            {isLogin ? 'Clinical workspace for verified practitioners' : 'Join the secure medical network'}
          </p>
        </div>

        {/* OAuth Buttons */}
        <div className="space-y-3 mb-7">
          <button 
            type="button" 
            onClick={handleGoogleSignIn}
            className="w-full flex items-center justify-center gap-3 border border-slate-200 rounded-xl py-3 text-[14px] font-semibold text-slate-700 hover:bg-slate-50 transition-colors shadow-sm"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 488 512" className="w-[18px] h-[18px]">
              <path fill="#4285F4" d="M486.25 256.45c0-17.35-1.55-34.1-4.45-50.45H244v95.45h135.9c-5.85 30.9-23.35 57.1-48.45 74.65v61.95h78.45c45.95-42.3 76.35-104.7 76.35-181.6z"/>
              <path fill="#34A853" d="M244 504c68.1 0 125.3-22.5 167.1-61.05l-78.45-61.95c-22.65 15.2-51.6 24.2-88.65 24.2-68.1 0-125.8-46.05-146.4-107.95H17.75v63.75C59.45 444 144.5 504 244 504z"/>
              <path fill="#FBBC05" d="M97.6 302.25c-5.3-15.8-8.25-32.6-8.25-49.8s2.95-34 8.25-49.8v-63.75H17.75C6.45 174.6 0 214.2 0 256.45s6.45 81.85 17.75 117.55l79.85-61.75z"/>
              <path fill="#EA4335" d="M244 100.8c37.1 0 70.4 12.8 96.8 38.05l72.6-72.6C369.3 26.15 312.1 0 244 0 144.5 0 59.45 60 17.75 143.05l79.85 63.75C118.2 144.85 175.9 100.8 244 100.8z"/>
            </svg>
            Sign in with Google
          </button>
          <button 
            type="button" 
            onClick={handleAppleSignIn}
            className="w-full flex items-center justify-center gap-3 bg-[#18181b] text-white rounded-xl py-3 text-[14px] font-semibold hover:bg-black transition-colors shadow-sm"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 384 512" className="w-[18px] h-[18px] fill-current">
              <path d="M318.7 268.7c-.2-36.7 16.4-64.4 50-84.8-18.8-26.9-47.2-41.7-84.7-44.6-35.5-2.8-74.3 20.7-88.5 20.7-15 0-49.4-19.7-76.4-19.7C63.3 141.2 4 184.8 4 273.5q0 39.3 14.4 81.2c12.8 36.7 59 126.7 107.2 125.2 25.2-.6 43-17.9 75.8-17.9 31.8 0 48.3 17.9 76.4 17.9 48.6-.7 90.4-82.5 102.6-119.3-65.2-30.7-61.7-90-61.7-91.9zm-56.6-164.2c27.3-32.4 24.8-61.9 24-72.5-24.1 1.4-52 16.4-67.9 34.9-17.5 19.8-27.8 44.3-25.6 71.9 26.1 2 49.9-11.4 69.5-34.3z"/>
            </svg>
            Sign in with Apple
          </button>
        </div>

        {/* Divider */}
        <div className="flex items-center gap-4 mb-7">
          <div className="flex-1 h-[1px] bg-slate-200"></div>
          <span className="text-[10px] font-bold tracking-widest text-slate-400 uppercase">Or secure email</span>
          <div className="flex-1 h-[1px] bg-slate-200"></div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <AnimatePresence mode="wait">
            {!isLogin && (
              <motion.div 
                key="signup-fields"
                initial={{ opacity: 0, height: 0 }} 
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="space-y-5 overflow-hidden"
              >
                {/* Custom Role Selector Toggle */}
                <div className="flex p-1 bg-[#f4f5f7] rounded-xl">
                  <button
                    type="button"
                    onClick={() => setRole('patient')}
                    className={`flex-1 py-2 text-[13px] font-semibold rounded-lg transition-all ${
                      role === 'patient'
                        ? 'bg-white text-slate-900 shadow-sm border border-slate-200/50'
                        : 'text-slate-500 hover:text-slate-700'
                    }`}
                  >
                    Patient
                  </button>
                  <button
                    type="button"
                    onClick={() => setRole('doctor')}
                    className={`flex-1 py-2 text-[13px] font-semibold rounded-lg transition-all ${
                      role === 'doctor'
                        ? 'bg-white text-slate-900 shadow-sm border border-slate-200/50'
                        : 'text-slate-500 hover:text-slate-700'
                    }`}
                  >
                    Doctor
                  </button>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2">
                    Full Name
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Dr. John Smith"
                    value={formData.name}
                    onChange={(e) => { setError(''); setFormData({ ...formData, name: e.target.value }); }}
                    className="w-full bg-[#f4f5f7] border-transparent focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-100 rounded-xl h-[46px] px-4 text-[15px] transition-all outline-none"
                  />
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <div>
            <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2">
              Email Address
            </label>
            <input
              type="email"
              required
              placeholder="dr.smith@medibridge.com"
              value={formData.email}
              onChange={(e) => { setError(''); setFormData({ ...formData, email: e.target.value }); }}
              className="w-full bg-[#f4f5f7] border-2 border-transparent focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 rounded-xl h-[46px] px-4 text-[15px] placeholder:text-slate-400 transition-all outline-none"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                Password
              </label>
              {isLogin && (
                <a href="#" className="text-[12px] font-semibold text-blue-600 hover:text-blue-700 transition-colors">
                  Forgot Password?
                </a>
              )}
            </div>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                required
                placeholder="••••••••"
                value={formData.password}
                onChange={(e) => { setError(''); setFormData({ ...formData, password: e.target.value }); }}
                className="w-full bg-[#f4f5f7] border-2 border-transparent focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 rounded-xl h-[46px] px-4 pr-12 text-[15px] placeholder:text-slate-400 tracking-widest transition-all outline-none"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors focus:outline-none"
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <AnimatePresence>
            {error && (
              <motion.div 
                initial={{ opacity: 0, y: -10 }} 
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, height: 0 }}
                className="text-red-500 text-sm text-center font-medium bg-red-50 p-3 rounded-lg"
              >
                {error}
              </motion.div>
            )}
          </AnimatePresence>

          <button 
            type="submit" 
            disabled={isLoading}
            className="w-full h-[52px] bg-[#3b59df] hover:bg-[#2f4bc5] text-white rounded-xl font-semibold text-[15px] shadow-[0_8px_20px_rgba(59,89,223,0.25)] transition-all active:scale-[0.98] mt-2 flex items-center justify-center disabled:opacity-70"
          >
            {isLoading ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
            ) : (
              isLogin ? 'Enter App' : 'Create Account'
            )}
          </button>
        </form>

        <div className="mt-8 text-center">
          <p className="text-slate-500 text-[14px]">
            {isLogin ? "New to MediBridge?" : "Already a member?"}
            <button
              onClick={() => { setIsLogin(!isLogin); setError(''); }}
              className="text-blue-600 font-semibold ml-1.5 hover:text-blue-800 transition-colors"
            >
              {isLogin ? 'Create an account' : 'Sign in'}
            </button>
          </p>
        </div>
      </motion.div>

      {/* --- Bottom Footer --- */}
      <div className="absolute bottom-0 left-0 w-full px-8 py-8 flex flex-col md:flex-row justify-between items-center gap-6 z-20">
        
        {/* Copyright */}
        <div className="text-[10px] font-bold tracking-widest text-slate-500 uppercase order-3 md:order-1">
          © 2026 MEDIBRIDGE. THE ETHEREAL CLINIC FRAMEWORK.
        </div>

        {/* Bottom Links */}
        <div className="flex gap-6 text-[10px] font-bold tracking-widest text-slate-500 uppercase order-2 md:order-3">
          <a href="#" className="hover:text-slate-800 transition-colors">Privacy</a>
          <a href="#" className="hover:text-slate-800 transition-colors">Terms</a>
          <a href="#" className="hover:text-slate-800 transition-colors">Security</a>
        </div>
        
      </div>
    </div>
  );
}