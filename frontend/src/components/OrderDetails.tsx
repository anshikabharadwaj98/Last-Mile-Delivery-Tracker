import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, User, Phone, MapPin, Scale, Calendar, AlertTriangle, CheckCircle, RefreshCw, DollarSign, Clock, X } from 'lucide-react';

interface OrderDetailsProps {
  orderId: string;
  currentUser: any;
  apiFetch: (endpoint: string, options?: any) => Promise<any>;
  onBack: () => void;
  showToast: (msg: string, type: 'success' | 'error' | 'info') => void;
}

export default function OrderDetails({ orderId, currentUser, apiFetch, onBack, showToast }: OrderDetailsProps) {
  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Reschedule
  const [showRescheduleModal, setShowRescheduleModal] = useState(false);
  const [rescheduleDate, setRescheduleDate] = useState('');

  useEffect(() => {
    loadOrderDetails();
  }, [orderId]);

  const loadOrderDetails = async () => {
    setLoading(true);
    try {
      const data = await apiFetch(`/api/orders/${orderId}`);
      setOrder(data);
    } catch (err: any) {
      showToast(`Failed loading details: ${err.message}`, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleReschedule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rescheduleDate) return;
    try {
      const data = await apiFetch(`/api/orders/${orderId}/reschedule`, {
        method: 'POST',
        body: JSON.stringify({ reschedule_date: rescheduleDate })
      });
      showToast(data.message || 'Delivery rescheduled successfully!', 'success');
      setShowRescheduleModal(false);
      loadOrderDetails();
    } catch (err: any) {
      showToast(`Reschedule failed: ${err.message}`, 'error');
    }
  };

  if (loading) {
    return (
      <div className="py-32 text-center text-xs text-slate-500 font-medium max-w-7xl mx-auto">
        <RefreshCw className="h-6 w-6 animate-spin mx-auto mb-2 text-sky-400" /> Fetching shipment timeline...
      </div>
    );
  }

  if (!order) {
    return (
      <div className="py-20 text-center max-w-7xl mx-auto space-y-4">
        <AlertTriangle className="h-10 w-10 mx-auto text-amber-500" />
        <h2 className="text-sm font-bold text-white uppercase tracking-wider">Shipment Not Found</h2>
        <button onClick={onBack} className="bg-slate-800 text-white rounded px-4 py-2 text-xs font-semibold cursor-pointer">
          Back to Dashboard
        </button>
      </div>
    );
  }

  const statusClass = 
    order.status === 'Delivered' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
    order.status === 'Failed' ? 'bg-rose-500/10 text-rose-400 border-rose-500/20' :
    order.status === 'Pending' ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' :
    'bg-sky-500/10 text-sky-400 border-sky-500/20';

  return (
    <div className="max-w-7xl mx-auto px-6 py-8 text-left font-sans">
      {/* Back Header */}
      <div className="mb-8">
        <button
          onClick={onBack}
          className="bg-slate-800 hover:bg-slate-700 text-white border border-white/5 font-semibold text-xs rounded-lg px-4 py-2 flex items-center gap-1.5 transition-colors cursor-pointer"
        >
          <ArrowLeft className="h-4 w-4" /> Back to Dashboard
        </button>
      </div>

      <div className="grid md:grid-cols-3 gap-6 items-start">
        {/* Left Col: Order specifications details */}
        <div className="md:col-span-2 glass-panel border border-white/5 rounded-xl p-5 space-y-5 bg-slate-950/20">
          <div className="flex justify-between items-center border-b border-white/5 pb-3">
            <h2 className="text-base font-extrabold text-white">Order #{order.id}</h2>
            <span className={`px-2.5 py-0.5 rounded-full border text-[10px] font-bold ${statusClass}`}>
              {order.status}
            </span>
          </div>

          <div className="space-y-4">
            <h3 className="text-xs font-bold text-sky-400 uppercase tracking-widest">Metadata</h3>
            <div className="grid grid-cols-2 gap-4 text-xs">
              <div>
                <span className="text-slate-500 block">Customer</span>
                <span className="text-white font-medium">{order.customer?.name}</span>
              </div>
              <div>
                <span className="text-slate-500 block">Client Type</span>
                <span className="text-white font-medium">{order.order_type}</span>
              </div>
            </div>

            <div className="border-t border-white/5 pt-4 space-y-3.5 text-xs">
              <div className="flex gap-2">
                <MapPin className="h-4.5 w-4.5 text-sky-400 mt-0.5 flex-shrink-0" />
                <div>
                  <span className="text-slate-500 block text-[10px] font-bold uppercase">Pickup Address</span>
                  <span className="text-slate-300 font-semibold">{order.pickup_address}</span>
                  <span className="text-[10px] text-slate-500 block font-mono mt-0.5">Zone: {order.pickupZone?.name || 'Unknown'} ({order.pickup_postal_code})</span>
                </div>
              </div>
              <div className="flex gap-2">
                <MapPin className="h-4.5 w-4.5 text-pink-400 mt-0.5 flex-shrink-0" />
                <div>
                  <span className="text-slate-500 block text-[10px] font-bold uppercase">Dropoff Address</span>
                  <span className="text-slate-300 font-semibold">{order.drop_address}</span>
                  <span className="text-[10px] text-slate-500 block font-mono mt-0.5">Zone: {order.dropZone?.name || 'Unknown'} ({order.drop_postal_code})</span>
                </div>
              </div>
            </div>

            <div className="border-t border-white/5 pt-4 grid grid-cols-4 gap-2 text-xs">
              <div>
                <span className="text-slate-500 block">Volume Size</span>
                <span className="text-white font-medium">{order.length_cm}x{order.width_cm}x{order.height_cm} cm</span>
              </div>
              <div>
                <span className="text-slate-500 block">Actual Weight</span>
                <span className="text-white font-medium">{order.actual_weight_kg} kg</span>
              </div>
              <div>
                <span className="text-slate-500 block">Vol. Weight</span>
                <span className="text-white font-medium">{order.volumetric_weight_kg} kg</span>
              </div>
              <div>
                <span className="text-slate-500 block font-semibold text-sky-400">Billed Weight</span>
                <span className="text-white font-extrabold flex items-center gap-0.5"><Scale className="h-3.5 w-3.5 text-sky-400" /> {order.chargeable_weight_kg} kg</span>
              </div>
            </div>

            {/* Courier agent section */}
            <div className="border-t border-white/5 pt-4 space-y-2 text-xs">
              <h3 className="text-xs font-bold text-sky-400 uppercase tracking-widest">Fleet dispatch</h3>
              {order.agent ? (
                <div className="bg-slate-900/60 p-3.5 rounded-xl border border-white/5 space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-white font-semibold flex items-center gap-1.5"><User className="h-4 w-4 text-slate-400" /> {order.agent.name}</span>
                    <span className="text-[10px] text-slate-500 flex items-center gap-1"><Phone className="h-3.5 w-3.5 text-slate-500" /> {order.agent.phone || 'No Phone'}</span>
                  </div>
                  {order.agent.latitude && (
                    <div className="text-[10px] text-slate-500 font-mono">
                      Last broadcast telemetry coordinates: {Number(order.agent.latitude).toFixed(4)}, {Number(order.agent.longitude).toFixed(4)}
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-amber-400 font-medium flex items-center gap-1.5"><AlertTriangle className="h-4.5 w-4.5" /> Shipment currently waiting for fleet assignment.</div>
              )}
            </div>

            {/* Rescheduled / Failed tags */}
            {order.reschedule_date && (
              <div className="border-t border-white/5 pt-4 text-xs text-emerald-400 flex items-center gap-2 font-semibold">
                <Calendar className="h-4.5 w-4.5" /> Scheduled for attempt on: {new Date(order.reschedule_date).toLocaleDateString()}
              </div>
            )}

            {order.failed_reason && (
              <div className="border-t border-white/5 pt-4 text-xs text-rose-400 flex items-center gap-2 font-semibold bg-rose-500/5 p-3 rounded-lg border border-rose-500/10">
                <AlertTriangle className="h-4.5 w-4.5 flex-shrink-0" /> Reason for failure: {order.failed_reason}
              </div>
            )}

            {/* Pricing breakdown */}
            <div className="border-t border-white/5 pt-4 bg-slate-950/40 p-4 rounded-xl space-y-2 text-xs">
              <div className="flex justify-between text-slate-400">
                <span>Delivery base card rate:</span>
                <span>${Number(order.delivery_charge).toFixed(2)}</span>
              </div>
              {Number(order.cod_surcharge) > 0 && (
                <div className="flex justify-between text-amber-400">
                  <span>COD payment fee surcharge:</span>
                  <span>+${Number(order.cod_surcharge).toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between border-t border-white/5 pt-2.5 text-sm text-white font-extrabold">
                <span>Total Charge ({order.payment_type}):</span>
                <span className="text-emerald-400">${Number(order.total_charge).toFixed(2)}</span>
              </div>
            </div>

            {order.status === 'Failed' && currentUser?.role === 'customer' && (
              <button
                onClick={() => setShowRescheduleModal(true)}
                className="w-full bg-emerald-500 hover:bg-emerald-400 text-white font-semibold rounded-lg py-3 text-xs transition-colors cursor-pointer shadow-lg shadow-emerald-500/10"
              >
                Reschedule shipment
              </button>
            )}
          </div>
        </div>

        {/* Right Col: Tracking timeline flow */}
        <div className="glass-panel border border-white/5 rounded-xl p-5 bg-slate-950/20">
          <h2 className="text-sm font-bold text-white uppercase tracking-wider mb-5 flex items-center gap-1.5"><Clock className="h-4.5 w-4.5 text-sky-400" /> Tracking Timeline</h2>
          
          {(!order.history || order.history.length === 0) ? (
            <div className="text-xs text-slate-500">No telemetry logs recorded.</div>
          ) : (
            <div className="relative border-l border-white/10 pl-6.5 space-y-6 text-xs text-left">
              {order.history.map((h: any, idx: number) => {
                const isLast = idx === order.history.length - 1;
                const dateStr = new Date(h.created_at).toLocaleString();
                const roleStr = h.actor ? h.actor.role.toUpperCase() : 'SYSTEM';
                const actorStr = h.actor ? `${h.actor.name} (${roleStr})` : 'System Process';

                return (
                  <div key={idx} className="relative">
                    {/* Circle Dot indicator */}
                    <span className={`absolute -left-[32px] top-0.5 w-3 h-3 rounded-full border-2 ${
                      isLast 
                        ? h.status === 'Delivered' ? 'bg-emerald-400 border-emerald-400 ring-4 ring-emerald-500/15'
                          : h.status === 'Failed' ? 'bg-rose-400 border-rose-400 ring-4 ring-rose-500/15'
                          : 'bg-sky-400 border-sky-400 ring-4 ring-sky-500/15 animate-pulse'
                        : 'bg-[#070913] border-white/20'
                    }`} />

                    <div className="space-y-1">
                      <div className="flex justify-between items-center">
                        <span className={`font-bold ${isLast ? 'text-white text-sm' : 'text-slate-300'}`}>{h.status}</span>
                        <span className="text-[9px] text-slate-500 font-mono">{dateStr}</span>
                      </div>
                      <div className="text-[10px] text-slate-400">By: {actorStr}</div>
                      {h.notes && <div className="text-slate-500 italic mt-0.5">{h.notes}</div>}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

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
              <div className="space-y-1.5 text-xs">
                <label className="text-[10px] font-bold uppercase text-slate-400">Select New Delivery Date</label>
                <input
                  type="date"
                  required
                  min={new Date().toISOString().split('T')[0]}
                  value={rescheduleDate}
                  onChange={(e) => setRescheduleDate(e.target.value)}
                  className="w-full bg-slate-900 border border-white/5 rounded-lg px-3.5 py-2.5 text-xs text-slate-100 focus:outline-none focus:border-sky-500 transition-colors"
                />
              </div>

              <p className="text-[10px] text-slate-500 leading-normal">
                On confirmation, the previous failure record is cleared, status is reset back to 'Pending', and a new agent will be auto-dispatched to deliver the package on the specified date.
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
    </div>
  );
}
