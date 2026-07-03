import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Truck, Package, Plus, Search, Calendar, RefreshCw, X, AlertCircle, DollarSign, Scale, ArrowRight } from 'lucide-react';

interface CustomerDashboardProps {
  currentUser: any;
  apiFetch: (endpoint: string, options?: any) => Promise<any>;
  onTrackOrder: (orderId: string) => void;
  showToast: (msg: string, type: 'success' | 'error' | 'info') => void;
}

export default function CustomerDashboard({ currentUser, apiFetch, onTrackOrder, showToast }: CustomerDashboardProps) {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  // Create Order Modal State
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [pincodes, setPincodes] = useState<string[]>([]);
  const [pickupAddr, setPickupAddr] = useState('');
  const [pickupPostal, setPickupPostal] = useState('');
  const [dropAddr, setDropAddr] = useState('');
  const [dropPostal, setDropPostal] = useState('');
  const [length, setLength] = useState('10');
  const [width, setWidth] = useState('10');
  const [height, setHeight] = useState('10');
  const [weight, setWeight] = useState('1.0');
  const [paymentType, setPaymentType] = useState('Prepaid');
  const [orderType, setOrderType] = useState(currentUser?.customer_type || 'B2C');
  const [pricingPreview, setPricingPreview] = useState<any>(null);
  const [previewError, setPreviewError] = useState<string | null>(null);

  // Reschedule Modal State
  const [showRescheduleModal, setShowRescheduleModal] = useState(false);
  const [rescheduleOrderId, setRescheduleOrderId] = useState<string | null>(null);
  const [rescheduleDate, setRescheduleDate] = useState('');

  useEffect(() => {
    loadOrders();
    loadPostalCodes();
  }, []);

  // Debounced rate calculation trigger
  useEffect(() => {
    if (pickupPostal && dropPostal && length && width && height && weight && paymentType && orderType) {
      const timer = setTimeout(() => {
        calculatePricing();
      }, 500);
      return () => clearTimeout(timer);
    } else {
      setPricingPreview(null);
    }
  }, [pickupPostal, dropPostal, length, width, height, weight, paymentType, orderType]);

  const loadOrders = async () => {
    setLoading(true);
    try {
      const data = await apiFetch('/api/orders');
      setOrders(data);
    } catch (err: any) {
      showToast(`Failed to load orders: ${err.message}`, 'error');
    } finally {
      setLoading(false);
    }
  };

  const loadPostalCodes = async () => {
    try {
      const zones = await apiFetch('/api/zones');
      const codes: string[] = [];
      zones.forEach((z: any) => {
        if (z.areas) {
          z.areas.forEach((a: any) => {
            if (a.postal_code) codes.push(a.postal_code);
          });
        }
      });
      setPincodes(Array.from(new Set(codes)));
    } catch (err) {
      console.warn('Could not populate pincodes auto-complete list');
    }
  };

  const calculatePricing = async () => {
    try {
      setPreviewError(null);
      const data = await apiFetch('/api/orders/calculate', {
        method: 'POST',
        body: JSON.stringify({
          pickup_postal_code: pickupPostal,
          drop_postal_code: dropPostal,
          length_cm: parseFloat(length),
          width_cm: parseFloat(width),
          height_cm: parseFloat(height),
          actual_weight_kg: parseFloat(weight),
          order_type: orderType,
          payment_type: paymentType
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
          pickup_address: pickupAddr,
          pickup_postal_code: pickupPostal,
          drop_address: dropAddr,
          drop_postal_code: dropPostal,
          length_cm: parseFloat(length),
          width_cm: parseFloat(width),
          height_cm: parseFloat(height),
          actual_weight_kg: parseFloat(weight),
          order_type: orderType,
          payment_type: paymentType
        })
      });
      showToast(data.message || 'Order placed successfully!', 'success');
      setShowCreateModal(false);
      resetCreateForm();
      loadOrders();
    } catch (err: any) {
      showToast(`Order failed: ${err.message}`, 'error');
    }
  };

  const handleOpenReschedule = (orderId: string) => {
    setRescheduleOrderId(orderId);
    setRescheduleDate('');
    setShowRescheduleModal(true);
  };

  const handleReschedule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rescheduleOrderId || !rescheduleDate) return;
    try {
      const data = await apiFetch(`/api/orders/${rescheduleOrderId}/reschedule`, {
        method: 'POST',
        body: JSON.stringify({ reschedule_date: rescheduleDate })
      });
      showToast(data.message || 'Delivery rescheduled successfully!', 'success');
      setShowRescheduleModal(false);
      loadOrders();
    } catch (err: any) {
      showToast(`Reschedule failed: ${err.message}`, 'error');
    }
  };

  const resetCreateForm = () => {
    setPickupAddr('');
    setPickupPostal('');
    setDropAddr('');
    setDropPostal('');
    setLength('10');
    setWidth('10');
    setHeight('10');
    setWeight('1.0');
    setPaymentType('Prepaid');
    setPricingPreview(null);
    setPreviewError(null);
  };

  const filteredOrders = orders.filter((o: any) => {
    const term = searchQuery.toLowerCase();
    return (
      o.id.toString().includes(term) ||
      o.pickup_address.toLowerCase().includes(term) ||
      o.drop_address.toLowerCase().includes(term) ||
      o.status.toLowerCase().includes(term)
    );
  });

  // Aggregated Stats
  const totalCount = orders.length;
  const pendingCount = orders.filter((o) => o.status === 'Pending').length;
  const inTransitCount = orders.filter((o) => ['Assigned', 'Picked Up', 'In Transit', 'Out for Delivery'].includes(o.status)).length;
  const failedCount = orders.filter((o) => o.status === 'Failed').length;

  return (
    <div className="max-w-7xl mx-auto px-6 py-8 text-left">
      {/* Welcome banner */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-10">
        <div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight">Delivery Console</h1>
          <p className="text-slate-400 text-xs mt-1">
            Welcome back, <span className="text-sky-400 font-semibold">{currentUser?.name}</span>. Manage your shipments and track routes.
          </p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="bg-sky-500 hover:bg-sky-400 text-white font-semibold text-xs rounded-lg px-4.5 py-2.5 flex items-center gap-2 transition-all cursor-pointer hover:scale-[1.02] shadow-lg shadow-sky-500/10"
        >
          <Plus className="h-4 w-4" /> Place New Shipment
        </button>
      </div>

      {/* KPI stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="glass-panel border border-white/5 rounded-xl p-5">
          <div className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Total Shipments</div>
          <div className="text-2xl font-black text-white mt-1">{totalCount}</div>
        </div>
        <div className="glass-panel border border-white/5 rounded-xl p-5">
          <div className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Pending Assign</div>
          <div className="text-2xl font-black text-amber-400 mt-1">{pendingCount}</div>
        </div>
        <div className="glass-panel border border-white/5 rounded-xl p-5">
          <div className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Active In Transit</div>
          <div className="text-2xl font-black text-sky-400 mt-1">{inTransitCount}</div>
        </div>
        <div className="glass-panel border border-white/5 rounded-xl p-5">
          <div className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Failed Deliveries</div>
          <div className="text-2xl font-black text-rose-400 mt-1">{failedCount}</div>
        </div>
      </div>

      {/* Shipment search & table wrapper */}
      <div className="glass-panel border border-white/5 rounded-xl overflow-hidden bg-slate-950/20">
        <div className="p-4 border-b border-white/5 flex flex-col sm:flex-row justify-between items-center gap-3">
          <h2 className="text-sm font-bold text-white uppercase tracking-wider self-start sm:self-center">Your Shipments</h2>
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-3.5 w-3.5 text-slate-500" />
            <input
              type="text"
              placeholder="Search ID, route or status..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-900 border border-white/5 rounded-lg pl-9.5 pr-4 py-1.5 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-sky-500 transition-colors"
            />
          </div>
        </div>

        {loading ? (
          <div className="py-20 text-center text-xs text-slate-500 font-medium">
            <RefreshCw className="h-6 w-6 animate-spin mx-auto mb-2 text-sky-400" /> Loading shipments data...
          </div>
        ) : filteredOrders.length === 0 ? (
          <div className="py-20 text-center">
            <Package className="h-10 w-10 mx-auto text-slate-700 mb-3" />
            <p className="text-xs text-slate-500 font-bold uppercase tracking-wider">No shipments found</p>
            <p className="text-xs text-slate-500 mt-1">Get started by creating your first shipment.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-white/5 bg-slate-950/40 text-[10px] text-slate-400 uppercase tracking-widest">
                  <th className="py-3.5 px-5 font-bold">Order ID</th>
                  <th className="py-3.5 px-5 font-bold">Pickup Address</th>
                  <th className="py-3.5 px-5 font-bold">Dropoff Address</th>
                  <th className="py-3.5 px-5 font-bold">Total Cost</th>
                  <th className="py-3.5 px-5 font-bold">Status</th>
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
                      <td className="py-3.5 px-5 text-slate-300">
                        <div>{order.pickup_address}</div>
                        <div className="text-[10px] text-slate-500 font-semibold">{order.pickup_postal_code}</div>
                      </td>
                      <td className="py-3.5 px-5 text-slate-300">
                        <div>{order.drop_address}</div>
                        <div className="text-[10px] text-slate-500 font-semibold">{order.drop_postal_code}</div>
                      </td>
                      <td className="py-3.5 px-5 font-bold text-white">${Number(order.total_charge).toFixed(2)}</td>
                      <td className="py-3.5 px-5">
                        <span className={`px-2.5 py-0.5 rounded-full border text-[10px] font-bold ${statusClass}`}>
                          {order.status}
                        </span>
                      </td>
                      <td className="py-3.5 px-5 text-right">
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={() => onTrackOrder(order.id)}
                            className="bg-slate-800 hover:bg-slate-700 border border-white/5 text-white rounded px-3 py-1 font-semibold text-[10px] transition-colors cursor-pointer"
                          >
                            Track
                          </button>
                          {order.status === 'Failed' && (
                            <button
                              onClick={() => handleOpenReschedule(order.id)}
                              className="bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/35 text-emerald-400 rounded px-3 py-1 font-semibold text-[10px] transition-colors cursor-pointer"
                            >
                              Reschedule
                            </button>
                          )}
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

      {/* Pricing and Weight Details Card */}
      <div className="mt-8 bg-sky-500/5 border border-sky-500/10 rounded-xl p-5 flex gap-4 items-start">
        <AlertCircle className="h-5 w-5 text-sky-400 flex-shrink-0 mt-0.5" />
        <div className="text-xs text-slate-300 leading-relaxed">
          <strong className="text-white block mb-0.5">Dynamic Dimension Weight Billing:</strong>
          Pricing cards evaluate route distance (intra vs inter-zones) and weight criteria. The chargeable weight represents the higher of actual weight versus volumetric calculation (Length × Width × Height / 5000). COD payments contain automatic surcharges.
        </div>
      </div>

      {/* CREATE ORDER MODAL */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-[#0b0f19] border border-white/10 rounded-2xl w-full max-w-xl max-h-[90vh] overflow-y-auto shadow-2xl"
          >
            <div className="flex items-center justify-between border-b border-white/5 p-5">
              <h2 className="text-sm font-bold text-white uppercase tracking-wider">Book New shipment</h2>
              <button 
                onClick={() => { setShowCreateModal(false); resetCreateForm(); }}
                className="text-slate-500 hover:text-white transition-colors cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleCreateOrder} className="p-5 space-y-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold uppercase text-slate-400">Pickup Location</label>
                <input
                  type="text"
                  required
                  value={pickupAddr}
                  onChange={(e) => setPickupAddr(e.target.value)}
                  placeholder="Street Address, Block, Landmark"
                  className="w-full bg-slate-900 border border-white/5 rounded-lg px-3.5 py-2 text-xs text-slate-100 placeholder-slate-600 focus:outline-none focus:border-sky-500 transition-colors"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold uppercase text-slate-400">Pickup Pincode</label>
                  <input
                    type="text"
                    required
                    list="pincodes"
                    value={pickupPostal}
                    onChange={(e) => setPickupPostal(e.target.value)}
                    placeholder="e.g. 110001"
                    className="w-full bg-slate-900 border border-white/5 rounded-lg px-3.5 py-2 text-xs text-slate-100 placeholder-slate-600 focus:outline-none focus:border-sky-500 transition-colors"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold uppercase text-slate-400">Dropoff Pincode</label>
                  <input
                    type="text"
                    required
                    list="pincodes"
                    value={dropPostal}
                    onChange={(e) => setDropPostal(e.target.value)}
                    placeholder="e.g. 110017"
                    className="w-full bg-slate-900 border border-white/5 rounded-lg px-3.5 py-2 text-xs text-slate-100 placeholder-slate-600 focus:outline-none focus:border-sky-500 transition-colors"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold uppercase text-slate-400">Dropoff Location</label>
                <input
                  type="text"
                  required
                  value={dropAddr}
                  onChange={(e) => setDropAddr(e.target.value)}
                  placeholder="Street Address, Landmark, Apartment"
                  className="w-full bg-slate-900 border border-white/5 rounded-lg px-3.5 py-2 text-xs text-slate-100 placeholder-slate-600 focus:outline-none focus:border-sky-500 transition-colors"
                />
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold uppercase text-slate-400">Length (cm)</label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={length}
                    onChange={(e) => setLength(e.target.value)}
                    className="w-full bg-slate-900 border border-white/5 rounded-lg px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-sky-500 transition-colors"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold uppercase text-slate-400">Width (cm)</label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={width}
                    onChange={(e) => setWidth(e.target.value)}
                    className="w-full bg-slate-900 border border-white/5 rounded-lg px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-sky-500 transition-colors"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold uppercase text-slate-400">Height (cm)</label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={height}
                    onChange={(e) => setHeight(e.target.value)}
                    className="w-full bg-slate-900 border border-white/5 rounded-lg px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-sky-500 transition-colors"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold uppercase text-slate-400">Actual Weight (kg)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0.1"
                    required
                    value={weight}
                    onChange={(e) => setWeight(e.target.value)}
                    className="w-full bg-slate-900 border border-white/5 rounded-lg px-3.5 py-2 text-xs text-slate-100 focus:outline-none focus:border-sky-500 transition-colors"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold uppercase text-slate-400">Payment Method</label>
                  <select
                    value={paymentType}
                    onChange={(e) => setPaymentType(e.target.value)}
                    className="w-full bg-slate-900 border border-white/5 rounded-lg px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-sky-500 transition-colors h-[38px]"
                  >
                    <option value="Prepaid">Prepaid</option>
                    <option value="COD">Cash on Delivery (COD)</option>
                  </select>
                </div>
              </div>

              {/* Pricing breakdown live preview */}
              {pricingPreview && (
                <div className="bg-slate-900/60 rounded-xl p-4 border border-sky-500/20 text-xs text-slate-400 space-y-2 text-left">
                  <div className="text-white font-bold mb-2 flex items-center gap-1.5 text-xs text-sky-400 uppercase tracking-widest">
                    <DollarSign className="h-4 w-4" /> Estimated Cost Breakdown
                  </div>
                  <div className="flex justify-between">
                    <span>Zones Detected:</span>
                    <span className="text-white font-semibold">{pricingPreview.pickup_zone_name} → {pricingPreview.drop_zone_name} ({pricingPreview.rate_type})</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Volumetric Weight:</span>
                    <span className="text-white font-semibold">{pricingPreview.volumetric_weight_kg} kg</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Billed Weight (Max):</span>
                    <span className="text-white font-semibold flex items-center gap-1"><Scale className="h-3 w-3" /> {pricingPreview.chargeable_weight_kg} kg</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Rate card:</span>
                    <span className="text-slate-300">{pricingPreview.rate_card_name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Base rate:</span>
                    <span>${Number(pricingPreview.base_charge).toFixed(2)} (first {pricingPreview.base_weight_kg}kg)</span>
                  </div>
                  {Number(pricingPreview.excess_charge_total) > 0 && (
                    <div className="flex justify-between">
                      <span>Excess weight charge:</span>
                      <span>{pricingPreview.excess_weight_kg}kg × ${Number(pricingPreview.excess_rate_per_kg).toFixed(2)} = ${Number(pricingPreview.excess_charge_total).toFixed(2)}</span>
                    </div>
                  )}
                  {Number(pricingPreview.cod_surcharge) > 0 && (
                    <div className="flex justify-between text-amber-400">
                      <span>COD surcharge:</span>
                      <span>+${Number(pricingPreview.cod_surcharge).toFixed(2)}</span>
                    </div>
                  )}
                  <div className="flex justify-between border-t border-white/5 pt-2.5 text-sm text-white font-extrabold">
                    <span>Total Estimate:</span>
                    <span className="text-emerald-400">${Number(pricingPreview.total_charge).toFixed(2)}</span>
                  </div>
                </div>
              )}

              {previewError && (
                <div className="bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs rounded-xl p-3.5 flex items-center gap-2">
                  <AlertCircle className="h-4 w-4" /> {previewError}
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
                  Confirm & Place Order
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      {/* RESCHEDULE MODAL */}
      {showRescheduleModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-[#0b0f19] border border-white/10 rounded-2xl w-full max-w-md shadow-2xl text-left"
          >
            <div className="flex items-center justify-between border-b border-white/5 p-4.5">
              <h2 className="text-sm font-bold text-white uppercase tracking-wider">Reschedule Delivery Attempt</h2>
              <button 
                onClick={() => setShowRescheduleModal(false)}
                className="text-slate-500 hover:text-white transition-colors cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleReschedule} className="p-4.5 space-y-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold uppercase text-slate-400">Select New Delivery Date</label>
                <div className="relative">
                  <Calendar className="absolute left-3.5 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-500" />
                  <input
                    type="date"
                    required
                    min={new Date().toISOString().split('T')[0]}
                    value={rescheduleDate}
                    onChange={(e) => setRescheduleDate(e.target.value)}
                    className="w-full bg-slate-900 border border-white/5 rounded-lg pl-10.5 pr-4 py-2.5 text-xs text-slate-100 focus:outline-none focus:border-sky-500 transition-colors"
                  />
                </div>
              </div>

              <p className="text-[10px] text-slate-500 leading-normal">
                On confirmation, the previous failure record is archived, shipment status is reset back to 'Pending', and a new agent will be auto-dispatched to deliver the package on the specified date.
              </p>

              <div className="flex justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setShowRescheduleModal(false)}
                  className="bg-slate-800 hover:bg-slate-700 text-white font-semibold rounded-lg px-4.5 py-2.5 text-xs transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-emerald-500 hover:bg-emerald-400 text-white font-semibold rounded-lg px-5 py-2.5 text-xs transition-colors cursor-pointer"
                >
                  Confirm Reschedule
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      {/* Datalist helper */}
      <datalist id="pincodes">
        {pincodes.map((code) => (
          <option key={code} value={code} />
        ))}
      </datalist>
    </div>
  );
}
