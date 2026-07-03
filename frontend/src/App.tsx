import React, { useState, useEffect } from 'react';
import { Truck, LogOut, Sun, Moon, Sparkles, X, CheckCircle, AlertCircle, Info } from 'lucide-react';
import LandingPage from './components/LandingPage';
import AuthPage from './components/AuthPage';
import CustomerDashboard from './components/CustomerDashboard';
import AdminDashboard from './components/AdminDashboard';
import AgentDashboard from './components/AgentDashboard';
import OrderDetails from './components/OrderDetails';

interface Toast {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info';
}

function App() {
  const [token, setToken] = useState<string | null>(localStorage.getItem('token'));
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [activeView, setActiveView] = useState<'landing' | 'auth' | 'dashboard' | 'order-details'>('landing');
  const [trackingOrderId, setTrackingOrderId] = useState<string | null>(null);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [darkMode, setDarkMode] = useState(true);

  // Initialize Theme and Session Check
  useEffect(() => {
    // Standard Dark Mode initialization
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  useEffect(() => {
    if (token) {
      validateSession();
    } else {
      setCurrentUser(null);
    }
  }, [token]);

  const validateSession = async () => {
    try {
      const data = await apiFetch('/api/auth/me');
      setCurrentUser(data.user);
      setActiveView('dashboard');
    } catch (err: any) {
      console.warn('Session invalid, logging out:', err);
      handleLogout();
    }
  };

  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
    const id = Date.now().toString();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      removeToast(id);
    }, 4500);
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  // Global API Fetch wrapper
  const apiFetch = async (endpoint: string, options: any = {}) => {
    const headers = {
      'Content-Type': 'application/json',
      ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
      ...options.headers
    };

    const config = {
      ...options,
      headers
    };

    const response = await fetch(endpoint, config);
    const data = await response.json();

    if (!response.ok) {
      // Force logout on 401 unauthorized
      if (response.status === 401) {
        handleLogout();
        throw new Error('Your session expired. Please sign in again.');
      }
      throw new Error(data.error || 'Server error occurred.');
    }

    return data;
  };

  const handleLoginSuccess = (newToken: string, user: any) => {
    localStorage.setItem('token', newToken);
    setToken(newToken);
    setCurrentUser(user);
    showToast(`Signed in successfully as ${user.name}!`, 'success');
    setActiveView('dashboard');
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    setToken(null);
    setCurrentUser(null);
    setTrackingOrderId(null);
    setActiveView('landing');
    showToast('Signed out of session.', 'info');
  };

  const handleTrackOrder = (orderId: string) => {
    setTrackingOrderId(orderId);
    setActiveView('order-details');
  };

  const handleBackToDashboard = () => {
    setTrackingOrderId(null);
    setActiveView('dashboard');
  };

  return (
    <div className="min-h-screen bg-[#070913] text-slate-100 flex flex-col font-sans transition-colors duration-300">
      
      {/* Top Header - Rendered on logged-in portals and trackers */}
      {activeView !== 'landing' && (
        <header className="sticky top-0 z-40 glass-panel border-b border-white/5 bg-[#070913]/60 backdrop-blur-md">
          <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
            <div 
              onClick={() => {
                if (currentUser) {
                  setActiveView('dashboard');
                } else {
                  setActiveView('landing');
                }
              }}
              className="flex items-center gap-2.5 cursor-pointer"
            >
              <div className="bg-sky-500/10 p-2 rounded-lg border border-sky-500/25">
                <Truck className="h-5 w-5 text-sky-400" />
              </div>
              <span className="font-extrabold text-lg tracking-tight bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent">
                Velocity Logistics
              </span>
            </div>

            {/* Navigation links & status badge */}
            <div className="flex items-center gap-4">
              {currentUser && (
                <div className="hidden sm:flex items-center gap-2">
                  <span className="text-xs text-slate-400 font-semibold">{currentUser.name}</span>
                  <span className={`px-2 py-0.5 rounded text-[9px] font-bold border ${
                    currentUser.role === 'admin' ? 'bg-purple-500/10 text-purple-400 border-purple-500/20' :
                    currentUser.role === 'delivery_agent' ? 'bg-pink-500/10 text-pink-400 border-pink-500/20' :
                    'bg-sky-500/10 text-sky-400 border-sky-500/20'
                  }`}>
                    {currentUser.role.toUpperCase()}
                  </span>
                </div>
              )}

              {/* Theme Toggle */}
              <button
                onClick={() => setDarkMode(!darkMode)}
                className="p-2 text-slate-400 hover:text-white transition-colors cursor-pointer border border-white/5 rounded-lg bg-slate-900/50"
                title="Toggle Theme"
              >
                {darkMode ? <Sun className="h-4.5 w-4.5" /> : <Moon className="h-4.5 w-4.5" />}
              </button>

              {currentUser && currentUser.role !== 'delivery_agent' && (
                <button
                  onClick={handleLogout}
                  className="bg-slate-800 hover:bg-slate-700 text-white font-semibold text-xs transition-colors rounded-lg px-4 py-2 flex items-center gap-1.5 cursor-pointer"
                >
                  <LogOut className="h-4 w-4" /> Sign Out
                </button>
              )}
            </div>
          </div>
        </header>
      )}

      {/* Main View Router */}
      <main className="flex-1">
        {activeView === 'landing' && (
          <LandingPage 
            onGetStarted={() => setActiveView('auth')} 
            onLogin={() => setActiveView('auth')} 
          />
        )}

        {activeView === 'auth' && (
          <AuthPage 
            onLoginSuccess={handleLoginSuccess} 
            apiFetch={apiFetch} 
          />
        )}

        {activeView === 'dashboard' && currentUser && (
          <>
            {currentUser.role === 'customer' && (
              <CustomerDashboard 
                currentUser={currentUser} 
                apiFetch={apiFetch} 
                onTrackOrder={handleTrackOrder} 
                showToast={showToast} 
              />
            )}
            {currentUser.role === 'admin' && (
              <AdminDashboard 
                currentUser={currentUser} 
                apiFetch={apiFetch} 
                onTrackOrder={handleTrackOrder} 
                showToast={showToast} 
              />
            )}
            {currentUser.role === 'delivery_agent' && (
              <AgentDashboard 
                currentUser={currentUser} 
                apiFetch={apiFetch} 
                onTrackOrder={handleTrackOrder} 
                showToast={showToast} 
                onLogout={handleLogout} 
              />
            )}
          </>
        )}

        {activeView === 'order-details' && trackingOrderId && (
          <OrderDetails 
            orderId={trackingOrderId} 
            currentUser={currentUser} 
            apiFetch={apiFetch} 
            onBack={handleBackToDashboard} 
            showToast={showToast} 
          />
        )}
      </main>

      {/* Toast Notification Container */}
      <div className="fixed bottom-6 right-6 z-50 space-y-2.5 max-w-sm w-full">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className="bg-slate-900 border border-white/10 rounded-xl p-4 flex gap-3 shadow-2xl items-start text-left animate-slide-in"
          >
            {toast.type === 'success' && <CheckCircle className="h-5 w-5 text-emerald-400 flex-shrink-0 mt-0.5" />}
            {toast.type === 'error' && <AlertCircle className="h-5 w-5 text-rose-400 flex-shrink-0 mt-0.5" />}
            {toast.type === 'info' && <Info className="h-5 w-5 text-sky-400 flex-shrink-0 mt-0.5" />}
            
            <div className="flex-1 text-xs font-medium text-slate-200">
              {toast.message}
            </div>

            <button 
              onClick={() => removeToast(toast.id)}
              className="text-slate-500 hover:text-white transition-colors cursor-pointer"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

export default App;
