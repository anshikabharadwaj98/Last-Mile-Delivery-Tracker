import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  MapPin, Compass, CheckCircle2, ChevronRight, Activity, DollarSign, 
  Map, Phone, User, Calendar, LogOut, CheckSquare, Award, RefreshCw, X, AlertTriangle 
} from 'lucide-react';

interface AgentDashboardProps {
  currentUser: any;
  apiFetch: (endpoint: string, options?: any) => Promise<any>;
  onTrackOrder: (orderId: string) => void;
  showToast: (msg: string, type: 'success' | 'error' | 'info') => void;
  onLogout: () => void;
}

export default function AgentDashboard({ currentUser, apiFetch, onTrackOrder, showToast, onLogout }: AgentDashboardProps) {
  const [activeTab, setActiveTab] = useState<'deliveries' | 'earnings' | 'mocker'>('deliveries');
  const [loading, setLoading] = useState(true);
  
  // Data caches
  const [orders, setOrders] = useState<any[]>([]);
  const [zones, setZones] = useState<any[]>([]);
  const [localAgentState, setLocalAgentState] = useState<any>(currentUser);

  // Mocker form
  const [latitude, setLatitude] = useState(currentUser?.latitude || '28.6304');
  const [longitude, setLongitude] = useState(currentUser?.longitude || '77.2177');
  const [currentZoneId, setCurrentZoneId] = useState(currentUser?.current_zone_id || '');

  // Update Status Modal
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const [selectedStatus, setSelectedStatus] = useState('Picked Up');
  const [failedReason, setFailedReason] = useState('Customer unavailable/not answering phone');
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    loadAgentData();
  }, []);

  const loadAgentData = async () => {
    setLoading(true);
    try {
      // 1. Fetch zones
      const zonesData = await apiFetch('/api/zones');
      setZones(zonesData);

      // 2. Fetch assigned orders
      const ordersData = await apiFetch('/api/orders');
      setOrders(ordersData);
    } catch (err: any) {
      showToast(`Failed loading console: ${err.message}`, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleSyncLocation = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const data = await apiFetch('/api/agent/location', {
        method: 'PUT',
        body: JSON.stringify({
          latitude: parseFloat(latitude),
          longitude: parseFloat(longitude),
          current_zone_id: currentZoneId || null
        })
      });
      showToast('GPS coordinates synchronized!', 'success');
      setLocalAgentState(data.agent);
      loadAgentData();
    } catch (err: any) {
      showToast(`Location sync failed: ${err.message}`, 'error');
    }
  };

  const handleOpenStatusModal = (orderId: string, currentStatus: string) => {
    setSelectedOrderId(orderId);
    setSelectedStatus(currentStatus || 'Picked Up');
    setFailedReason('Customer unavailable/not answering phone');
    setShowStatusModal(true);
  };

  const handleUpdateStatus = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOrderId) return;
    setUpdating(true);
    try {
      const data = await apiFetch(`/api/orders/${selectedOrderId}/status`, {
        method: 'PUT',
        body: JSON.stringify({
          status: selectedStatus,
          failed_reason: selectedStatus === 'Failed' ? failedReason : null
        })
      });
      showToast(data.message || 'Shipment status updated!', 'success');
      setShowStatusModal(false);
      loadAgentData();
    } catch (err: any) {
      showToast(`Failed updating status: ${err.message}`, 'error');
    } finally {
      setUpdating(false);
    }
  };

  // Split active tasks vs completed earnings history
  const activeDeliveries = orders.filter((o) => o.status !== 'Delivered' && o.status !== 'Failed');
  const completedDeliveries = orders.filter((o) => o.status === 'Delivered');
  const totalEarnings = completedDeliveries.reduce((sum, o) => sum + 12.50, 0); // Flat mock agent delivery payout ($12.50 per delivery)

  return (
    <div className="min-h-screen text-slate-100 bg-[#070913] relative font-sans flex flex-col justify-between max-w-md mx-auto border-x border-white/5 shadow-2xl pb-16">
      {/* Top compact header */}
      <div className="bg-slate-950/60 backdrop-blur border-b border-white/5 p-4 flex justify-between items-center sticky top-0 z-30">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
          <div>
            <h1 className="text-xs font-bold text-white tracking-wide uppercase">Courier Portal</h1>
            <p className="text-[10px] text-slate-400 font-semibold">{localAgentState?.name}</p>
          </div>
        </div>

        <button 
          onClick={onLogout} 
          className="text-slate-500 hover:text-white transition-colors cursor-pointer"
          title="Logout"
        >
          <LogOut className="h-4.5 w-4.5" />
        </button>
      </div>

      {/* Main scrolling viewport */}
      <div className="flex-1 p-4 overflow-y-auto space-y-4 text-left">
        
        {/* Active GPS status banner in Today's deliveries */}
        {activeTab === 'deliveries' && (
          <div 
            onClick={() => setActiveTab('mocker')}
            className="bg-slate-900 border border-sky-500/20 rounded-xl p-3.5 flex justify-between items-center cursor-pointer hover:bg-slate-900/60 transition-colors"
          >
            <div className="flex gap-3 items-center">
              <Compass className="h-5 w-5 text-sky-400 flex-shrink-0" />
              <div className="text-[11px]">
                <div className="font-bold text-white">Live GPS Broadcast</div>
                <div className="text-slate-400 mt-0.5">Lat: {Number(localAgentState?.latitude || 28.6304).toFixed(4)} | Lon: {Number(localAgentState?.longitude || 77.2177).toFixed(4)}</div>
              </div>
            </div>
            <ChevronRight className="h-4.5 w-4.5 text-slate-500" />
          </div>
        )}

        {/* Tab views */}
        {loading ? (
          <div className="py-20 text-center text-xs text-slate-500">
            <RefreshCw className="h-6 w-6 animate-spin mx-auto mb-2 text-sky-400" /> Synchronizing fleet assignments...
          </div>
        ) : (
          <>
            {/* TODAY'S ACTIVE ROUTE DELIVERIES */}
            {activeTab === 'deliveries' && (
              <div className="space-y-3">
                <div className="flex justify-between items-center mb-1">
                  <h2 className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">Active Deliveries ({activeDeliveries.length})</h2>
                  <button 
                    onClick={loadAgentData}
                    className="text-[10px] text-sky-400 hover:text-sky-300 transition-colors font-semibold"
                  >
                    Refresh
                  </button>
                </div>

                {activeDeliveries.length === 0 ? (
                  <div className="bg-slate-950/20 border border-white/5 rounded-xl p-10 text-center space-y-3">
                    <CheckSquare className="h-8 w-8 text-slate-700 mx-auto" />
                    <div>
                      <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">No Shipments Assigned</p>
                      <p className="text-[10px] text-slate-500 mt-1">Coordinates synced. Waiting for orders in your zone.</p>
                    </div>
                  </div>
                ) : (
                  activeDeliveries.map((order: any) => {
                    const statusClass = 
                      order.status === 'Picked Up' ? 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20' :
                      order.status === 'In Transit' ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' :
                      order.status === 'Out for Delivery' ? 'bg-pink-500/10 text-pink-400 border-pink-500/20' :
                      'bg-sky-500/10 text-sky-400 border-sky-500/20';

                    return (
                      <div key={order.id} className="glass-panel border border-white/5 rounded-xl p-4 bg-slate-950/20 space-y-3">
                        <div className="flex justify-between items-center">
                          <span className="text-[11px] font-mono font-bold text-white">📦 ORDER #{order.id}</span>
                          <span className={`px-2.5 py-0.5 rounded-full border text-[9px] font-bold ${statusClass}`}>
                            {order.status}
                          </span>
                        </div>

                        <div className="border-y border-white/5 py-2.5 space-y-2 text-xs">
                          <div className="flex gap-2">
                            <span className="text-[8px] font-mono bg-sky-500/10 text-sky-400 px-1 py-0.5 rounded h-4 flex items-center">PUP</span>
                            <span className="text-slate-300 font-medium">{order.pickup_address}</span>
                          </div>
                          <div className="flex gap-2">
                            <span className="text-[8px] font-mono bg-pink-500/10 text-pink-400 px-1 py-0.5 rounded h-4 flex items-center">DO</span>
                            <span className="text-slate-300 font-medium">{order.drop_address}</span>
                          </div>
                        </div>

                        <div className="flex justify-between items-center text-[10px] text-slate-400">
                          <div>Type: <strong className="text-white">{order.order_type}</strong> | Pay: <strong className="text-emerald-400">{order.payment_type}</strong></div>
                          <div className="font-extrabold text-white">${Number(order.total_charge).toFixed(2)}</div>
                        </div>

                        <div className="grid grid-cols-2 gap-2 pt-2.5">
                          <button
                            onClick={() => onTrackOrder(order.id)}
                            className="bg-slate-800 hover:bg-slate-700 text-white font-semibold rounded-lg py-2 text-[10px] text-center transition-colors cursor-pointer"
                          >
                            Route Details
                          </button>
                          <button
                            onClick={() => handleOpenStatusModal(order.id, order.status)}
                            className="bg-emerald-500 hover:bg-emerald-400 text-white font-bold rounded-lg py-2 text-[10px] text-center transition-colors cursor-pointer shadow-md shadow-emerald-500/10"
                          >
                            Update Status
                          </button>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            )}

            {/* EARNINGS SUMMARY HISTORY */}
            {activeTab === 'earnings' && (
              <div className="space-y-4">
                <div className="bg-slate-900 border border-white/5 rounded-xl p-5 flex gap-4 items-center">
                  <div className="p-3 bg-emerald-500/15 border border-emerald-500/20 text-emerald-400 rounded-xl">
                    <DollarSign className="h-6 w-6" />
                  </div>
                  <div>
                    <div className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">Total Earnings Today</div>
                    <div className="text-2xl font-black text-white mt-0.5">${totalEarnings.toFixed(2)}</div>
                    <div className="text-[9px] text-slate-400 mt-0.5">Based on flat payout: $12.50 per delivery</div>
                  </div>
                </div>

                <div className="space-y-2.5">
                  <h2 className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">Delivery History ({completedDeliveries.length})</h2>

                  {completedDeliveries.length === 0 ? (
                    <div className="py-12 text-center text-xs text-slate-500">No completed orders found.</div>
                  ) : (
                    completedDeliveries.map((order: any) => (
                      <div key={order.id} className="bg-slate-900/30 border border-white/5 rounded-xl p-3.5 flex justify-between items-center text-xs">
                        <div>
                          <div className="font-bold text-white">#{order.id}</div>
                          <div className="text-[10px] text-slate-400 mt-0.5">{order.drop_address}</div>
                        </div>
                        <div className="text-right">
                          <div className="font-bold text-emerald-400">+$12.50</div>
                          <div className="text-[9px] text-slate-500 mt-0.5">Payment: {order.payment_type}</div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}

            {/* GPS COORDINATES LOCATION MOCKER */}
            {activeTab === 'mocker' && (
              <form onSubmit={handleSyncLocation} className="space-y-4">
                <div className="bg-slate-900 border border-white/5 rounded-xl p-4 text-xs">
                  <h3 className="font-bold text-white flex items-center gap-1.5 mb-2"><Compass className="h-4.5 w-4.5 text-sky-400" /> Simulating Driver GPS</h3>
                  <p className="text-slate-400 leading-relaxed text-[11px]">
                    The geofenced auto-assignment engine evaluates the coordinates and current active zones of online agents to automatically dispatch deliveries.
                  </p>
                </div>

                <div className="space-y-1.5 text-xs">
                  <label className="text-[10px] font-bold uppercase text-slate-400">Latitude</label>
                  <input
                    type="number"
                    step="0.0001"
                    required
                    value={latitude}
                    onChange={(e) => setLatitude(e.target.value)}
                    className="w-full bg-slate-900 border border-white/5 rounded-lg px-3.5 py-2 text-xs text-slate-100 placeholder-slate-600 focus:outline-none focus:border-sky-500 transition-colors"
                  />
                </div>

                <div className="space-y-1.5 text-xs">
                  <label className="text-[10px] font-bold uppercase text-slate-400">Longitude</label>
                  <input
                    type="number"
                    step="0.0001"
                    required
                    value={longitude}
                    onChange={(e) => setLongitude(e.target.value)}
                    className="w-full bg-slate-900 border border-white/5 rounded-lg px-3.5 py-2 text-xs text-slate-100 placeholder-slate-600 focus:outline-none focus:border-sky-500 transition-colors"
                  />
                </div>

                <div className="space-y-1.5 text-xs">
                  <label className="text-[10px] font-bold uppercase text-slate-400">Operational Zone</label>
                  <select
                    value={currentZoneId}
                    onChange={(e) => setCurrentZoneId(e.target.value)}
                    className="w-full bg-slate-900 border border-white/5 rounded-lg px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-sky-500 transition-colors h-[38px]"
                  >
                    <option value="">No Active Zone (Offline)</option>
                    {zones.map((z: any) => (
                      <option key={z.id} value={z.id}>{z.name}</option>
                    ))}
                  </select>
                </div>

                <button
                  type="submit"
                  className="w-full bg-sky-500 hover:bg-sky-400 text-white font-semibold rounded-lg py-3 text-xs transition-colors cursor-pointer shadow-lg shadow-sky-500/15"
                >
                  Synchronize Location
                </button>
              </form>
            )}
          </>
        )}
      </div>

      {/* Mobile viewport bottom navigation bar */}
      <div className="bg-slate-950/80 backdrop-blur border-t border-white/5 h-14 flex items-center justify-around fixed bottom-0 left-0 right-0 max-w-md mx-auto z-30">
        <button
          onClick={() => setActiveTab('deliveries')}
          className={`flex flex-col items-center gap-1 text-[9px] font-bold transition-colors cursor-pointer ${
            activeTab === 'deliveries' ? 'text-sky-400' : 'text-slate-500 hover:text-slate-300'
          }`}
        >
          <CheckSquare className="h-4.5 w-4.5" />
          <span>Deliveries</span>
        </button>

        <button
          onClick={() => setActiveTab('earnings')}
          className={`flex flex-col items-center gap-1 text-[9px] font-bold transition-colors cursor-pointer ${
            activeTab === 'earnings' ? 'text-sky-400' : 'text-slate-500 hover:text-slate-300'
          }`}
        >
          <DollarSign className="h-4.5 w-4.5" />
          <span>Earnings</span>
        </button>

        <button
          onClick={() => setActiveTab('mocker')}
          className={`flex flex-col items-center gap-1 text-[9px] font-bold transition-colors cursor-pointer ${
            activeTab === 'mocker' ? 'text-sky-400' : 'text-slate-500 hover:text-slate-300'
          }`}
        >
          <Compass className="h-4.5 w-4.5" />
          <span>GPS Mocker</span>
        </button>
      </div>

      {/* UPDATE STATUS DRAWER MODAL */}
      {showStatusModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-end justify-center p-4">
          <motion.div
            initial={{ y: 150, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="bg-[#0b0f19] border border-white/10 rounded-2xl w-full max-w-md shadow-2xl text-left"
          >
            <div className="flex items-center justify-between border-b border-white/5 p-4.5">
              <h2 className="text-sm font-bold text-white uppercase tracking-wider">Update Shipment Status</h2>
              <button 
                onClick={() => setShowStatusModal(false)}
                className="text-slate-500 hover:text-white transition-colors cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleUpdateStatus} className="p-4.5 space-y-4">
              <div className="space-y-1.5 text-xs">
                <label className="text-[10px] font-bold uppercase text-slate-400">Select New Status</label>
                <select
                  value={selectedStatus}
                  onChange={(e) => setSelectedStatus(e.target.value)}
                  className="w-full bg-slate-900 border border-white/5 rounded-lg px-3 py-2 text-slate-100 focus:outline-none focus:border-sky-500 transition-colors h-[38px]"
                >
                  <option value="Picked Up">Picked Up</option>
                  <option value="In Transit">In Transit</option>
                  <option value="Out for Delivery">Out for Delivery</option>
                  <option value="Delivered">Delivered</option>
                  <option value="Failed">Failed (Delivery Unsuccessful)</option>
                </select>
              </div>

              {selectedStatus === 'Failed' && (
                <div className="space-y-1.5 text-xs">
                  <label className="text-[10px] font-bold uppercase text-slate-400">Failure Reason</label>
                  <select
                    value={failedReason}
                    onChange={(e) => setFailedReason(e.target.value)}
                    required={selectedStatus === 'Failed'}
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
                Confirming updates the shipment state and sends matching notifications.
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
                  disabled={updating}
                  className="bg-sky-500 hover:bg-sky-400 text-white font-semibold rounded-lg px-5 py-2.5 text-xs transition-colors cursor-pointer shadow-lg shadow-sky-500/10"
                >
                  {updating ? 'Updating...' : 'Save Updates'}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
}
