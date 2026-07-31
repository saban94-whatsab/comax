import React, { useState } from 'react';
import { WorkOrder } from '../types';
import { ClipboardList, CheckCircle2, ChevronDown, Plus, Search, MapPin, Package, Hash } from 'lucide-react';

interface WorkOrderSelectorProps {
  workOrders: WorkOrder[];
  selectedOrderNumber: string;
  onSelectOrder: (order: WorkOrder) => void;
  onManualOrderChange: (orderNumber: string) => void;
  onAddNewOrder: (newOrder: WorkOrder) => void;
}

export const WorkOrderSelector: React.FC<WorkOrderSelectorProps> = ({
  workOrders,
  selectedOrderNumber,
  onSelectOrder,
  onManualOrderChange,
  onAddNewOrder,
}) => {
  const [isOpenList, setIsOpenList] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);

  // Form states for manual order addition
  const [newOrderNum, setNewOrderNum] = useState('');
  const [newClient, setNewClient] = useState('');
  const [newAddress, setNewAddress] = useState('');

  const filteredOrders = workOrders.filter(
    (o) =>
      o.orderNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      o.clientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      o.address.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const selectedOrder = workOrders.find(
    (o) => o.orderNumber.trim().toLowerCase() === selectedOrderNumber.trim().toLowerCase()
  );

  const handleCreateOrder = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newOrderNum.trim()) return;

    const created: WorkOrder = {
      id: `wo-${Date.now()}`,
      orderNumber: newOrderNum.trim(),
      clientName: newClient.trim() || 'לקוח כללי',
      address: newAddress.trim() || 'לא צוינה כתובת',
      status: 'pending',
      itemsCount: 1,
      deliveryDate: new Date().toISOString().split('T')[0],
    };

    onAddNewOrder(created);
    onSelectOrder(created);
    setShowAddForm(false);
    setNewOrderNum('');
    setNewClient('');
    setNewAddress('');
  };

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs text-slate-800 dir-rtl">
      {/* Top Section: Input or Selector */}
      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <label className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
            <ClipboardList className="w-4 h-4 text-blue-600" />
            <span>מספר הזמנה / תעודת משלוח</span>
          </label>
          <button
            type="button"
            onClick={() => setIsOpenList(!isOpenList)}
            className="text-xs text-blue-600 hover:text-blue-700 font-bold flex items-center gap-1 bg-blue-50 px-3 py-1.5 rounded-full border border-blue-200 transition"
          >
            <span>סידור עבודה פתוח ({workOrders.length})</span>
            <ChevronDown className={`w-3.5 h-3.5 transition-transform ${isOpenList ? 'rotate-180' : ''}`} />
          </button>
        </div>

        {/* Input box */}
        <div className="relative">
          <input
            type="text"
            placeholder="הזן מספר תעודה/הזמנה (למשל: INV-90421)"
            value={selectedOrderNumber}
            onChange={(e) => onManualOrderChange(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 font-mono text-base font-bold text-slate-900 focus:outline-none focus:border-blue-600 focus:bg-white shadow-xs pr-10"
          />
          <Hash className="w-5 h-5 text-slate-400 absolute left-3 top-3.5" />
        </div>

        {/* Selected Order Detail Badge */}
        {selectedOrder && (
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 flex items-start gap-3">
            <div className="p-2 bg-blue-100 rounded-lg text-blue-700 mt-0.5">
              <Package className="w-4 h-4" />
            </div>
            <div className="flex-1 text-xs">
              <div className="font-bold text-slate-900 text-sm flex items-center justify-between">
                <span>{selectedOrder.clientName}</span>
                <span
                  className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                    selectedOrder.status === 'scanned'
                      ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                      : 'bg-amber-100 text-amber-800 border border-amber-200'
                  }`}
                >
                  {selectedOrder.status === 'scanned' ? 'תועד ונסרק' : 'ממתין לסריקה'}
                </span>
              </div>
              <div className="text-slate-500 flex items-center gap-1 mt-1 font-medium">
                <MapPin className="w-3.5 h-3.5 text-slate-400" />
                <span>{selectedOrder.address}</span>
              </div>
              {selectedOrder.notes && (
                <div className="text-amber-800 mt-1.5 font-sans bg-amber-50 p-2 rounded-lg border border-amber-200 text-xs">
                  💡 {selectedOrder.notes}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Accordion / Modal for Open Work Orders List */}
      {isOpenList && (
        <div className="mt-4 pt-4 border-t border-slate-100 space-y-3">
          {/* Search bar */}
          <div className="relative">
            <input
              type="text"
              placeholder="חפש לפי מספר הזמנה או שם לקוח..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-blue-600 focus:bg-white pr-8"
            />
            <Search className="w-4 h-4 text-slate-400 absolute left-2.5 top-2.5" />
          </div>

          {/* Work Orders List */}
          <div className="max-h-56 overflow-y-auto space-y-2 dir-rtl pr-1">
            {filteredOrders.length === 0 ? (
              <div className="text-center py-4 text-xs text-slate-400">
                לא נמצאו הזמנות תואמות
              </div>
            ) : (
              filteredOrders.map((order) => {
                const isSelected =
                  selectedOrderNumber.trim().toLowerCase() === order.orderNumber.toLowerCase();
                return (
                  <div
                    key={order.id}
                    onClick={() => {
                      onSelectOrder(order);
                      setIsOpenList(false);
                    }}
                    className={`p-3 rounded-xl border transition cursor-pointer flex items-center justify-between gap-3 ${
                      isSelected
                        ? 'bg-blue-50 border-blue-400 text-slate-900 shadow-xs'
                        : 'bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-800'
                    }`}
                  >
                    <div className="space-y-0.5 overflow-hidden">
                      <div className="font-bold text-sm flex items-center gap-2">
                        <span className="font-mono text-blue-600">{order.orderNumber}</span>
                        <span className="text-slate-700 truncate">• {order.clientName}</span>
                      </div>
                      <div className="text-xs text-slate-500 truncate flex items-center gap-1">
                        <MapPin className="w-3 h-3 text-slate-400" />
                        <span>{order.address}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-[11px] text-slate-400 font-mono">
                        {order.itemsCount} פריטים
                      </span>
                      {order.status === 'scanned' ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      ) : (
                        <div className="w-2 h-2 rounded-full bg-amber-500"></div>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Add Manual Order Button */}
          {!showAddForm ? (
            <button
              onClick={() => setShowAddForm(true)}
              className="w-full py-2 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl text-xs text-blue-600 font-bold flex items-center justify-center gap-1.5 transition"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>הוסף הזמנה חדשה לסידור העבודה</span>
            </button>
          ) : (
            <form onSubmit={handleCreateOrder} className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 space-y-2.5">
              <div className="text-xs font-bold text-slate-700">הוספת הזמנה לסידור:</div>
              <input
                type="text"
                placeholder="מספר הזמנה (לדוגמה: INV-90999)"
                value={newOrderNum}
                onChange={(e) => setNewOrderNum(e.target.value)}
                required
                className="w-full bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-xs text-slate-900 focus:outline-none focus:border-blue-600"
              />
              <input
                type="text"
                placeholder="שם הלקוח"
                value={newClient}
                onChange={(e) => setNewClient(e.target.value)}
                className="w-full bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-xs text-slate-900 focus:outline-none focus:border-blue-600"
              />
              <input
                type="text"
                placeholder="כתובת / יעד"
                value={newAddress}
                onChange={(e) => setNewAddress(e.target.value)}
                className="w-full bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-xs text-slate-900 focus:outline-none focus:border-blue-600"
              />
              <div className="flex gap-2">
                <button
                  type="submit"
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 rounded-lg text-xs transition shadow-xs"
                >
                  שמור לבחירה
                </button>
                <button
                  type="button"
                  onClick={() => setShowAddForm(false)}
                  className="bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold px-3 py-2 rounded-lg text-xs transition"
                >
                  ביטול
                </button>
              </div>
            </form>
          )}
        </div>
      )}
    </div>
  );
};
