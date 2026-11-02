import { useEffect } from "react";
import Icon from "./Icon.jsx";

export default function Modal({ title, onClose, children, wide }) {
  // close on Escape
  useEffect(
    function () {
      function onKey(event) {
        if (event.key === "Escape") onClose();
      }
      window.addEventListener("keydown", onKey);
      return function () {
        window.removeEventListener("keydown", onKey);
      };
    },
    [onClose]
  );

  return (
    <div className="modal-backdrop" onMouseDown={onClose}>
      <div
        className={"modal" + (wide ? " modal-wide" : "")}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div className="modal-head">
          <h2>{title}</h2>
          <button className="icon-btn" onClick={onClose} aria-label="Close">
            <Icon name="x" />
          </button>
        </div>
        <div className="modal-body">{children}</div>
      </div>
    </div>
  );
}
