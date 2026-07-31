import React, { useState } from 'react';
import { Driver } from '../types';
import { INITIAL_DRIVERS, saveDriverSession } from '../utils/storage';
import { UserCheck, UserPlus, Phone, Check, ShieldCheck, Truck } from 'lucide-react';

interface DriverLoginModalProps {
  currentDriver: Driver | null;
  onSelectDriver: (driver: Driver) => void;
  onClose?: () => void;
  isInitialRequired?: boolean;
}

export const DriverLoginModal: React.FC<DriverLoginModalProps> = ({
  currentDriver,
  onSelectDriver,
  onClose,
  isInitialRequired = false,
}) => {
  const [customName, setCustomName] = useState('');
  const [customPhone, setCustomPhone] = useState('');
  const [showCustomForm, setShowCustomForm] = useState(false);

  const handleSelect = (driver: Driver) => {
    saveDriverSession(driver);
    onSelectDriver(driver);
    if (onClose) onClose();
  };

  const handleAddCustom = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customName.trim()) return;

    const newDriver: Driver = {
      id: `custom-${Date.now()}`,
      name: customName.trim(),
      phone: customPhone.trim() || '050-0000000',
      avatar: '🚛',
    };

    handleSelect(newDriver);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 dir-rtl">
      <div className="bg-white border border-slate-200 rounded-3xl w-full max-w-md p-6 shadow-2xl text-slate-900">
        {/* Modal Header */}
        <div className="text-center mb-6">
          <div className="w-14 h-14 mx-auto mb-3 rounded-2xl bg-blue-50 border border-blue-200 flex items-center justify-center text-3xl shadow-xs">
            🚚
          </div>
          <h2 className="text-2xl font-black text-slate-900">זיהוי וכניסת נהג</h2>
          <p className="text-xs text-slate-500 font-medium mt-1">
            בחר את שמך מהרשימה או הזן פרטים לכניסה מהירה
          </p>
        </div>

        {/* Saved Session Info */}
        {currentDriver && !isInitialRequired && (
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3 mb-5 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <span className="text-2xl">{currentDriver.avatar || '👨‍✈️'}</span>
              <div>
                <div className="text-[11px] text-slate-500 font-medium">נהג מחובר כעת</div>
                <div className="font-bold text-slate-900 text-sm">{currentDriver.name}</div>
              </div>
            </div>
            <span className="inline-flex items-center text-xs bg-emerald-50 text-emerald-800 border border-emerald-200 px-2.5 py-1 rounded-full font-bold">
              <ShieldCheck className="w-3.5 h-3.5 me-1 text-emerald-600" /> סשן שמור
            </span>
          </div>
        )}

        {/* Drivers List Grid */}
        <div className="space-y-3 mb-5">
          <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block">
            נהגים רשומים בסידור העבודה:
          </label>
          <div className="grid grid-cols-2 gap-2.5">
            {INITIAL_DRIVERS.map((driver) => {
              const isSelected = currentDriver?.name === driver.name;
              return (
                <button
                  key={driver.id}
                  onClick={() => handleSelect(driver)}
                  className={`flex items-center gap-3 p-3 rounded-2xl border text-right transition group relative ${
                    isSelected
                      ? 'bg-blue-50 border-blue-600 text-blue-900 shadow-xs'
                      : 'bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-800'
                  }`}
                >
                  <span className="text-2xl">{driver.avatar}</span>
                  <div className="overflow-hidden">
                    <div className="font-bold text-sm truncate">{driver.name}</div>
                    <div className="text-xs text-slate-500 truncate">{driver.phone}</div>
                  </div>
                  {isSelected && (
                    <div className="absolute top-2 left-2 w-5 h-5 bg-blue-600 rounded-full flex items-center justify-center text-white text-xs">
                      <Check className="w-3 h-3" />
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Add / Enter Custom Driver Toggle */}
        {!showCustomForm ? (
          <button
            onClick={() => setShowCustomForm(true)}
            className="w-full py-3 px-4 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 flex items-center justify-center gap-2 transition"
          >
            <UserPlus className="w-4 h-4 text-blue-600" />
            <span>הזן שם נהג / מספר טלפון אחר</span>
          </button>
        ) : (
          <form onSubmit={handleAddCustom} className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-3">
            <h4 className="text-xs font-bold text-slate-700">הזנת נהג חדש:</h4>
            <div>
              <input
                type="text"
                placeholder="שם הנהג (למשל: משה כהן)"
                value={customName}
                onChange={(e) => setCustomName(e.target.value)}
                required
                className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm text-slate-900 focus:outline-none focus:border-blue-600"
              />
            </div>
            <div>
              <div className="relative">
                <input
                  type="tel"
                  placeholder="מספר טלפון (למשל: 050-1234567)"
                  value={customPhone}
                  onChange={(e) => setCustomPhone(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm text-slate-900 focus:outline-none focus:border-blue-600 pr-8"
                />
                <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              </div>
            </div>
            <div className="flex gap-2 pt-1">
              <button
                type="submit"
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5 rounded-xl text-xs transition"
              >
                שמור וכנס
              </button>
              <button
                type="button"
                onClick={() => setShowCustomForm(false)}
                className="bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold px-3 py-2.5 rounded-xl text-xs"
              >
                ביטול
              </button>
            </div>
          </form>
        )}

        {/* Footer info */}
        <div className="mt-5 pt-4 border-t border-slate-100 text-center text-xs text-slate-400 font-medium">
          הסשן נשמר במכשיר (LocalStorage) למעבר ישיר לסריקה
        </div>

        {onClose && !isInitialRequired && (
          <button
            onClick={onClose}
            className="w-full mt-3 py-2 text-xs font-bold text-slate-500 hover:text-slate-900"
          >
            סגור
          </button>
        )}
      </div>
    </div>
  );
};
