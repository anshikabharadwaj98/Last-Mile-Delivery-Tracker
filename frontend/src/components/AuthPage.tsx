import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Shield, Mail, Lock, User, Phone, MapPin, Building, FileText, CheckCircle, HelpCircle } from 'lucide-react';

interface AuthPageProps {
  onLoginSuccess: (token: string, user: any) => void;
  apiFetch: (endpoint: string, options?: any) => Promise<any>;
}

export default function AuthPage({ onLoginSuccess, apiFetch }: AuthPageProps) {
  const [mode, setMode] = useState<'login' | 'register-b2c' | 'register-b2b'>('login');
  const [banner, setBanner] = useState<{ type: 'success' | 'error' | 'info' | 'warning'; msg: string; link?: string; linkText?: string } | null>(null);
  
  // Form values
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [role, setRole] = useState('customer'); // customer or delivery_agent
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');

  // B2B values
  const [companyName, setCompanyName] = useState('');
  const [companyAddress, setCompanyAddress] = useState('');
  const [gstin, setGstin] = useState('');

  const [loading, setLoading] = useState(false);

  const showBanner = (type: 'success' | 'error' | 'info' | 'warning', msg: string, link?: string, linkText?: string) => {
    setBanner({ type, msg, link, linkText });
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setBanner(null);
    setLoading(true);
    try {
      const data = await apiFetch('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password })
      });
      onLoginSuccess(data.token, data.user);
    } catch (err: any) {
      if (err.message && err.message.toLowerCase().includes('verify your email')) {
        showBanner(
          'warning', 
          `${err.message}. If you did not receive the email, click below to request a new link.`,
          '#',
          'Resend verification email →'
        );
      } else {
        showBanner('error', `Login failed: ${err.message}`);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleRegisterB2C = async (e: React.FormEvent) => {
    e.preventDefault();
    setBanner(null);
    setLoading(true);
    try {
      const data = await apiFetch('/api/auth/register', {
        method: 'POST',
        body: JSON.stringify({
          name, email, password, role, phone, house_address: address
        })
      });
      setMode('login');
      const link = data.email_preview_url || data.verification_link;
      const linkText = data.email_preview_url ? 'Preview Ethereal Email →' : data.verification_link ? 'Verify Account Now →' : undefined;
      showBanner('success', `Account created successfully! ${data.message}`, link, linkText);
    } catch (err: any) {
      showBanner('error', `Registration failed: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleRegisterB2B = async (e: React.FormEvent) => {
    e.preventDefault();
    setBanner(null);
    setLoading(true);
    try {
      const data = await apiFetch('/api/auth/register', {
        method: 'POST',
        body: JSON.stringify({
          company_name: companyName,
          company_address: companyAddress,
          email, password, phone, gstin, role: 'customer'
        })
      });
      setMode('login');
      const link = data.email_preview_url || data.verification_link;
      const linkText = data.email_preview_url ? 'Preview Ethereal Email →' : data.verification_link ? 'Verify Account Now →' : undefined;
      showBanner('success', `Business Account created successfully! ${data.message}`, link, linkText);
    } catch (err: any) {
      showBanner('error', `B2B Registration failed: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (!email) {
      showBanner('warning', 'Please input your email address in the field first.');
      return;
    }
    setBanner({ type: 'info', msg: 'Sending new verification email...' });
    try {
      const data = await apiFetch('/api/auth/resend-verification', {
        method: 'POST',
        body: JSON.stringify({ email })
      });
      if (data.alreadyVerified) {
        showBanner('success', 'Account is already verified. You can sign in now.');
        return;
      }
      const link = data.email_preview_url || data.verification_link;
      const linkText = data.email_preview_url ? 'Preview Ethereal Email →' : data.verification_link ? 'Verify Account Now →' : undefined;
      showBanner('success', `A new verification email has been sent! ${data.message}`, link, linkText);
    } catch (err: any) {
      showBanner('error', `Failed to send link: ${err.message}`);
    }
  };

  return (
    <div className="min-h-screen text-slate-100 bg-[#070913] relative overflow-hidden font-sans flex items-center justify-center px-4 py-20">
      {/* Background decoration */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_60%_60%_at_50%_50%,rgba(99,102,241,0.1),rgba(255,255,255,0))] pointer-events-none" />
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.01)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.01)_1px,transparent_1px)] bg-[size:30px_30px]" />

      <div className="w-full max-w-lg z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="glass-panel rounded-2xl p-6 md:p-8 bg-slate-950/40 border border-white/5 shadow-2xl relative"
        >
          {/* Header */}
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold text-white tracking-tight">
              {mode === 'login' && 'Sign In to Operations'}
              {mode === 'register-b2c' && 'Register Individual Account'}
              {mode === 'register-b2b' && 'Register Business Account'}
            </h2>
            <p className="text-slate-400 text-xs mt-1.5">
              {mode === 'login' && 'Sign in to access your customized logistics portal'}
              {mode === 'register-b2c' && 'Create a B2C account to place and track shipments'}
              {mode === 'register-b2b' && 'Register company details for B2B contract shipping'}
            </p>
          </div>

          {/* Banner */}
          <AnimatePresence>
            {banner && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className={`mb-6 p-4.5 rounded-lg border text-xs text-left ${
                  banner.type === 'success' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' :
                  banner.type === 'error' ? 'bg-red-500/10 border-red-500/20 text-red-400' :
                  banner.type === 'warning' ? 'bg-amber-500/10 border-amber-500/20 text-amber-400' :
                  'bg-blue-500/10 border-blue-500/20 text-blue-400'
                }`}
              >
                <div>{banner.msg}</div>
                {banner.link && (
                  <div className="mt-2 text-right">
                    <a 
                      href={banner.link} 
                      target="_blank" 
                      rel="noopener noreferrer" 
                      onClick={(e) => {
                        if (banner.link === '#') {
                          e.preventDefault();
                          handleResend();
                        }
                      }}
                      className="font-bold underline cursor-pointer"
                    >
                      {banner.linkText || 'Click here'}
                    </a>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Login Form */}
          {mode === 'login' && (
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-1.5 text-left">
                <label className="text-xs font-semibold text-slate-400" htmlFor="email">Email Address</label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-500" />
                  <input
                    type="email"
                    id="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-slate-900 border border-white/5 rounded-lg pl-10 pr-4 py-2.5 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-sky-500 transition-colors"
                    placeholder="name@company.com"
                  />
                </div>
              </div>

              <div className="space-y-1.5 text-left">
                <label className="text-xs font-semibold text-slate-400" htmlFor="password">Password</label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-500" />
                  <input
                    type="password"
                    id="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-slate-900 border border-white/5 rounded-lg pl-10 pr-4 py-2.5 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-sky-500 transition-colors"
                    placeholder="••••••••"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-sky-500 hover:bg-sky-400 disabled:bg-sky-500/50 text-white font-semibold rounded-lg py-3 text-xs transition-colors cursor-pointer flex items-center justify-center gap-1.5 shadow-lg shadow-sky-500/10"
              >
                {loading ? 'Signing In...' : 'Sign In'}
              </button>

              <div className="pt-4 text-center border-t border-white/5 text-[11px] text-slate-400">
                Don't have an account?{' '}
                <button
                  type="button"
                  onClick={() => setMode('register-b2c')}
                  className="text-sky-400 hover:text-sky-300 font-semibold cursor-pointer underline"
                >
                  Register here
                </button>
              </div>
            </form>
          )}

          {/* B2C Registration Form */}
          {mode === 'register-b2c' && (
            <form onSubmit={handleRegisterB2C} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5 text-left">
                  <label className="text-xs font-semibold text-slate-400" htmlFor="reg-name">Full Name</label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-500" />
                    <input
                      type="text"
                      id="reg-name"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full bg-slate-900 border border-white/5 rounded-lg pl-9 pr-3 py-2 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-sky-500 transition-colors"
                      placeholder="John Doe"
                    />
                  </div>
                </div>
                
                <div className="space-y-1.5 text-left">
                  <label className="text-xs font-semibold text-slate-400" htmlFor="reg-role">Account Type</label>
                  <select
                    id="reg-role"
                    required
                    value={role}
                    onChange={(e) => setRole(e.target.value)}
                    className="w-full bg-slate-900 border border-white/5 rounded-lg px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-sky-500 transition-colors h-[38px]"
                  >
                    <option value="customer">Customer (Place shipments)</option>
                    <option value="delivery_agent">Delivery Agent (Fleet)</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1.5 text-left">
                <label className="text-xs font-semibold text-slate-400" htmlFor="reg-email">Email Address</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-500" />
                  <input
                    type="email"
                    id="reg-email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-slate-900 border border-white/5 rounded-lg pl-9 pr-3 py-2 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-sky-500 transition-colors"
                    placeholder="name@example.com"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5 text-left">
                  <label className="text-xs font-semibold text-slate-400" htmlFor="reg-password">Password</label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-500" />
                    <input
                      type="password"
                      id="reg-password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full bg-slate-900 border border-white/5 rounded-lg pl-9 pr-3 py-2 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-sky-500 transition-colors"
                      placeholder="••••••••"
                    />
                  </div>
                </div>

                <div className="space-y-1.5 text-left">
                  <label className="text-xs font-semibold text-slate-400" htmlFor="reg-phone">Phone Number</label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-500" />
                    <input
                      type="tel"
                      id="reg-phone"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="w-full bg-slate-900 border border-white/5 rounded-lg pl-9 pr-3 py-2 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-sky-500 transition-colors"
                      placeholder="+9199990000"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-1.5 text-left">
                <label className="text-xs font-semibold text-slate-400" htmlFor="reg-address">House Address</label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-500" />
                  <input
                    type="text"
                    id="reg-address"
                    required
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    className="w-full bg-slate-900 border border-white/5 rounded-lg pl-9 pr-3 py-2 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-sky-500 transition-colors"
                    placeholder="123 Main St, Apartment 4B"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-sky-500 hover:bg-sky-400 disabled:bg-sky-500/50 text-white font-semibold rounded-lg py-3 text-xs transition-colors cursor-pointer shadow-lg shadow-sky-500/10"
              >
                {loading ? 'Creating Account...' : 'Create Account'}
              </button>

              <div className="pt-4 text-center border-t border-white/5 text-[11px] text-slate-400 flex flex-col gap-2">
                <div>
                  Are you a business?{' '}
                  <button
                    type="button"
                    onClick={() => setMode('register-b2b')}
                    className="text-sky-400 hover:text-sky-300 font-semibold cursor-pointer underline"
                  >
                    Register B2B Account →
                  </button>
                </div>
                <div>
                  Already have an account?{' '}
                  <button
                    type="button"
                    onClick={() => setMode('login')}
                    className="text-sky-400 hover:text-sky-300 font-semibold cursor-pointer underline"
                  >
                    Login here
                  </button>
                </div>
              </div>
            </form>
          )}

          {/* B2B Registration Form */}
          {mode === 'register-b2b' && (
            <form onSubmit={handleRegisterB2B} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5 text-left">
                  <label className="text-xs font-semibold text-slate-400" htmlFor="reg-b2b-company">Company Name</label>
                  <div className="relative">
                    <Building className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-500" />
                    <input
                      type="text"
                      id="reg-b2b-company"
                      required
                      value={companyName}
                      onChange={(e) => setCompanyName(e.target.value)}
                      className="w-full bg-slate-900 border border-white/5 rounded-lg pl-9 pr-3 py-2 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-sky-500 transition-colors"
                      placeholder="Acme Corp"
                    />
                  </div>
                </div>

                <div className="space-y-1.5 text-left">
                  <label className="text-xs font-semibold text-slate-400" htmlFor="reg-b2b-gstin">GSTIN Number (Optional)</label>
                  <div className="relative">
                    <FileText className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-500" />
                    <input
                      type="text"
                      id="reg-b2b-gstin"
                      value={gstin}
                      onChange={(e) => setGstin(e.target.value)}
                      className="w-full bg-slate-900 border border-white/5 rounded-lg pl-9 pr-3 py-2 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-sky-500 transition-colors"
                      placeholder="07AAAAA1111A1Z1"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-1.5 text-left">
                <label className="text-xs font-semibold text-slate-400" htmlFor="reg-b2b-address">Company Address</label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-500" />
                  <input
                    type="text"
                    id="reg-b2b-address"
                    required
                    value={companyAddress}
                    onChange={(e) => setCompanyAddress(e.target.value)}
                    className="w-full bg-slate-900 border border-white/5 rounded-lg pl-9 pr-3 py-2 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-sky-500 transition-colors"
                    placeholder="456 Corporate Blvd, Suite 100"
                  />
                </div>
              </div>

              <div className="space-y-1.5 text-left">
                <label className="text-xs font-semibold text-slate-400" htmlFor="reg-b2b-email">Company Email</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-500" />
                  <input
                    type="email"
                    id="reg-b2b-email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-slate-900 border border-white/5 rounded-lg pl-9 pr-3 py-2 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-sky-500 transition-colors"
                    placeholder="contact@company.com"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5 text-left">
                  <label className="text-xs font-semibold text-slate-400" htmlFor="reg-b2b-password">Password</label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-500" />
                    <input
                      type="password"
                      id="reg-b2b-password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full bg-slate-900 border border-white/5 rounded-lg pl-9 pr-3 py-2 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-sky-500 transition-colors"
                      placeholder="••••••••"
                    />
                  </div>
                </div>

                <div className="space-y-1.5 text-left">
                  <label className="text-xs font-semibold text-slate-400" htmlFor="reg-b2b-phone">Company Phone (Optional)</label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-500" />
                    <input
                      type="tel"
                      id="reg-b2b-phone"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="w-full bg-slate-900 border border-white/5 rounded-lg pl-9 pr-3 py-2 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-sky-500 transition-colors"
                      placeholder="+15550100"
                    />
                  </div>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-sky-500 hover:bg-sky-400 disabled:bg-sky-500/50 text-white font-semibold rounded-lg py-3 text-xs transition-colors cursor-pointer shadow-lg shadow-sky-500/10"
              >
                {loading ? 'Creating Business Account...' : 'Create B2B Account'}
              </button>

              <div className="pt-4 text-center border-t border-white/5 text-[11px] text-slate-400 flex flex-col gap-2">
                <div>
                  Are you an individual customer?{' '}
                  <button
                    type="button"
                    onClick={() => setMode('register-b2c')}
                    className="text-sky-400 hover:text-sky-300 font-semibold cursor-pointer underline"
                  >
                    Register as B2C Customer →
                  </button>
                </div>
                <div>
                  Already have an account?{' '}
                  <button
                    type="button"
                    onClick={() => setMode('login')}
                    className="text-sky-400 hover:text-sky-300 font-semibold cursor-pointer underline"
                  >
                    Login here
                  </button>
                </div>
              </div>
            </form>
          )}
        </motion.div>
      </div>
    </div>
  );
}
