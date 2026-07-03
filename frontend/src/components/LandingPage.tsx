import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ArrowRight, Shield, Zap, Compass, RefreshCw, BarChart3, Users, 
  MapPin, Scale, ChevronRight, HelpCircle, Truck, Package, 
  CheckCircle2, DollarSign, Activity, FileText
} from 'lucide-react';

interface LandingPageProps {
  onGetStarted: () => void;
  onLogin: () => void;
}

export default function LandingPage({ onGetStarted, onLogin }: LandingPageProps) {
  const [activeTab, setActiveTab] = useState<'customer' | 'admin' | 'agent'>('admin');
  const [trackingStep, setTrackingStep] = useState(0);

  // Auto-cycle the live tracking simulator
  useEffect(() => {
    const timer = setInterval(() => {
      setTrackingStep((prev) => (prev + 1) % 6);
    }, 3000);
    return () => clearInterval(timer);
  }, []);

  const trackingStages = [
    { title: 'Order Created', desc: 'System logged request', icon: FileText, color: 'text-blue-400', bg: 'bg-blue-500/10' },
    { title: 'Agent Assigned', desc: 'Intelligent zone mapping', icon: Users, color: 'text-purple-400', bg: 'bg-purple-500/10' },
    { title: 'Picked Up', desc: 'Package verified & loaded', icon: Package, color: 'text-indigo-400', bg: 'bg-indigo-500/10' },
    { title: 'In Transit', desc: 'Moving between hubs', icon: Truck, color: 'text-amber-400', bg: 'bg-amber-500/10' },
    { title: 'Out for Delivery', desc: 'Agent reaching customer', icon: Compass, color: 'text-pink-400', bg: 'bg-pink-500/10' },
    { title: 'Delivered', desc: 'Secure handoff completed', icon: CheckCircle2, color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
  ];

  const brands = [
    'Delhivery', 'Stripe', 'Uber Logistics', 'Vercel', 'Linear', 
    'Notion', 'Shiprocket', 'Apple Supply', 'DHL Express'
  ];

  const features = [
    {
      icon: Zap,
      title: 'Dynamic Pricing Engine',
      desc: 'Real-time calculation factoring in physical weight, volumetric weight (L×B×H/5000), zones, and payment method surcharges.'
    },
    {
      icon: Compass,
      title: 'Geofenced Zone Management',
      desc: 'Automated dispatching relying on geofenced operational zones and precise coordinates matching pickup to dropoff.'
    },
    {
      icon: Users,
      title: 'Intelligent Auto-Assignment',
      desc: 'Dispatches orders instantly to the closest available delivery agent residing in the pickup zone using spatial geofencing.'
    },
    {
      icon: Shield,
      title: 'Enterprise Safety & RBAC',
      desc: 'Role-based access controls isolating portals for customers, administrators, and courier fleets with strict audit trail logs.'
    },
    {
      icon: BarChart3,
      title: 'Operational Control Center',
      desc: 'Real-time telemetry, active delivery heatmaps, and automatic email notification logs for complete dispatch visibility.'
    },
    {
      icon: RefreshCw,
      title: 'Seamless Self-Rescheduling',
      desc: 'Empowers B2B & B2C customers to schedule delivery attempts after failures, immediately updating the fleet assignment queue.'
    }
  ];

  const faqs = [
    {
      q: 'How does the auto-assignment logic choose a delivery agent?',
      a: 'The engine uses real-time GPS locations from agent devices. When a shipment is placed, it identifies the pickup zone and triggers auto-assignment to the closest active agent currently registered in that zone. If no active agent is free, it falls back to manual admin dispatch.'
    },
    {
      q: 'What is the pricing model for shipments?',
      a: 'Pricing is dynamically computed using rate card rules. The system evaluates the pickup and drop zones (intra-zone vs inter-zone routes) and determines the chargeable weight (the greater of actual weight and volumetric dimensions L×B×H/5000). Payment type additions (e.g. COD surcharges) are applied automatically.'
    },
    {
      q: 'Can customers schedule shipments for future dates?',
      a: 'Yes. If a delivery attempt fails (due to customer unavailability or incorrect address), the customer can select a new date via their portal. The system instantly resets the shipment status and schedules it for auto-dispatch on that day.'
    },
    {
      q: 'How do notification audit logs work?',
      a: 'Every major status transition (e.g., Assigned, In Transit, Out for Delivery, Delivered) fires automated updates. The admin portal contains an audit log displaying the exact email and SMS content delivered to recipients, as well as offline logs recorded on the server.'
    }
  ];

  return (
    <div className="min-h-screen text-slate-100 bg-[#070913] relative overflow-hidden font-sans">
      {/* Background Effects */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(120,119,198,0.2),rgba(255,255,255,0))] z-0" />
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.015)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.015)_1px,transparent_1px)] bg-[size:40px_40px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_40%,#000_70%,transparent_100%)] z-0" />
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-sky-500/10 blur-[120px] pointer-events-none" />
      <div className="absolute top-[20%] right-[-10%] w-[50%] h-[50%] rounded-full bg-indigo-500/10 blur-[120px] pointer-events-none" />

      {/* Navigation */}
      <header className="fixed top-0 left-0 right-0 z-50 glass-panel border-b border-white/5 bg-slate-950/40 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="bg-sky-500/10 p-2 rounded-lg border border-sky-500/20">
              <Truck className="h-5 w-5 text-sky-400" />
            </div>
            <span className="font-bold text-lg tracking-tight bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent">
              Velocity Logistics
            </span>
          </div>

          <div className="flex items-center gap-4">
            <button 
              onClick={onLogin}
              className="text-slate-300 hover:text-white font-medium text-sm transition-colors cursor-pointer px-4 py-2"
            >
              Sign In
            </button>
            <button 
              onClick={onGetStarted}
              className="bg-white hover:bg-slate-100 text-slate-950 font-semibold text-sm transition-all rounded-lg px-4.5 py-2 flex items-center gap-1.5 shadow-lg shadow-white/5 hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
            >
              Get Started <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-6 relative z-10">
        <div className="max-w-7xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="inline-flex items-center gap-2 bg-sky-500/10 border border-sky-500/20 rounded-full px-4 py-1.5 mb-8"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-sky-400 animate-pulse" />
            <span className="text-xs font-semibold text-sky-400 tracking-wider uppercase">Next-Gen SaaS Platform</span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.1 }}
            className="text-5xl md:text-7xl font-extrabold tracking-tight mb-6 max-w-4xl mx-auto leading-[1.1] bg-gradient-to-b from-white via-slate-100 to-slate-500 bg-clip-text text-transparent"
          >
            Autonomous Last-Mile Delivery Tracker
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="text-base md:text-xl text-slate-400 max-w-2xl mx-auto mb-10 leading-relaxed"
          >
            A high-precision logistics platform. Real-time geofenced routing, automated agent dispatching, dynamic pricing, and role-based portal operations. Built for the modern enterprise.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.3 }}
            className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-16"
          >
            <button
              onClick={onGetStarted}
              className="w-full sm:w-auto bg-sky-500 hover:bg-sky-400 text-white font-semibold rounded-lg px-8 py-3.5 flex items-center justify-center gap-2 shadow-lg shadow-sky-500/20 hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer"
            >
              Enterprise Deployment <ArrowRight className="h-4.5 w-4.5" />
            </button>
            <button
              onClick={onLogin}
              className="w-full sm:w-auto glass-panel hover:bg-white/5 border border-white/10 text-white font-semibold rounded-lg px-8 py-3.5 hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer"
            >
              Sign In to Dashboard
            </button>
          </motion.div>

          {/* Interactive Hero Graphic (Moving Packages & Routes) */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1, delay: 0.4 }}
            className="max-w-5xl mx-auto glass-panel border border-white/5 rounded-2xl p-4 shadow-2xl relative overflow-hidden bg-slate-900/30"
          >
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-transparent to-transparent z-10" />
            <div className="flex items-center gap-2 border-b border-white/5 pb-3 mb-4 text-xs text-slate-500 px-2">
              <span className="w-2.5 h-2.5 rounded-full bg-red-500/70" />
              <span className="w-2.5 h-2.5 rounded-full bg-yellow-500/70" />
              <span className="w-2.5 h-2.5 rounded-full bg-green-500/70" />
              <span className="ml-2 font-mono bg-white/5 rounded px-2 py-0.5 text-slate-400">velocity-dashboard.company.com</span>
            </div>

            {/* Dynamic Map and Route Graphic */}
            <div className="h-[280px] md:h-[400px] rounded-xl bg-slate-950/70 relative border border-white/5 overflow-hidden flex items-center justify-center">
              <svg className="absolute inset-0 w-full h-full stroke-slate-800" fill="none">
                <defs>
                  <linearGradient id="routeGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#0ea5e9" stopOpacity="0.2" />
                    <stop offset="50%" stopColor="#6366f1" stopOpacity="1" />
                    <stop offset="100%" stopColor="#ec4899" stopOpacity="0.2" />
                  </linearGradient>
                </defs>
                <path d="M 100 150 C 200 80, 300 280, 500 200 C 650 120, 800 320, 900 180" stroke="url(#routeGrad)" strokeWidth="3" strokeDasharray="8 6" />
                <path d="M 200 320 Q 400 120, 700 280" stroke="rgba(14, 165, 233, 0.3)" strokeWidth="2" />
              </svg>

              {/* Animated Floating Package along route */}
              <motion.div
                animate={{
                  x: [0, 800],
                  y: [0, 40]
                }}
                transition={{
                  repeat: Infinity,
                  duration: 8,
                  ease: 'easeInOut'
                }}
                className="absolute top-[130px] left-[100px] bg-indigo-500 text-white rounded-lg p-2 flex items-center gap-2 shadow-lg z-20"
              >
                <Package className="h-4 w-4" />
                <span className="text-[10px] font-mono tracking-wider font-semibold">SHIP-792B</span>
              </motion.div>

              {/* Grid Points */}
              <div className="absolute top-[80px] left-[200px] flex flex-col items-center">
                <span className="w-2.5 h-2.5 rounded-full bg-sky-400 ring-4 ring-sky-400/20" />
                <span className="text-[10px] font-semibold text-sky-400 bg-sky-950/80 px-2 py-0.5 rounded mt-1.5 border border-sky-400/25">Hub Alpha</span>
              </div>

              <div className="absolute top-[280px] left-[500px] flex flex-col items-center">
                <span className="w-2.5 h-2.5 rounded-full bg-pink-400 ring-4 ring-pink-400/20" />
                <span className="text-[10px] font-semibold text-pink-400 bg-pink-950/80 px-2 py-0.5 rounded mt-1.5 border border-pink-400/25">Fleet 4 (In Transit)</span>
              </div>

              <div className="absolute top-[180px] left-[900px] flex flex-col items-center">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 ring-4 ring-emerald-400/20" />
                <span className="text-[10px] font-semibold text-emerald-400 bg-emerald-950/80 px-2 py-0.5 rounded mt-1.5 border border-emerald-400/25">Destination</span>
              </div>

              {/* floating metric card */}
              <div className="absolute bottom-6 left-6 glass-panel border border-white/10 rounded-xl p-4 text-left max-w-[200px] hidden md:block">
                <div className="text-[10px] text-slate-400 uppercase tracking-widest font-bold">Auto Assignment</div>
                <div className="text-xl font-bold text-sky-400 mt-1">98.2%</div>
                <div className="text-[10px] text-slate-500 mt-0.5">Success Rate in Zone-A</div>
              </div>

              <div className="absolute top-6 right-6 glass-panel border border-white/10 rounded-xl p-4 text-left max-w-[200px] hidden md:block">
                <div className="text-[10px] text-slate-400 uppercase tracking-widest font-bold">Active Fleet</div>
                <div className="text-xl font-bold text-emerald-400 mt-1">428 Agents</div>
                <div className="text-[10px] text-slate-500 mt-0.5">Locations Online</div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Trusted By Section */}
      <section className="py-12 border-y border-white/5 bg-slate-950/40 relative z-10 overflow-hidden">
        <div className="max-w-7xl mx-auto px-6">
          <p className="text-center text-xs uppercase tracking-widest font-bold text-slate-500 mb-6">
            TRUSTED BY THE WORLD'S LEADING OPERATIONS TEAMS
          </p>
          <div className="flex gap-12 justify-around items-center opacity-40 grayscale hover:grayscale-0 transition-all">
            {brands.map((brand, i) => (
              <span key={i} className="font-mono text-sm md:text-base font-bold tracking-tight text-slate-300">
                {brand}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* Platform Overview Section (Animated Tabs) */}
      <section className="py-24 px-6 relative z-10">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-bold tracking-tight mb-4">
              Three Portals. One High-End Design System.
            </h2>
            <p className="text-slate-400 max-w-xl mx-auto">
              Customized visual experiences tailored for the unique responsibilities of administrators, customers, and field couriers.
            </p>
          </div>

          {/* Animated Tabs */}
          <div className="flex justify-center p-1 bg-slate-900/60 border border-white/5 rounded-xl max-w-lg mx-auto mb-12">
            {(['customer', 'admin', 'agent'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`flex-1 py-2.5 rounded-lg text-sm font-semibold capitalize transition-all cursor-pointer ${
                  activeTab === tab 
                    ? 'bg-slate-800 text-white shadow-md' 
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {tab === 'agent' ? 'Delivery Agent' : `${tab} portal`}
              </button>
            ))}
          </div>

          {/* Tab Content Mockups */}
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.4 }}
              className="glass-panel border border-white/5 rounded-2xl p-6 md:p-8 max-w-5xl mx-auto bg-slate-955/20"
            >
              {activeTab === 'customer' && (
                <div className="grid md:grid-cols-2 gap-8 items-center">
                  <div>
                    <span className="text-xs font-bold tracking-wider text-sky-400 uppercase">Customer Portal</span>
                    <h3 className="text-2xl md:text-3xl font-extrabold mt-2 mb-4">Elegant Package Tracking</h3>
                    <p className="text-slate-400 text-sm leading-relaxed mb-6">
                      A minimal checkout experience for courier booking. Offers automated dimension-based price quotes, simple credit/COD payment selectors, beautiful timeline tracker, route drawing, and self-service rescheduling.
                    </p>
                    <ul className="space-y-3 text-sm text-slate-300">
                      <li className="flex items-center gap-2.5"><CheckCircle2 className="h-4.5 w-4.5 text-sky-400" /> Auto-pricing based on volumetric weight</li>
                      <li className="flex items-center gap-2.5"><CheckCircle2 className="h-4.5 w-4.5 text-sky-400" /> Interactive live timeline details</li>
                      <li className="flex items-center gap-2.5"><CheckCircle2 className="h-4.5 w-4.5 text-sky-400" /> Failed delivery self-rescheduling</li>
                    </ul>
                  </div>
                  <div className="bg-slate-900/80 rounded-xl border border-white/5 p-5 font-mono text-[11px] text-slate-400 max-h-[300px] overflow-hidden">
                    <div className="flex items-center justify-between border-b border-white/5 pb-2.5 mb-4">
                      <span className="font-bold text-white">📦 SHIPMENT #10842</span>
                      <span className="bg-sky-400/10 text-sky-400 px-2 py-0.5 rounded text-[10px]">IN TRANSIT</span>
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between"><span>Pickup Address:</span><span className="text-white">Connaught Place, New Delhi</span></div>
                      <div className="flex justify-between"><span>Dropoff Address:</span><span className="text-white">Saket, New Delhi</span></div>
                      <div className="flex justify-between"><span>Weight/Volume:</span><span className="text-white">2.5 kg (L: 15cm W: 12cm H: 10cm)</span></div>
                      <div className="flex justify-between"><span>Price Breakdown:</span><span className="text-emerald-400 font-bold">$48.50 (Prepaid)</span></div>
                    </div>
                    <div className="mt-5 pt-3 border-t border-white/5">
                      <div className="text-[10px] text-slate-500 uppercase tracking-widest font-bold mb-2">Delivery Progress</div>
                      <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                        <div className="bg-sky-500 h-full w-2/3" />
                      </div>
                      <div className="flex justify-between mt-1 text-[9px] text-slate-500">
                        <span>Booked</span>
                        <span>Picked Up</span>
                        <span className="text-sky-400">Hub Transit</span>
                        <span>Delivered</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'admin' && (
                <div className="grid md:grid-cols-2 gap-8 items-center">
                  <div>
                    <span className="text-xs font-bold tracking-wider text-purple-400 uppercase">Admin Portal</span>
                    <h3 className="text-2xl md:text-3xl font-extrabold mt-2 mb-4">Mission Control Operations</h3>
                    <p className="text-slate-400 text-sm leading-relaxed mb-6">
                      A central cockpit engineered for scale. Manage rates, define geofenced operational zones, assign areas, track notification logs, and oversee the live agent fleet telemetry with filters and search.
                    </p>
                    <ul className="space-y-3 text-sm text-slate-300">
                      <li className="flex items-center gap-2.5"><CheckCircle2 className="h-4.5 w-4.5 text-purple-400" /> Advanced rate card & zone management</li>
                      <li className="flex items-center gap-2.5"><CheckCircle2 className="h-4.5 w-4.5 text-purple-400" /> Automated & manual courier dispatch</li>
                      <li className="flex items-center gap-2.5"><CheckCircle2 className="h-4.5 w-4.5 text-purple-400" /> Full notification audit trails</li>
                    </ul>
                  </div>
                  <div className="bg-slate-900/80 rounded-xl border border-white/5 p-4 space-y-4">
                    <div className="grid grid-cols-3 gap-2">
                      <div className="bg-slate-950/60 p-2.5 rounded border border-white/5 text-center">
                        <div className="text-[9px] text-slate-500 uppercase font-bold">Total Shipments</div>
                        <div className="text-base font-bold text-white mt-0.5">1,204</div>
                      </div>
                      <div className="bg-slate-955 p-2.5 rounded border border-white/5 text-center">
                        <div className="text-[9px] text-slate-500 uppercase font-bold">In Transit</div>
                        <div className="text-base font-bold text-sky-400 mt-0.5">148</div>
                      </div>
                      <div className="bg-slate-950/60 p-2.5 rounded border border-white/5 text-center">
                        <div className="text-[9px] text-slate-500 uppercase font-bold">Failed (COD)</div>
                        <div className="text-base font-bold text-red-400 mt-0.5">12</div>
                      </div>
                    </div>
                    <div className="bg-slate-950/80 rounded border border-white/5 p-2 font-mono text-[9px] text-slate-400 max-h-[140px] overflow-hidden">
                      <div className="border-b border-white/5 pb-1 mb-1.5 flex justify-between font-bold text-white">
                        <span>ORDER ID</span><span>ZONES</span><span>AGENT</span><span>STATUS</span>
                      </div>
                      <div className="space-y-1">
                        <div className="flex justify-between"><span>#1002</span><span>Zone A → B</span><span className="text-white">Alex Roy</span><span className="text-amber-400">Transit</span></div>
                        <div className="flex justify-between"><span>#1003</span><span>Zone C → C</span><span className="text-white">S. Kumar</span><span className="text-emerald-400">Delivered</span></div>
                        <div className="flex justify-between"><span>#1004</span><span>Zone A → C</span><span className="text-warning">Unassigned</span><span className="text-red-400">Pending</span></div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'agent' && (
                <div className="grid md:grid-cols-2 gap-8 items-center">
                  <div>
                    <span className="text-xs font-bold tracking-wider text-pink-400 uppercase">Delivery Agent Portal</span>
                    <h3 className="text-2xl md:text-3xl font-extrabold mt-2 mb-4">Mobile-First Task Execution</h3>
                    <p className="text-slate-400 text-sm leading-relaxed mb-6">
                      An optimized web experience engineered for mobile viewports. Features active location mock settings (simulated coordinates), status updating buttons, cash/COD payment logs, and route details.
                    </p>
                    <ul className="space-y-3 text-sm text-slate-300">
                      <li className="flex items-center gap-2.5"><CheckCircle2 className="h-4.5 w-4.5 text-pink-400" /> One-click GPS location mocker tool</li>
                      <li className="flex items-center gap-2.5"><CheckCircle2 className="h-4.5 w-4.5 text-pink-400" /> Bottom navigation and large tap targets</li>
                      <li className="flex items-center gap-2.5"><CheckCircle2 className="h-4.5 w-4.5 text-pink-400" /> Shipment status updates with failure reasons</li>
                    </ul>
                  </div>
                  <div className="flex justify-center">
                    {/* Simulated Mobile Mockup */}
                    <div className="w-[180px] h-[320px] rounded-2xl border-4 border-slate-800 bg-slate-900 relative overflow-hidden flex flex-col justify-between shadow-xl">
                      <div className="bg-slate-955 p-2 text-center border-b border-white/5 text-[9px] font-bold text-white flex justify-between items-center">
                        <span>Agent Console</span>
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                      </div>
                      <div className="p-2.5 flex-1 space-y-2 overflow-hidden">
                        <div className="bg-slate-950/60 p-2 rounded border border-white/5 text-[8px] font-mono">
                          <div className="text-slate-500 uppercase tracking-widest text-[7px] font-bold">GPS Coordinate Mocker</div>
                          <div className="text-white font-semibold mt-0.5">Lat: 28.6304 | Lon: 77.2177</div>
                          <div className="text-sky-400 mt-0.5">Zone: Central Delhi</div>
                        </div>
                        <div className="bg-slate-950/90 p-2 rounded border border-slate-800">
                          <div className="flex justify-between items-center mb-1">
                            <span className="text-white text-[9px] font-bold">#10851</span>
                            <span className="bg-amber-400/20 text-amber-400 px-1 rounded text-[7px] font-semibold">ASSIGNED</span>
                          </div>
                          <div className="text-[8px] text-slate-400">Saket Mall Dropoff</div>
                          <button className="w-full mt-2 bg-emerald-500 text-white rounded py-1 text-[8px] font-bold cursor-pointer">
                            Update Status
                          </button>
                        </div>
                      </div>
                      <div className="bg-slate-955 h-8 flex border-t border-white/5 items-center justify-around text-[8px] text-slate-500">
                        <span className="text-white font-bold">Orders</span>
                        <span>Earnings</span>
                        <span>Settings</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </section>

      {/* Smart Features Grid */}
      <section className="py-24 px-6 relative z-10 border-t border-white/5">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <span className="text-xs font-bold tracking-wider text-sky-400 uppercase">Architecture</span>
            <h2 className="text-3xl md:text-5xl font-bold tracking-tight mt-2 mb-4">
              Engineered for Precision & Speed
            </h2>
            <p className="text-slate-400 max-w-xl mx-auto">
              A comprehensive stack designed to manage last-mile deliveries dynamically without latency.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, i) => (
              <motion.div
                key={i}
                whileHover={{ y: -5 }}
                className="glow-card glass-panel border border-white/5 rounded-xl p-6 bg-slate-900/10 hover:bg-slate-900/20 transition-all text-left"
              >
                <div className="w-10 h-10 rounded-lg bg-sky-500/10 flex items-center justify-center border border-sky-500/20 text-sky-400 mb-5">
                  <feature.icon className="h-5 w-5" />
                </div>
                <h3 className="text-lg font-bold text-white mb-2">{feature.title}</h3>
                <p className="text-slate-400 text-sm leading-relaxed">{feature.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Live Tracking Showcase */}
      <section className="py-24 px-6 relative z-10 border-t border-white/5 bg-slate-950/20">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <span className="text-xs font-bold tracking-wider text-pink-400 uppercase">Live Telemetry</span>
            <h2 className="text-3xl md:text-5xl font-bold tracking-tight mt-2 mb-4">
              Real-Time Tracking Lifecycle
            </h2>
            <p className="text-slate-400 max-w-xl mx-auto">
              Simulated flow representing how shipments step through states automatically triggered by agents.
            </p>
          </div>

          <div className="grid lg:grid-cols-3 gap-8 items-center max-w-5xl mx-auto">
            {/* Timeline progression */}
            <div className="lg:col-span-2 space-y-4">
              {trackingStages.map((stage, idx) => {
                const isActive = trackingStep === idx;
                const isPassed = trackingStep > idx;

                return (
                  <motion.div
                    key={idx}
                    animate={{ 
                      backgroundColor: isActive ? 'rgba(255,255,255,0.04)' : 'rgba(255,255,255,0.01)',
                      borderColor: isActive ? 'rgba(14, 165, 233, 0.4)' : 'rgba(255,255,255,0.05)'
                    }}
                    className="flex gap-4 p-4 rounded-xl border transition-all text-left items-center"
                  >
                    <div className={`p-2.5 rounded-lg border ${
                      isActive 
                        ? 'bg-sky-500/20 border-sky-500/40 text-sky-400' 
                        : isPassed 
                          ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' 
                          : 'bg-slate-950/40 border-white/5 text-slate-600'
                    }`}>
                      <stage.icon className="h-5 w-5" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <h4 className={`text-sm font-bold ${isActive ? 'text-white' : isPassed ? 'text-slate-300' : 'text-slate-500'}`}>
                          {stage.title}
                        </h4>
                        {isActive && <span className="text-[9px] font-mono bg-sky-500/10 text-sky-400 px-2 py-0.5 rounded animate-pulse">ACTIVE STEP</span>}
                        {isPassed && <span className="text-[9px] font-mono text-emerald-400">PASSED</span>}
                      </div>
                      <p className="text-slate-400 text-xs mt-0.5">{stage.desc}</p>
                    </div>
                  </motion.div>
                );
              })}
            </div>

            {/* Simulated Live tracking preview card */}
            <div className="glass-panel border border-white/10 rounded-xl p-5 text-left bg-slate-955 shadow-xl space-y-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-pink-500/10 border border-pink-500/20 text-pink-400 rounded-lg">
                  <Compass className="h-5 w-5" />
                </div>
                <div>
                  <div className="text-xs text-slate-400 font-semibold">Active Tracker</div>
                  <div className="text-sm font-extrabold text-white">Shipment #8942A</div>
                </div>
              </div>

              <div className="border-t border-white/5 pt-4 space-y-3.5">
                <div className="flex gap-2">
                  <MapPin className="h-4 w-4 text-sky-400 mt-0.5" />
                  <div>
                    <div className="text-[10px] text-slate-500 font-bold uppercase">Pickup Address</div>
                    <div className="text-xs text-slate-300">Connaught Place Central Hub, DL</div>
                  </div>
                </div>
                <div className="flex gap-2">
                  <MapPin className="h-4 w-4 text-pink-400 mt-0.5" />
                  <div>
                    <div className="text-[10px] text-slate-500 font-bold uppercase">Delivery Destination</div>
                    <div className="text-xs text-slate-300">Sector-15, Rohini, New Delhi</div>
                  </div>
                </div>
              </div>

              <div className="bg-slate-900 p-3 rounded-lg border border-white/5 space-y-1">
                <div className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">Applied Charge</div>
                <div className="text-xl font-black text-emerald-400">$64.80</div>
                <div className="text-[9px] text-slate-400">Calculated via Intra-Zone standard rate</div>
              </div>

              <div className="text-[10px] text-slate-500 flex justify-between items-center font-mono">
                <span>SMS Alert: Delivered</span>
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Dynamic Pricing Engine Showcase */}
      <section className="py-24 px-6 relative z-10 border-t border-white/5">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <span className="text-xs font-bold tracking-wider text-amber-400 uppercase">System Logic</span>
            <h2 className="text-3xl md:text-5xl font-bold tracking-tight mt-2 mb-4">
              High-Precision Dynamic Pricing Engine
            </h2>
            <p className="text-slate-400 max-w-xl mx-auto">
              How the billing engine computes pricing transparently from dimensions, routing categories, and payment settings.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-5xl mx-auto text-left">
            <div className="glass-panel border border-white/5 p-6 rounded-xl space-y-4">
              <div className="w-10 h-10 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center">
                <Scale className="h-5 w-5" />
              </div>
              <h3 className="text-lg font-bold text-white">1. Chargeable Weight Calculation</h3>
              <p className="text-slate-400 text-sm leading-relaxed">
                Billing applies standard dimensional weight rules. Volume is calculated as (Length × Width × Height) ÷ 5000. The billing weight is always the higher value between actual physical weight and volumetric weight.
              </p>
              <div className="bg-slate-950/60 p-3 rounded font-mono text-[10px] text-slate-400 border border-white/5">
                Volumetric Weight = L×B×H / 5000<br/>
                Chargeable = Max(Actual, Volumetric)
              </div>
            </div>

            <div className="glass-panel border border-white/5 p-6 rounded-xl space-y-4">
              <div className="w-10 h-10 rounded-lg bg-blue-500/10 border border-blue-500/20 text-blue-400 flex items-center justify-center">
                <Compass className="h-5 w-5" />
              </div>
              <h3 className="text-lg font-bold text-white">2. Zone & Route Detection</h3>
              <p className="text-slate-400 text-sm leading-relaxed">
                The geofencing database assigns postal codes to specific zones. The system flags if the package route is <strong>Intra-Zone</strong> (within the same zone) or <strong>Inter-Zone</strong> (traversing different zones).
              </p>
              <div className="bg-slate-955 p-3 rounded font-mono text-[10px] text-slate-400 border border-white/5">
                Pincode A = Zone 1<br/>
                Pincode B = Zone 2 (Route: Inter-Zone)
              </div>
            </div>

            <div className="glass-panel border border-white/5 p-6 rounded-xl space-y-4">
              <div className="w-10 h-10 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center">
                <DollarSign className="h-5 w-5" />
              </div>
              <h3 className="text-lg font-bold text-white">3. Rate Card Rules Override</h3>
              <p className="text-slate-400 text-sm leading-relaxed">
                Matches the computed chargeable weight against active rate cards. Flat base charges are applied for base weights, then excess per-kg charges are stacked. COD payment methods trigger flat surcharges.
              </p>
              <div className="bg-slate-955 p-3 rounded font-mono text-[10px] text-slate-400 border border-white/5">
                Base Cost + (Excess Weight × Rate/kg)<br/>
                + Cash on Delivery Surcharge (if COD)
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Auto Assignment Flow Showcase */}
      <section className="py-24 px-6 relative z-10 border-t border-white/5 bg-slate-955">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <span className="text-xs font-bold tracking-wider text-indigo-400 uppercase">Automation</span>
            <h2 className="text-3xl md:text-5xl font-bold tracking-tight mt-2 mb-4">
              Spatial Geofenced Auto-Assignment
            </h2>
            <p className="text-slate-400 max-w-xl mx-auto">
              Real-time assignment engine mapping shipments to active delivery agents in physical boundaries.
            </p>
          </div>

          <div className="max-w-3xl mx-auto relative">
            {/* Diagram */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-center">
              <div className="bg-slate-950 border border-white/5 p-4 rounded-xl text-center">
                <FileText className="h-6 w-6 text-sky-400 mx-auto mb-2" />
                <h4 className="text-xs font-bold text-white">Order Created</h4>
                <p className="text-[10px] text-slate-500 mt-1">Pending Assignment</p>
              </div>

              <div className="hidden md:flex justify-center text-indigo-500">
                <ChevronRight className="h-6 w-6" />
              </div>

              <div className="bg-indigo-950/30 border border-indigo-500/20 p-4 rounded-xl text-center md:col-span-2">
                <Activity className="h-6 w-6 text-indigo-400 mx-auto mb-2" />
                <h4 className="text-xs font-bold text-white">Zone Engine Scanning</h4>
                <p className="text-[10px] text-slate-400 mt-1">
                  Detects active agents matching coordinates within pickup zone polygon.
                </p>
                <div className="flex gap-1 justify-center mt-3">
                  <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-ping" />
                  <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-ping" />
                  <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-ping" />
                </div>
              </div>
            </div>

            <div className="hidden md:block absolute left-1/2 -bottom-8 transform -translate-x-1/2 text-indigo-500">
              <ArrowRight className="h-6 w-6 rotate-90" />
            </div>
            
            <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="md:col-start-2 bg-slate-955 border border-white/5 p-4 rounded-xl text-center">
                <Users className="h-6 w-6 text-emerald-400 mx-auto mb-2" />
                <h4 className="text-xs font-bold text-white">Closest Agent Found</h4>
                <p className="text-[10px] text-slate-500 mt-1">S. Kumar (1.2 km away)</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Analytics Preview */}
      <section className="py-24 px-6 relative z-10 border-t border-white/5">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <span className="text-xs font-bold tracking-wider text-emerald-400 uppercase">Metrics</span>
            <h2 className="text-3xl md:text-5xl font-bold tracking-tight mt-2 mb-4">
              Fleet Telemetry Analytics
            </h2>
            <p className="text-slate-400 max-w-xl mx-auto">
              Real-time analytics showcasing operational throughput, delivery success metrics, and driver locations.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <div className="glass-panel border border-white/5 rounded-xl p-5 text-left bg-slate-900/5">
              <div className="text-slate-500 text-xs uppercase font-bold tracking-widest">Active Deliveries</div>
              <div className="text-3xl font-black text-white mt-1">42,891</div>
              <div className="text-[10px] text-emerald-400 font-semibold mt-1">▲ 12.4% vs last week</div>
            </div>
            <div className="glass-panel border border-white/5 rounded-xl p-5 text-left bg-slate-900/5">
              <div className="text-slate-500 text-xs uppercase font-bold tracking-widest">Average Transit Time</div>
              <div className="text-3xl font-black text-sky-400 mt-1">42 mins</div>
              <div className="text-[10px] text-emerald-400 font-semibold mt-1">▼ 8 mins improvement</div>
            </div>
            <div className="glass-panel border border-white/5 rounded-xl p-5 text-left bg-slate-900/5">
              <div className="text-slate-500 text-xs uppercase font-bold tracking-widest">Success Rate</div>
              <div className="text-3xl font-black text-indigo-400 mt-1">99.4%</div>
              <div className="text-[10px] text-slate-500 mt-1">Standard B2B threshold</div>
            </div>
            <div className="glass-panel border border-white/5 rounded-xl p-5 text-left bg-slate-900/5">
              <div className="text-slate-500 text-xs uppercase font-bold tracking-widest">Revenue Generated</div>
              <div className="text-3xl font-black text-emerald-400 mt-1">$284.2K</div>
              <div className="text-[10px] text-emerald-400 font-semibold mt-1">▲ 8.1% vs target</div>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-24 px-6 relative z-10 border-t border-white/5 bg-slate-950/20">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <span className="text-xs font-bold tracking-wider text-pink-400 uppercase">Testimonials</span>
            <h2 className="text-3xl md:text-5xl font-bold tracking-tight mt-2 mb-4">
              Trusted by Top Logistics Leaders
            </h2>
            <p className="text-slate-400 max-w-xl mx-auto">
              Read how scaling companies trust Velocity to manage local distributions and dynamic rates.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto text-left">
            <div className="glass-panel border border-white/5 p-6 rounded-xl space-y-4">
              <p className="text-slate-300 text-sm leading-relaxed italic">
                "Velocity completely overhauled our regional distribution mapping. The dynamic pricing matches actual parcel dimensions instantly, reducing courier verification times from hours to seconds."
              </p>
              <div>
                <div className="text-sm font-bold text-white">Marcus Vance</div>
                <div className="text-xs text-slate-500">VP of Logistics, ShipDirect Corp</div>
              </div>
            </div>

            <div className="glass-panel border border-white/5 p-6 rounded-xl space-y-4">
              <p className="text-slate-300 text-sm leading-relaxed italic">
                "Auto-assignment based on geofenced zones streamlined dispatching for our 200+ courier fleet. Our failed delivery rates dropped by 18% because customers can easily reschedule in their dashboard."
              </p>
              <div>
                <div className="text-sm font-bold text-white">Ananya Sen</div>
                <div className="text-xs text-slate-500">Head of Operations, QuickCargo India</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FAQs */}
      <section className="py-24 px-6 relative z-10 border-t border-white/5">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-16">
            <span className="text-xs font-bold tracking-wider text-sky-400 uppercase">Support</span>
            <h2 className="text-3xl md:text-5xl font-bold tracking-tight mt-2 mb-4">
              Frequently Asked Questions
            </h2>
            <p className="text-slate-400 max-w-xl mx-auto">
              Quick insights into the features of our last-mile delivery tracking network.
            </p>
          </div>

          <div className="space-y-4 text-left">
            {faqs.map((faq, idx) => (
              <div key={idx} className="glass-panel border border-white/5 p-6 rounded-xl">
                <h4 className="font-bold text-white flex items-center gap-2 mb-2 text-sm md:text-base">
                  <HelpCircle className="h-4.5 w-4.5 text-sky-400 flex-shrink-0" />
                  {faq.q}
                </h4>
                <p className="text-slate-400 text-sm leading-relaxed pl-7">{faq.a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 border-t border-white/5 bg-slate-955 relative z-10">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2">
            <Truck className="h-5 w-5 text-sky-400" />
            <span className="font-bold text-slate-300 text-sm">Velocity Last-Mile Tracker</span>
          </div>
          <div className="text-xs text-slate-500">
            &copy; {new Date().getFullYear()} Velocity Logistics Systems. All rights reserved.
          </div>
          <div className="flex gap-4 text-xs text-slate-400">
            <a href="#" className="hover:text-white transition-colors">Privacy Policy</a>
            <a href="#" className="hover:text-white transition-colors">Terms of Service</a>
            <a href="#" className="hover:text-white transition-colors">API Docs</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
