import { createContext, useContext, useState, useRef } from "react";

const ToastContext = createContext(null);

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const nextId = useRef(1);

  function remove(id) {
    setToasts(function (list) {
      const kept = [];
      for (let i = 0; i < list.length; i++) {
        if (list[i].id !== id) kept.push(list[i]);
      }
      return kept;
    });
  }

  function show(message, tone) {
    const id = nextId.current;
    nextId.current = id + 1;

    setToasts(function (list) {
      return list.concat([{ id: id, message: message, tone: tone || "success" }]);
    });

    setTimeout(function () {
      remove(id);
    }, 4000);
  }

  const items = [];
  for (let i = 0; i < toasts.length; i++) {
    const t = toasts[i];
    items.push(
      <div key={t.id} className={"toast toast-" + t.tone} role="status">
        <span>{t.message}</span>
        <button className="toast-close" onClick={() => remove(t.id)} aria-label="Dismiss">
          ×
        </button>
      </div>
    );
  }

  const value = {
    success: function (message) {
      show(message, "success");
    },
    error: function (message) {
      show(message, "error");
    },
  };

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="toast-stack">{items}</div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  return useContext(ToastContext);
}
