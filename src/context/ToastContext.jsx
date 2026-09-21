import React, { createContext, useCallback, useContext, useState } from 'react';
import { CheckCircle, Info, AlertTriangle, X } from 'lucide-react';

const ToastContext = createContext();

let idCounter = 0;

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);

  const remove = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const show = useCallback((message, type = 'success', duration = 5000) => {
    const id = ++idCounter;
    setToasts((prev) => [...prev, { id, message, type }]);
    if (duration > 0) {
      setTimeout(() => remove(id), duration);
    }
    return id;
  }, [remove]);

  const icons = {
    success: <CheckCircle size={18} className="text-green-600 dark:text-green-400 shrink-0" />,
    info: <Info size={18} className="text-[#C85A32] dark:text-[#E06F45] shrink-0" />,
    error: <AlertTriangle size={18} className="text-red-500 shrink-0" />,
  };

  return (
    <ToastContext.Provider value={{ show }}>
      {children}
      <div className="fixed bottom-6 right-6 z-[9999] flex flex-col gap-3 w-[calc(100%-3rem)] max-w-sm">
        {toasts.map((t) => (
          <div
            key={t.id}
            className="flex items-start gap-3 bg-[#1C1A18] dark:bg-[#F5F3EF] text-[#FAF6EE] dark:text-[#1C1A18] px-4 py-3 rounded-lg shadow-lg animate-in fade-in slide-in-from-bottom-2 duration-300"
          >
            {icons[t.type] || icons.info}
            <p className="text-sm font-medium flex-1">{t.message}</p>
            <button
              onClick={() => remove(t.id)}
              className="opacity-60 hover:opacity-100 transition-opacity"
              aria-label="Dismiss"
            >
              <X size={16} />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
};

export const useToast = () => useContext(ToastContext);
