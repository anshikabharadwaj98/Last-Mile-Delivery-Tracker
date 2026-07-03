import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Users, MapPin, Scale, Shield, BarChart3, Search, Plus, X, 
  Map, DollarSign, ListFilter, Sliders, ChevronDown, CheckCircle, AlertTriangle, Truck, RefreshCw, FileText
} from 'lucide-react';
import { 
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, 
  BarChart, Bar, Cell, PieChart, Pie 
} from 'recharts';

interface AdminDashboardProps {
  currentUser: any;
  apiFetch: (endpoint: string, options?: any) => Promise<any>;
  onTrackOrder: (orderId: string) => void;
  showToast: (msg: string, type: 'success' | 'error' | 'info') => void;
}

export default function AdminDashboard({ currentUser, apiFetch, onTrackOrder, showToast }: AdminDashboardProps) {
  const [activeTab, setActiveTab] = useState<'orders' | 'config' | 'logs'>('orders');
  const [loading, setLoading] = useState(true);

  // Data caches
  const [orders, setOrders] = useState<any[]>([]);
  const [zones, setZones] = useState<any[]>([]);
  const [agents, setAgents] = useState<any[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);
  const [rateCards, setRateCards] = useState<any[]>([]);
  const [codB2B, setCodB2B] = useState('15.00');
  const [codB2C, setCodB2C] = useState('10.00');
  const [auditLogs, setAuditLogs] = useState<any[]>([]);

  // Filter states
  const [filterStatus, setFilterStatus] = useState('');
  const [filterZone, setFilterZone] = useState('');
  const [filterAgent, setFilterAgent] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  // Modals
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [showStatusModal, setShowStatusModal] = useState(false);

  // Modal forms state
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  
  // Create Order
  const [createCustomerId, setCreateCustomerId] = useState('');
  const [createPickupAddr, setCreatePickupAddr] = useState('');
  const [createPickupPostal, setCreatePickupPostal] = useState('');
  const [createDropAddr, setCreateDropAddr] = useState('');
  const [createDropPostal, setCreateDropPostal] = useState('');
  const [createLength, setCreateLength] = useState('10');
  const [createWidth, setCreateWidth] = useState('10');
  const [createHeight, setCreateHeight] = useState('10');
  const [createWeight, setCreateWeight] = useState('1.0');
  const [createPayment, setCreatePayment] = useState('Prepaid');
  const [createType, setCreateType] = useState('B2C');
  const [pricingPreview, setPricingPreview] = useState<any>(null);
  const [previewError, setPreviewError] = useState<string | null>(null);

  // Assign Agent
  const [assignMode, setAssignMode] = useState<'auto' | 'manual'>('auto');
  const [selectedAgentId, setSelectedAgentId] = useState('');
  const [assignPickupZone, setAssignPickupZone] = useState('');

  // Force Status
  const [overrideStatus, setOverrideStatus] = useState('Picked Up');
  const [failedReason, setFailedReason] = useState('Customer unavailable/not answering phone');

  // Config form states
  const [zoneName, setZoneName] = useState('');
  const [zoneCode, setZoneCode] = useState('');
  const [zoneDesc, setZoneDesc] = useState('');

  const [areaZoneId, setAreaZoneId] = useState('');
  const [areaName, setAreaName] = useState('');
  const [areaPostal, setAreaPostal] = useState('');
  const [areaLat, setAreaLat] = useState('');
  const [areaLon, setAreaLon] = useState('');

  const [rcName, setRcName] = useState('');
  const [rcOrderType, setRcOrderType] = useState('B2B');
  const [rcRateType, setRcRateType] = useState('intra');
  const [rcZoneFrom, setRcZoneFrom] = useState('');
  const [rcZoneTo, setRcZoneTo] = useState('');
  const [rcBaseWeight, setRcBaseWeight] = useState('1.0');
  const [rcBaseRate, setRcBaseRate] = useState('40.00');
  const [rcExcessRate, setRcExcessRate] = useState('8.00');

  useEffect(() => {
    loadAllData();
  }, []);

  useEffect(() => {
    if (activeTab === 'config') {
      loadConfigDetails();
    } else if (activeTab === 'logs') {
      loadAuditLogs();
    }
  }, [activeTab]);

  // Create shipment live pricing preview
  useEffect(() => {
    if (createPickupPostal && createDropPostal && createLength && createWidth && createHeight && createWeight && createPayment && createType) {
      const timer = setTimeout(() => {
        calculatePricing();
      }, 500);
      return () => clearTimeout(timer);
    } else {
      setPricingPreview(null);
    }
  }, [createPickupPostal, createDropPostal, createLength, createWidth, createHeight, createWeight, createPayment, createType]);

  const loadAllData = async () => {
    setLoading(true);
    try {
      await Promise.all([
        loadOrders(),
        loadZones(),
        loadAgents(),
        loadCustomers(),
      ]);
    } catch (err: any) {
      showToast(`Data load failed: ${err.message}`, 'error');
    } finally {
      setLoading(false);
    }
  };

  const loadOrders = async () => {
    let query = '';
    const params = [];
    if (filterStatus) params.push(`status=${filterStatus}`);
    if (filterZone) params.push(`zone_id=${filterZone}`);
    if (filterAgent) params.push(`agent_id=${filterAgent}`);
    if (params.length > 0) query = `?${params.join('&')}`;

    const data = await apiFetch(`/api/orders${query}`);
    setOrders(data);
  };

  const loadZones = async () => {
    const data = await apiFetch('/api/zones');
    setZones(data);
    if (data.length > 0) {
      setAreaZoneId(data[0].id.toString());
    }
  };

  const loadAgents = async () => {
    const data = await apiFetch('/api/admin/agents');
    setAgents(data);
  };

  const loadCustomers = async () => {
    const data = await apiFetch('/api/admin/customers');
    setCustomers(data);
    if (data.length > 0) {
      setCreateCustomerId(data[0].id.toString());
    }
  };

  const loadConfigDetails = async () => {
    try {
      const data = await apiFetch('/api/rate-cards');
      setRateCards(data.rateCards);
      
      const codB2BSetting = data.settings.find((s: any) => s.key === 'cod_surcharge_B2B');
      const codB2CSetting = data.settings.find((s: any) => s.key === 'cod_surcharge_B2C');
      if (codB2BSetting) setCodB2B(codB2BSetting.value);
      if (codB2CSetting) setCodB2C(codB2CSetting.value);
    } catch (err: any) {
      showToast(`Failed loading rate cards: ${err.message}`, 'error');
    }
  };

  const loadAuditLogs = async () => {
    try {
      const data = await apiFetch('/api/admin/audit-logs');
      setAuditLogs(data);
    } catch (err: any) {
      showToast(`Failed loading audit logs: ${err.message}`, 'error');
    }
  };

  const calculatePricing = async () => {
    try {
      setPreviewError(null);
      const data = await apiFetch('/api/orders/calculate', {
        method: 'POST',
        body: JSON.stringify({
          pickup_postal_code: createPickupPostal,
          drop_postal_code: createDropPostal,
          length_cm: parseFloat(createLength),
          width_cm: parseFloat(createWidth),
          height_cm: parseFloat(createHeight),
          actual_weight_kg: parseFloat(createWeight),
          order_type: createType,
          payment_type: createPayment
        })
      });
      setPricingPreview(data);
    } catch (err: any) {
      setPricingPreview(null);
      setPreviewError(err.message);
    }
  };

  const handleCreateOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const data = await apiFetch('/api/orders', {
        method: 'POST',
        body: JSON.stringify({
          customer_id: createCustomerId,
          pickup_address: createPickupAddr,
          pickup_postal_code: createPickupPostal,
          drop_address: createDropAddr,
          drop_postal_code: createDropPostal,
          length_cm: parseFloat(createLength),
          width_cm: parseFloat(createWidth),
          height_cm: parseFloat(createHeight),
          actual_weight_kg: parseFloat(createWeight),
          order_type: createType,
          payment_type: createPayment
        })
      });
      showToast(data.message || 'Order created by admin!', 'success');
      setShowCreateModal(false);
      resetCreateForm();
      loadOrders();
    } catch (err: any) {
      showToast(`Create order failed: ${err.message}`, 'error');
    }
  };

  const handleOpenAssign = (orderId: string, zoneName: string) => {
    setSelectedOrderId(orderId);
    setAssignPickupZone(zoneName);
    setAssignMode('auto');
    setSelectedAgentId('');
    setShowAssignModal(true);
  };

  const handleAssignAgent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOrderId) return;
    try {
      const payload: any = {};
      if (assignMode === 'auto') {
        payload.auto = true;
      } else {
        if (!selectedAgentId) {
          showToast('Please select an agent to assign manually.', 'info');
          return;
        }
        payload.auto = false;
        payload.agent_id = selectedAgentId;
      }
      const data = await apiFetch(`/api/orders/${selectedOrderId}/assign`, {
        method: 'POST',
        body: JSON.stringify(payload)
      });
      showToast(data.message || 'Agent assigned successfully!', 'success');
      setShowAssignModal(false);
      loadOrders();
    } catch (err: any) {
      showToast(`Assignment failed: ${err.message}`, 'error');
    }
  };

  const handleOpenStatus = (orderId: string, status: string) => {
    setSelectedOrderId(orderId);
    setOverrideStatus(status || 'Picked Up');
    setFailedReason('Customer unavailable/not answering phone');
    setShowStatusModal(true);
  };

  const handleForceStatus = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOrderId) return;
    try {
      const payload: any = { status: overrideStatus };
      if (overrideStatus === 'Failed') {
        payload.failed_reason = failedReason;
      }
      const data = await apiFetch(`/api/orders/${selectedOrderId}/status`, {
        method: 'PUT',
        body: JSON.stringify(payload)
      });
      showToast(data.message || 'Status overridden successfully!', 'success');
      setShowStatusModal(false);
      loadOrders();
    } catch (err: any) {
      showToast(`Status override failed: ${err.message}`, 'error');
    }
  };

  // Config setup handlers
  const handleCreateZone = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await apiFetch('/api/zones', {
        method: 'POST',
        body: JSON.stringify({ name: zoneName, code: zoneCode, description: zoneDesc })
      });
      showToast('Zone registered successfully!', 'success');
      setZoneName('');
      setZoneCode('');
      setZoneDesc('');
      loadZones();
    } catch (err: any) {
      showToast(`Zone registration failed: ${err.message}`, 'error');
    }
  };

  const handleAssignArea = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await apiFetch('/api/zones/areas', {
        method: 'POST',
        body: JSON.stringify({
          zone_id: areaZoneId,
          name: areaName,
          postal_code: areaPostal,
          latitude: areaLat ? parseFloat(areaLat) : null,
          longitude: areaLon ? parseFloat(areaLon) : null
        })
      });
      showToast('Area added to zone!', 'success');
      setAreaName('');
      setAreaPostal('');
      setAreaLat('');
      setAreaLon('');
      loadZones();
    } catch (err: any) {
      showToast(`Failed adding area: ${err.message}`, 'error');
    }
  };

  const handleSaveRateCard = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await apiFetch('/api/rate-cards', {
        method: 'POST',
        body: JSON.stringify({
          name: rcName,
          order_type: rcOrderType,
          rate_type: rcRateType,
          zone_from_id: rcZoneFrom || null,
          zone_to_id: rcZoneTo || null,
          base_weight_kg: parseFloat(rcBaseWeight),
          base_rate: parseFloat(rcBaseRate),
          excess_rate_per_kg: parseFloat(rcExcessRate)
        })
      });
      showToast('Rate card rule configuration saved!', 'success');
      setRcName('');
      setRcZoneFrom('');
      setRcZoneTo('');
      loadConfigDetails();
    } catch (err: any) {
      showToast(`Failed saving rate card: ${err.message}`, 'error');
    }
  };

  const handleUpdateSurcharges = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await apiFetch('/api/rate-cards/settings', {
        method: 'POST',
        body: JSON.stringify({ key: 'cod_surcharge_B2B', value: codB2B, description: 'Flat surcharge for COD B2B orders' })
      });
      await apiFetch('/api/rate-cards/settings', {
        method: 'POST',
        body: JSON.stringify({ key: 'cod_surcharge_B2C', value: codB2C, description: 'Flat surcharge for COD B2C orders' })
      });
      showToast('COD Surcharge parameters synchronized!', 'success');
      loadConfigDetails();
    } catch (err: any) {
      showToast(`Failed saving settings: ${err.message}`, 'error');
    }
  };

  const resetCreateForm = () => {
    setCreatePickupAddr('');
    setCreatePickupPostal('');
    setCreateDropAddr('');
    setCreateDropPostal('');
    setCreateLength('10');
    setCreateWidth('10');
    setCreateHeight('10');
    setCreateWeight('1.0');
    setCreatePayment('Prepaid');
    setCreateType('B2C');
    setPricingPreview(null);
    setPreviewError(null);
  };

  // Re-run order queries on filter state change
  useEffect(() => {
    if (!loading) {
      loadOrders();
    }
  }, [filterStatus, filterZone, filterAgent]);

  const filteredOrders = orders.filter((o: any) => {
    const term = searchQuery.toLowerCase();
    return (
      o.id.toString().includes(term) ||
      o.customer?.name.toLowerCase().includes(term) ||
      o.pickup_address.toLowerCase().includes(term) ||
      o.drop_address.toLowerCase().includes(term) ||
      o.status.toLowerCase().includes(term)
    );
  });

  // KPI stats from currently queried set
  const totalCount = orders.length;
  const pendingCount = orders.filter((o) => o.status === 'Pending').length;
  const activeCount = orders.filter((o) => ['Assigned', 'Picked Up', 'In Transit', 'Out for Delivery'].includes(o.status)).length;
  const failedCount = orders.filter((o) => o.status === 'Failed').length;

  // Chart analytics models
  const totalRevenue = orders.reduce((acc, curr) => acc + Number(curr.total_charge), 0);
  
  // Format dynamic datasets for charts
  const zoneRevenueMap: Record<string, number> = {};
  orders.forEach((o) => {
    const zName = o.pickupZone?.name || 'Unknown';
    zoneRevenueMap[zName] = (zoneRevenueMap[zName] || 0) + Number(o.total_charge);
  });
  const zoneChartData = Object.entries(zoneRevenueMap).map(([name, value]) => ({ name, value }));

  const statusMap: Record<string, number> = {};
  orders.forEach((o) => {
    statusMap[o.status] = (statusMap[o.status] || 0) + 1;
  });
  const statusChartData = Object.entries(statusMap).map(([name, value]) => ({ name, value }));

  return (
    <div className="max-w-7xl mx-auto px-6 py-8 text-left font-sans">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-10">
        <div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight">Mission Control</h1>
          <p className="text-slate-400 text-xs mt-1">
            Logistics Dashboard Overview. Geofencing routing systems, rate config metrics, and fleet dispatching logs.
          </p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="bg-sky-500 hover:bg-sky-400 text-white font-semibold text-xs rounded-lg px-4.5 py-2.5 flex items-center gap-2 transition-all cursor-pointer hover:scale-[1.02] shadow-lg shadow-sky-500/10"
        >
          <Plus className="h-4 w-4" /> Create Shipment Order
        </button>
      </div>

      {/* KPI stats */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
        <div className="glass-panel border border-white/5 rounded-xl p-5">
          <div className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Total Shipments</div>
          <div className="text-2xl font-black text-white mt-1">{totalCount}</div>
        </div>
        <div className="glass-panel border border-white/5 rounded-xl p-5">
          <div className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Pending assignment</div>
          <div className="text-2xl font-black text-amber-400 mt-1">{pendingCount}</div>
        </div>
        <div className="glass-panel border border-white/5 rounded-xl p-5">
          <div className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Active In Transit</div>
          <div className="text-2xl font-black text-sky-400 mt-1">{activeCount}</div>
        </div>
        <div className="glass-panel border border-white/5 rounded-xl p-5">
          <div className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Failed Shipments</div>
          <div className="text-2xl font-black text-rose-400 mt-1">{failedCount}</div>
        </div>
        <div className="glass-panel border border-white/5 rounded-xl p-5 col-span-2 lg:col-span-1">
          <div className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Total Value Flow</div>
          <div className="text-2xl font-black text-emerald-400 mt-1">${totalRevenue.toFixed(2)}</div>
        </div>
      </div>

      {/* Analytics Charts Drawer */}
      <div className="grid md:grid-cols-3 gap-6 mb-8">
        <div className="glass-panel border border-white/5 rounded-xl p-5 md:col-span-2 bg-slate-950/20">
          <div className="text-[10px] uppercase font-bold text-slate-500 tracking-wider mb-4 flex items-center gap-1.5">
            <BarChart3 className="h-4 w-4 text-sky-400" /> Revenue Breakdown by Pickup Zone
          </div>
          <div className="h-[180px]">
            {zoneChartData.length === 0 ? (
              <div className="h-full flex items-center justify-center text-xs text-slate-500">No revenue data available.</div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={zoneChartData}>
                  <defs>
                    <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#0ea5e9" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#0ea5e9" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="name" stroke="#64748b" fontSize={10} tickLine={false} />
                  <YAxis stroke="#64748b" fontSize={10} tickLine={false} />
                  <Tooltip contentStyle={{ background: '#0b0f19', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '8px', fontSize: 10 }} />
                  <Area type="monotone" dataKey="value" stroke="#0ea5e9" strokeWidth={2} fillOpacity={1} fill="url(#colorValue)" />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        <div className="glass-panel border border-white/5 rounded-xl p-5 bg-slate-955/20">
          <div className="text-[10px] uppercase font-bold text-slate-500 tracking-wider mb-4 flex items-center gap-1.5">
            <Shield className="h-4 w-4 text-purple-400" /> Shipments by Status
          </div>
          <div className="h-[180px]">
            {statusChartData.length === 0 ? (
              <div className="h-full flex items-center justify-center text-xs text-slate-500">No status logs recorded.</div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={statusChartData}>
                  <XAxis dataKey="name" stroke="#64748b" fontSize={9} tickLine={false} />
                  <YAxis stroke="#64748b" fontSize={10} tickLine={false} />
                  <Tooltip contentStyle={{ background: '#0b0f19', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '8px', fontSize: 10 }} />
                  <Bar dataKey="value" fill="#6366f1" radius={[4, 4, 0, 0]}>
                    {statusChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={
                        entry.name === 'Delivered' ? '#10b981' : 
                        entry.name === 'Failed' ? '#f43f5e' : 
                        entry.name === 'Pending' ? '#f59e0b' : '#6366f1'
                      } />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-white/5 mb-8 gap-6 text-sm font-semibold">
        <button
          onClick={() => setActiveTab('orders')}
          className={`pb-4 border-b-2 transition-all cursor-pointer ${
            activeTab === 'orders' ? 'border-sky-500 text-white' : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          Orders List
        </button>
        <button
          onClick={() => setActiveTab('config')}
          className={`pb-4 border-b-2 transition-all cursor-pointer ${
            activeTab === 'config' ? 'border-sky-500 text-white' : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          Rate Cards & Zones
        </button>
        <button
          onClick={() => setActiveTab('logs')}
          className={`pb-4 border-b-2 transition-all cursor-pointer ${
            activeTab === 'logs' ? 'border-sky-500 text-white' : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          Notification Audit Logs
        </button>
      </div>

      {/* Dynamic Tab Contents */}
      <AnimatePresence mode="wait">
        {activeTab === 'orders' && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-4"
          >
            {/* Filter controls */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 bg-slate-900/30 p-3 rounded-xl border border-white/5">
              <div className="relative">
                <Search className="absolute left-3.5 top-1/2 transform -translate-y-1/2 h-3.5 w-3.5 text-slate-500" />
                <input
                  type="text"
                  placeholder="Search ID, customer, route..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-slate-950 border border-white/5 rounded-lg pl-9.5 pr-4 py-2 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-sky-500 transition-colors"
                />
              </div>

              <div>
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="w-full bg-slate-950 border border-white/5 rounded-lg px-3 py-2 text-xs text-slate-300 focus:outline-none focus:border-sky-500 transition-colors h-[38px]"
                >
                  <option value="">All Statuses</option>
                  <option value="Pending">Pending</option>
                  <option value="Assigned">Assigned</option>
                  <option value="Picked Up">Picked Up</option>
                  <option value="In Transit">In Transit</option>
                  <option value="Out for Delivery">Out for Delivery</option>
                  <option value="Delivered">Delivered</option>
                  <option value="Failed">Failed</option>
                </select>
              </div>

              <div>
                <select
                  value={filterZone}
                  onChange={(e) => setFilterZone(e.target.value)}
                  className="w-full bg-slate-950 border border-white/5 rounded-lg px-3 py-2 text-xs text-slate-300 focus:outline-none focus:border-sky-500 transition-colors h-[38px]"
                >
                  <option value="">All Zones</option>
                  {zones.map((z: any) => (
                    <option key={z.id} value={z.id}>{z.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <select
                  value={filterAgent}
                  onChange={(e) => setFilterAgent(e.target.value)}
                  className="w-full bg-slate-950 border border-white/5 rounded-lg px-3 py-2 text-xs text-slate-300 focus:outline-none focus:border-sky-500 transition-colors h-[38px]"
                >
                  <option value="">All Agents</option>
                  {agents.map((a: any) => (
                    <option key={a.id} value={a.id}>{a.name}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Orders Table */}
            <div className="glass-panel border border-white/5 rounded-xl overflow-hidden bg-slate-950/20">
              {filteredOrders.length === 0 ? (
                <div className="py-20 text-center">
                  <FileText className="h-10 w-10 mx-auto text-slate-700 mb-3" />
                  <p className="text-xs text-slate-500 font-bold uppercase tracking-wider">No shipments matches these filters</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-white/5 bg-slate-950/40 text-[10px] text-slate-400 uppercase tracking-widest">
                        <th className="py-3.5 px-5 font-bold">Order ID</th>
                        <th className="py-3.5 px-5 font-bold">Customer</th>
                        <th className="py-3.5 px-5 font-bold">Pickup Zone</th>
                        <th className="py-3.5 px-5 font-bold">Dropoff Zone</th>
                        <th className="py-3.5 px-5 font-bold">Billed Weight</th>
                        <th className="py-3.5 px-5 font-bold">Charges</th>
                        <th className="py-3.5 px-5 font-bold">Status</th>
                        <th className="py-3.5 px-5 font-bold">Courier</th>
                        <th className="py-3.5 px-5 font-bold text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5 text-xs">
                      {filteredOrders.map((order: any) => {
                        const statusClass = 
                          order.status === 'Delivered' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
                          order.status === 'Failed' ? 'bg-rose-500/10 text-rose-400 border-rose-500/20' :
                          order.status === 'Pending' ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' :
                          'bg-sky-500/10 text-sky-400 border-sky-500/20';

                        return (
                          <tr key={order.id} className="hover:bg-white/[0.02] transition-colors">
                            <td className="py-3.5 px-5 font-mono font-semibold text-white">#{order.id}</td>
                            <td className="py-3.5 px-5 text-slate-300 font-medium">{order.customer?.name}</td>
                            <td className="py-3.5 px-5 text-slate-300">
                              <div>{order.pickupZone?.name || 'Unknown'}</div>
                              <div className="text-[9px] text-slate-500 font-mono">{order.pickup_postal_code}</div>
                            </td>
                            <td className="py-3.5 px-5 text-slate-300">
                              <div>{order.dropZone?.name || 'Unknown'}</div>
                              <div className="text-[9px] text-slate-500 font-mono">{order.drop_postal_code}</div>
                            </td>
                            <td className="py-3.5 px-5 text-slate-300">{order.chargeable_weight_kg} kg</td>
                            <td className="py-3.5 px-5 font-bold text-white">${Number(order.total_charge).toFixed(2)}</td>
                            <td className="py-3.5 px-5">
                              <span className={`px-2.5 py-0.5 rounded-full border text-[10px] font-bold ${statusClass}`}>
                                {order.status}
                              </span>
                            </td>
                            <td className="py-3.5 px-5 text-slate-300">
                              {order.agent ? (
                                <div>{order.agent.name}</div>
                              ) : (
                                <span className="text-amber-400 font-semibold flex items-center gap-1"><AlertTriangle className="h-3 w-3" /> Unassigned</span>
                              )}
                            </td>
                            <td className="py-3.5 px-5 text-right">
                              <div className="flex justify-end gap-1.5">
                                <button
                                  onClick={() => onTrackOrder(order.id)}
                                  className="bg-slate-800 hover:bg-slate-700 text-white rounded px-2.5 py-1 text-[10px] font-semibold transition-colors cursor-pointer"
                                >
                                  View
                                </button>
                                <button
                                  onClick={() => handleOpenAssign(order.id, order.pickupZone?.name || 'Unknown')}
                                  className="bg-slate-800 hover:bg-slate-700 text-white rounded px-2.5 py-1 text-[10px] font-semibold transition-colors cursor-pointer"
                                >
                                  Assign
                                </button>
                                <button
                                  onClick={() => handleOpenStatus(order.id, order.status)}
                                  className="bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/20 rounded px-2.5 py-1 text-[10px] font-semibold transition-colors cursor-pointer"
                                >
                                  Status
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </motion.div>
        )}

        {activeTab === 'config' && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="grid lg:grid-cols-3 gap-6"
          >
            {/* Left: Zones Management */}
            <div className="glass-panel border border-white/5 rounded-xl p-5 space-y-6">
              <h2 className="text-base font-bold text-white border-b border-white/5 pb-2 flex items-center gap-1.5"><Map className="h-4 w-4 text-sky-400" /> Zones & Geofencing</h2>
              
              <form onSubmit={handleCreateZone} className="space-y-3.5">
                <h3 className="text-xs font-bold text-sky-400 uppercase tracking-widest">Create New Zone</h3>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold uppercase text-slate-400">Zone Name</label>
                  <input
                    type="text"
                    required
                    value={zoneName}
                    onChange={(e) => setZoneName(e.target.value)}
                    placeholder="e.g. Delhi NCR"
                    className="w-full bg-slate-900 border border-white/5 rounded-lg px-3 py-2 text-xs text-slate-100 placeholder-slate-600 focus:outline-none focus:border-sky-500 transition-colors"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold uppercase text-slate-400">Zone Code</label>
                  <input
                    type="text"
                    required
                    value={zoneCode}
                    onChange={(e) => setZoneCode(e.target.value)}
                    placeholder="e.g. DL_NCR"
                    className="w-full bg-slate-900 border border-white/5 rounded-lg px-3 py-2 text-xs text-slate-100 placeholder-slate-600 focus:outline-none focus:border-sky-500 transition-colors"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold uppercase text-slate-400">Description</label>
                  <input
                    type="text"
                    value={zoneDesc}
                    onChange={(e) => setZoneDesc(e.target.value)}
                    placeholder="Optional details"
                    className="w-full bg-slate-900 border border-white/5 rounded-lg px-3 py-2 text-xs text-slate-100 placeholder-slate-600 focus:outline-none focus:border-sky-500 transition-colors"
                  />
                </div>
                <button type="submit" className="w-full bg-sky-500 hover:bg-sky-400 text-white font-semibold rounded-lg py-2.5 text-xs transition-colors cursor-pointer shadow-lg shadow-sky-500/10">
                  Register Zone
                </button>
              </form>

              <form onSubmit={handleAssignArea} className="space-y-3.5 pt-4 border-t border-white/5">
                <h3 className="text-xs font-bold text-sky-400 uppercase tracking-widest">Assign Area to Zone</h3>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold uppercase text-slate-400">Target Zone</label>
                  <select
                    value={areaZoneId}
                    onChange={(e) => setAreaZoneId(e.target.value)}
                    className="w-full bg-slate-900 border border-white/5 rounded-lg px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-sky-500 transition-colors h-[38px]"
                  >
                    {zones.map((z: any) => (
                      <option key={z.id} value={z.id}>{z.name} ({z.code})</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold uppercase text-slate-400">Area Name</label>
                  <input
                    type="text"
                    required
                    value={areaName}
                    onChange={(e) => setAreaName(e.target.value)}
                    placeholder="e.g. Connaught Place"
                    className="w-full bg-slate-900 border border-white/5 rounded-lg px-3 py-2 text-xs text-slate-100 placeholder-slate-600 focus:outline-none focus:border-sky-500 transition-colors"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold uppercase text-slate-400">Postal Code (Pincode)</label>
                  <input
                    type="text"
                    required
                    value={areaPostal}
                    onChange={(e) => setAreaPostal(e.target.value)}
                    placeholder="e.g. 110001"
                    className="w-full bg-slate-900 border border-white/5 rounded-lg px-3 py-2 text-xs text-slate-100 placeholder-slate-600 focus:outline-none focus:border-sky-500 transition-colors"
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold uppercase text-slate-400">Latitude</label>
                    <input
                      type="number"
                      step="0.0001"
                      value={areaLat}
                      onChange={(e) => setAreaLat(e.target.value)}
                      placeholder="28.6304"
                      className="w-full bg-slate-900 border border-white/5 rounded-lg px-3 py-2 text-xs text-slate-100 placeholder-slate-600 focus:outline-none focus:border-sky-500 transition-colors"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold uppercase text-slate-400">Longitude</label>
                    <input
                      type="number"
                      step="0.0001"
                      value={areaLon}
                      onChange={(e) => setAreaLon(e.target.value)}
                      placeholder="77.2177"
                      className="w-full bg-slate-900 border border-white/5 rounded-lg px-3 py-2 text-xs text-slate-100 placeholder-slate-600 focus:outline-none focus:border-sky-500 transition-colors"
                    />
                  </div>
                </div>
                <button type="submit" className="w-full bg-sky-500 hover:bg-sky-400 text-white font-semibold rounded-lg py-2.5 text-xs transition-colors cursor-pointer shadow-lg shadow-sky-500/10">
                  Register Area
                </button>
              </form>
            </div>

            {/* Right: Rate Card Manager & COD parameters */}
            <div className="lg:col-span-2 space-y-6">
              {/* Rate Card Rules Setup */}
              <div className="glass-panel border border-white/5 rounded-xl p-5 space-y-4">
                <h2 className="text-base font-bold text-white border-b border-white/5 pb-2 flex items-center gap-1.5"><DollarSign className="h-4 w-4 text-sky-400" /> Save / Override Rate Card</h2>
                
                <form onSubmit={handleSaveRateCard} className="space-y-4 text-xs">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold uppercase text-slate-400">Rule Name</label>
                      <input
                        type="text"
                        required
                        value={rcName}
                        onChange={(e) => setRcName(e.target.value)}
                        placeholder="e.g. Central Express Standard"
                        className="w-full bg-slate-900 border border-white/5 rounded-lg px-3 py-2 text-slate-100 placeholder-slate-600 focus:outline-none focus:border-sky-500 transition-colors"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold uppercase text-slate-400">Client Type</label>
                      <select
                        value={rcOrderType}
                        onChange={(e) => setRcOrderType(e.target.value)}
                        className="w-full bg-slate-900 border border-white/5 rounded-lg px-3 py-2 text-slate-100 focus:outline-none focus:border-sky-500 transition-colors h-[34px]"
                      >
                        <option value="B2B">B2B (Corporate)</option>
                        <option value="B2C">B2C (Retail)</option>
                      </select>
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold uppercase text-slate-400">Route Scope</label>
                      <select
                        value={rcRateType}
                        onChange={(e) => setRcRateType(e.target.value)}
                        className="w-full bg-slate-900 border border-white/5 rounded-lg px-3 py-2 text-slate-100 focus:outline-none focus:border-sky-500 transition-colors h-[34px]"
                      >
                        <option value="intra">Intra-Zone (Within same zone)</option>
                        <option value="inter">Inter-Zone (Between different zones)</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold uppercase text-slate-400">From Zone</label>
                      <select
                        value={rcZoneFrom}
                        onChange={(e) => setRcZoneFrom(e.target.value)}
                        className="w-full bg-slate-900 border border-white/5 rounded-lg px-3 py-2 text-slate-100 focus:outline-none focus:border-sky-500 transition-colors h-[34px]"
                      >
                        <option value="">Any Zone (Fallback)</option>
                        {zones.map((z: any) => (
                          <option key={z.id} value={z.id}>{z.name}</option>
                        ))}
                      </select>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold uppercase text-slate-400">To Zone (Same Zone if Intra)</label>
                      <select
                        value={rcZoneTo}
                        onChange={(e) => setRcZoneTo(e.target.value)}
                        className="w-full bg-slate-900 border border-white/5 rounded-lg px-3 py-2 text-slate-100 focus:outline-none focus:border-sky-500 transition-colors h-[34px]"
                      >
                        <option value="">Any Zone (Fallback)</option>
                        {zones.map((z: any) => (
                          <option key={z.id} value={z.id}>{z.name}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <p className="text-[9px] text-slate-500 -mt-2">Leave zones empty to establish a generic fallback card, or select zones for route overrides.</p>

                  <div className="grid grid-cols-3 gap-2">
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold uppercase text-slate-400">Base Weight (kg)</label>
                      <input
                        type="number"
                        step="0.1"
                        required
                        value={rcBaseWeight}
                        onChange={(e) => setRcBaseWeight(e.target.value)}
                        className="w-full bg-slate-900 border border-white/5 rounded-lg px-3 py-2 text-slate-100 focus:outline-none focus:border-sky-500 transition-colors"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold uppercase text-slate-400">Base Rate ($)</label>
                      <input
                        type="number"
                        step="0.01"
                        required
                        value={rcBaseRate}
                        onChange={(e) => setRcBaseRate(e.target.value)}
                        className="w-full bg-slate-900 border border-white/5 rounded-lg px-3 py-2 text-slate-100 focus:outline-none focus:border-sky-500 transition-colors"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold uppercase text-slate-400">Excess Rate / kg ($)</label>
                      <input
                        type="number"
                        step="0.01"
                        required
                        value={rcExcessRate}
                        onChange={(e) => setRcExcessRate(e.target.value)}
                        className="w-full bg-slate-900 border border-white/5 rounded-lg px-3 py-2 text-slate-100 focus:outline-none focus:border-sky-500 transition-colors"
                      />
                    </div>
                  </div>

                  <button type="submit" className="bg-sky-500 hover:bg-sky-400 text-white font-semibold rounded-lg px-6 py-2.5 text-xs transition-colors cursor-pointer shadow-lg shadow-sky-500/10">
                    Save Rate Card Rule
                  </button>
                </form>
              </div>

              {/* COD surcharge parameters */}
              <div className="glass-panel border border-white/5 rounded-xl p-5 space-y-4">
                <h2 className="text-base font-bold text-white border-b border-white/5 pb-2 flex items-center gap-1.5"><Sliders className="h-4 w-4 text-purple-400" /> Surcharge Configurations</h2>
                <form onSubmit={handleUpdateSurcharges} className="flex gap-4 items-end flex-wrap text-xs">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold uppercase text-slate-400">COD Surcharge B2B ($)</label>
                    <input
                      type="number"
                      step="0.01"
                      required
                      value={codB2B}
                      onChange={(e) => setCodB2B(e.target.value)}
                      className="bg-slate-900 border border-white/5 rounded-lg px-3.5 py-2 text-slate-100 focus:outline-none focus:border-sky-500 transition-colors w-32"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold uppercase text-slate-400">COD Surcharge B2C ($)</label>
                    <input
                      type="number"
                      step="0.01"
                      required
                      value={codB2C}
                      onChange={(e) => setCodB2C(e.target.value)}
                      className="bg-slate-900 border border-white/5 rounded-lg px-3.5 py-2 text-slate-100 focus:outline-none focus:border-sky-500 transition-colors w-32"
                    />
                  </div>
                  <button type="submit" className="bg-sky-500 hover:bg-sky-400 text-white font-semibold rounded-lg px-6 py-2.5 text-xs transition-colors cursor-pointer shadow-lg shadow-sky-500/10 h-[38px]">
                    Update Parameters
                  </button>
                </form>
              </div>

              {/* Summary overview */}
              <div className="glass-panel border border-white/5 rounded-xl p-4 bg-slate-950/20">
                <h3 className="text-xs font-bold text-white uppercase tracking-wider mb-3">Configured Rules Summary</h3>
                <div className="overflow-x-auto text-[11px]">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="border-b border-white/5 text-slate-500 font-bold">
                        <th className="pb-2">Name</th>
                        <th className="pb-2">Client</th>
                        <th className="pb-2">Scope</th>
                        <th className="pb-2">Route</th>
                        <th className="pb-2">Base Weight</th>
                        <th className="pb-2">Base Cost</th>
                        <th className="pb-2">Excess/kg</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5 text-slate-300">
                      {rateCards.map((rc: any) => (
                        <tr key={rc.id} className="hover:bg-white/[0.01]">
                          <td className="py-2.5 font-semibold text-white">{rc.name}</td>
                          <td className="py-2.5">{rc.order_type}</td>
                          <td className="py-2.5">{rc.rate_type}</td>
                          <td className="py-2.5">{(rc.zoneFrom?.name || 'Any')} → {(rc.zoneTo?.name || 'Any')}</td>
                          <td className="py-2.5">{rc.base_weight_kg} kg</td>
                          <td className="py-2.5">${Number(rc.base_rate).toFixed(2)}</td>
                          <td className="py-2.5">${Number(rc.excess_rate_per_kg).toFixed(2)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {activeTab === 'logs' && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="glass-panel border border-white/5 rounded-xl p-5"
          >
            <div className="flex justify-between items-center border-b border-white/5 pb-3 mb-4">
              <h2 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-1.5"><FileText className="h-4.5 w-4.5 text-sky-400" /> Outbound Communications Audit Trails</h2>
              <button
                onClick={loadAuditLogs}
                className="bg-slate-800 hover:bg-slate-700 border border-white/5 text-white text-xs px-3.5 py-1.5 rounded-lg transition-colors cursor-pointer"
              >
                Refresh Logs
              </button>
            </div>
            
            {auditLogs.length === 0 ? (
              <div className="py-20 text-center text-xs text-slate-500">No outbound notifications recorded.</div>
            ) : (
              <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2">
                {auditLogs.map((log: any) => {
                  const isEmail = log.type === 'email';
                  const isFailed = log.status.includes('Failed');
                  const dateStr = new Date(log.created_at).toLocaleString();

                  return (
                    <div key={log.id} className="bg-slate-900/40 border border-white/5 rounded-xl p-4 space-y-2 text-xs">
                      <div className="flex justify-between items-center">
                        <div className="flex items-center gap-2">
                          <span className={`px-2 py-0.5 rounded text-[9px] font-bold ${isEmail ? 'bg-sky-500/10 text-sky-400' : 'bg-pink-500/10 text-pink-400'}`}>
                            {log.type.toUpperCase()}
                          </span>
                          <span className="text-slate-400 font-medium">To: {log.recipient}</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className={`px-2 py-0.5 rounded text-[9px] font-bold ${isFailed ? 'bg-rose-500/10 text-rose-400' : 'bg-emerald-500/10 text-emerald-400'}`}>
                            {log.status}
                          </span>
                          <span className="text-[10px] text-slate-500 font-mono">{dateStr}</span>
                        </div>
                      </div>
                      {log.subject && <div className="font-semibold text-slate-200">Subject: {log.subject}</div>}
                      <div className="bg-slate-950/60 p-2.5 rounded text-[11px] text-slate-400 font-mono leading-normal whitespace-pre-wrap">
                        {log.body}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* CREATE ORDER DIALOG (Admin variant) */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-[#0b0f19] border border-white/10 rounded-2xl w-full max-w-xl max-h-[90vh] overflow-y-auto shadow-2xl"
          >
            <div className="flex items-center justify-between border-b border-white/5 p-5">
              <h2 className="text-sm font-bold text-white uppercase tracking-wider">Book shipment (Admin)</h2>
              <button 
                onClick={() => { setShowCreateModal(false); resetCreateForm(); }}
                className="text-slate-500 hover:text-white transition-colors cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleCreateOrder} className="p-5 space-y-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold uppercase text-slate-400">Target Customer</label>
                <select
                  value={createCustomerId}
                  onChange={(e) => setCreateCustomerId(e.target.value)}
                  className="w-full bg-slate-900 border border-white/5 rounded-lg px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-sky-500 transition-colors h-[38px]"
                >
                  {customers.map((c: any) => (
                    <option key={c.id} value={c.id}>{c.name} ({c.email})</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold uppercase text-slate-400">Pickup Address</label>
                <input
                  type="text"
                  required
                  value={createPickupAddr}
                  onChange={(e) => setCreatePickupAddr(e.target.value)}
                  placeholder="Street address of pickup"
                  className="w-full bg-slate-900 border border-white/5 rounded-lg px-3.5 py-2 text-xs text-slate-100 focus:outline-none focus:border-sky-500 transition-colors"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold uppercase text-slate-400">Pickup Pincode</label>
                  <input
                    type="text"
                    required
                    value={createPickupPostal}
                    onChange={(e) => setCreatePickupPostal(e.target.value)}
                    placeholder="e.g. 110001"
                    className="w-full bg-slate-900 border border-white/5 rounded-lg px-3.5 py-2 text-xs text-slate-100 focus:outline-none focus:border-sky-500 transition-colors"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold uppercase text-slate-400">Dropoff Pincode</label>
                  <input
                    type="text"
                    required
                    value={createDropPostal}
                    onChange={(e) => setCreateDropPostal(e.target.value)}
                    placeholder="e.g. 110017"
                    className="w-full bg-slate-900 border border-white/5 rounded-lg px-3.5 py-2 text-xs text-slate-100 focus:outline-none focus:border-sky-500 transition-colors"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold uppercase text-slate-400">Dropoff Address</label>
                <input
                  type="text"
                  required
                  value={createDropAddr}
                  onChange={(e) => setCreateDropAddr(e.target.value)}
                  placeholder="Street address of dropoff"
                  className="w-full bg-slate-900 border border-white/5 rounded-lg px-3.5 py-2 text-xs text-slate-100 focus:outline-none focus:border-sky-500 transition-colors"
                />
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold uppercase text-slate-400">Length (cm)</label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={createLength}
                    onChange={(e) => setCreateLength(e.target.value)}
                    className="w-full bg-slate-900 border border-white/5 rounded-lg px-3 py-2 text-xs text-slate-100 focus:outline-none"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold uppercase text-slate-400">Width (cm)</label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={createWidth}
                    onChange={(e) => setCreateWidth(e.target.value)}
                    className="w-full bg-slate-900 border border-white/5 rounded-lg px-3 py-2 text-xs text-slate-100 focus:outline-none"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold uppercase text-slate-400">Height (cm)</label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={createHeight}
                    onChange={(e) => setCreateHeight(e.target.value)}
                    className="w-full bg-slate-900 border border-white/5 rounded-lg px-3 py-2 text-xs text-slate-100 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold uppercase text-slate-400">Actual Weight (kg)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0.1"
                    required
                    value={createWeight}
                    onChange={(e) => setCreateWeight(e.target.value)}
                    className="w-full bg-slate-900 border border-white/5 rounded-lg px-3 py-2 text-xs text-slate-100 focus:outline-none"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold uppercase text-slate-400">Client Type</label>
                  <select
                    value={createType}
                    onChange={(e) => setCreateType(e.target.value)}
                    className="w-full bg-slate-900 border border-white/5 rounded-lg px-3 py-2 text-xs text-slate-100 focus:outline-none h-[34px]"
                  >
                    <option value="B2C">B2C</option>
                    <option value="B2B">B2B</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold uppercase text-slate-400">Payment Type</label>
                  <select
                    value={createPayment}
                    onChange={(e) => setCreatePayment(e.target.value)}
                    className="w-full bg-slate-900 border border-white/5 rounded-lg px-3 py-2 text-xs text-slate-100 focus:outline-none h-[34px]"
                  >
                    <option value="Prepaid">Prepaid</option>
                    <option value="COD">COD</option>
                  </select>
                </div>
              </div>

              {pricingPreview && (
                <div className="bg-slate-900/60 rounded-xl p-4 border border-sky-500/20 text-xs text-slate-400 space-y-1 text-left">
                  <div className="text-white font-bold mb-1 flex items-center gap-1.5 text-xs text-sky-400 uppercase tracking-widest">
                    <DollarSign className="h-4 w-4" /> Estimate cost preview
                  </div>
                  <div className="flex justify-between"><span>Routes:</span><span className="text-white font-semibold">{pricingPreview.pickup_zone_name} → {pricingPreview.drop_zone_name} ({pricingPreview.rate_type})</span></div>
                  <div className="flex justify-between"><span>Chargeable Weight:</span><span className="text-white font-semibold">{pricingPreview.chargeable_weight_kg} kg</span></div>
                  <div className="flex justify-between border-t border-white/5 pt-1.5 text-sm text-white font-extrabold"><span>Total Charge:</span><span className="text-emerald-400">${Number(pricingPreview.total_charge).toFixed(2)}</span></div>
                </div>
              )}

              {previewError && (
                <div className="bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs rounded-xl p-3 flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4" /> {previewError}
                </div>
              )}

              <div className="flex justify-end gap-3 pt-4 border-t border-white/5">
                <button
                  type="button"
                  onClick={() => { setShowCreateModal(false); resetCreateForm(); }}
                  className="bg-slate-800 hover:bg-slate-700 text-white font-semibold rounded-lg px-4.5 py-2.5 text-xs transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-sky-500 hover:bg-sky-400 text-white font-semibold rounded-lg px-6 py-2.5 text-xs transition-colors cursor-pointer shadow-lg shadow-sky-500/20"
                >
                  Confirm shipment
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      {/* ASSIGN AGENT DIALOG */}
      {showAssignModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-[#0b0f19] border border-white/10 rounded-2xl w-full max-w-md shadow-2xl text-left"
          >
            <div className="flex items-center justify-between border-b border-white/5 p-4.5">
              <h2 className="text-sm font-bold text-white uppercase tracking-wider">Assign Delivery Courier</h2>
              <button 
                onClick={() => setShowAssignModal(false)}
                className="text-slate-500 hover:text-white transition-colors cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleAssignAgent} className="p-4.5 space-y-4">
              <div className="bg-sky-500/5 border border-sky-500/10 rounded-xl p-3.5 text-xs">
                Pickup Zone: <strong className="text-white">{assignPickupZone}</strong>
              </div>

              <div className="space-y-1.5 text-xs">
                <label className="text-[10px] font-bold uppercase text-slate-400">Assignment Method</label>
                <select
                  value={assignMode}
                  onChange={(e) => setAssignMode(e.target.value as any)}
                  className="w-full bg-slate-900 border border-white/5 rounded-lg px-3 py-2 text-slate-100 focus:outline-none focus:border-sky-500 transition-colors h-[38px]"
                >
                  <option value="auto">Auto-Assign to nearest/available agent (System Calculated)</option>
                  <option value="manual">Manually select agent from list</option>
                </select>
              </div>

              {assignMode === 'manual' && (
                <div className="space-y-1.5 text-xs">
                  <label className="text-[10px] font-bold uppercase text-slate-400">Select Agent</label>
                  <select
                    value={selectedAgentId}
                    onChange={(e) => setSelectedAgentId(e.target.value)}
                    required={assignMode === 'manual'}
                    className="w-full bg-slate-900 border border-white/5 rounded-lg px-3 py-2 text-slate-100 focus:outline-none focus:border-sky-500 transition-colors h-[38px]"
                  >
                    <option value="">-- Choose Agent --</option>
                    {agents.map((a: any) => {
                      const zoneStr = a.currentZone ? `Zone: ${a.currentZone.name}` : 'No Zone';
                      const availability = a.is_active && a.is_available ? 'Available' : 'Offline';
                      const isDisabled = !(a.is_active && a.is_available);

                      return (
                        <option key={a.id} value={a.id} disabled={isDisabled}>
                          {a.name} ({zoneStr}) [{availability}]
                        </option>
                      );
                    })}
                  </select>
                </div>
              )}

              <div className="flex justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setShowAssignModal(false)}
                  className="bg-slate-800 hover:bg-slate-700 text-white font-semibold rounded-lg px-4.5 py-2.5 text-xs transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-sky-500 hover:bg-sky-400 text-white font-semibold rounded-lg px-5 py-2.5 text-xs transition-colors cursor-pointer shadow-lg shadow-sky-500/10"
                >
                  Save Assignment
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      {/* FORCE STATUS DIALOG */}
      {showStatusModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-[#0b0f19] border border-white/10 rounded-2xl w-full max-w-md shadow-2xl text-left"
          >
            <div className="flex items-center justify-between border-b border-white/5 p-4.5">
              <h2 className="text-sm font-bold text-white uppercase tracking-wider">Override Shipment Status</h2>
              <button 
                onClick={() => setShowStatusModal(false)}
                className="text-slate-500 hover:text-white transition-colors cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleForceStatus} className="p-4.5 space-y-4">
              <div className="space-y-1.5 text-xs">
                <label className="text-[10px] font-bold uppercase text-slate-400">Select New Status Override</label>
                <select
                  value={overrideStatus}
                  onChange={(e) => setOverrideStatus(e.target.value)}
                  className="w-full bg-slate-900 border border-white/5 rounded-lg px-3 py-2 text-slate-100 focus:outline-none focus:border-sky-500 transition-colors h-[38px]"
                >
                  <option value="Pending">Pending</option>
                  <option value="Assigned">Assigned</option>
                  <option value="Picked Up">Picked Up</option>
                  <option value="In Transit">In Transit</option>
                  <option value="Out for Delivery">Out for Delivery</option>
                  <option value="Delivered">Delivered</option>
                  <option value="Failed">Failed (Delivery Unsuccessful)</option>
                </select>
              </div>

              {overrideStatus === 'Failed' && (
                <div className="space-y-1.5 text-xs">
                  <label className="text-[10px] font-bold uppercase text-slate-400">Failure Reason</label>
                  <select
                    value={failedReason}
                    onChange={(e) => setFailedReason(e.target.value)}
                    required={overrideStatus === 'Failed'}
                    className="w-full bg-slate-900 border border-white/5 rounded-lg px-3 py-2 text-slate-100 focus:outline-none focus:border-sky-500 transition-colors h-[38px]"
                  >
                    <option value="Customer unavailable/not answering phone">Customer unavailable</option>
                    <option value="Incorrect delivery address provided">Incorrect address</option>
                    <option value="Refused delivery / Rejected COD charges">Refused by recipient</option>
                    <option value="Unreachable area / Road blockage">Unreachable location</option>
                  </select>
                </div>
              )}

              <p className="text-[10px] text-slate-500 leading-normal">
                Applying a status override manually updates the shipment audit log, sends the matching email/SMS alerts, and triggers system side-effects. Use with care.
              </p>

              <div className="flex justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setShowStatusModal(false)}
                  className="bg-slate-800 hover:bg-slate-700 text-white font-semibold rounded-lg px-4.5 py-2.5 text-xs transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-sky-500 hover:bg-sky-400 text-white font-semibold rounded-lg px-5 py-2.5 text-xs transition-colors cursor-pointer shadow-lg shadow-sky-500/10"
                >
                  Save Status
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
}
