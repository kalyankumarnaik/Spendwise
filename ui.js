// SpendWise — UI Dialogs (Toast & Modal) and Currency Utilities

(function () {
  "use strict";

  // ==========================================
  // CURRENCY & MATH UTILITIES (Integer Paise Math)
  // ==========================================
  window.toPaise = function (amount) {
    const num = Number(amount);
    return Number.isFinite(num) ? Math.round(num * 100) : 0;
  };

  window.fromPaise = function (paise) {
    return Math.round(Number(paise || 0)) / 100;
  };

  window.sumCurrency = function (items, extractor) {
    if (!Array.isArray(items)) return 0;
    const totalPaise = items.reduce((sum, item) => {
      const val = extractor ? extractor(item) : item;
      return sum + window.toPaise(val);
    }, 0);
    return window.fromPaise(totalPaise);
  };

  // ==========================================
  // TOAST NOTIFICATIONS
  // ==========================================
  let toastContainer = null;

  function ensureToastContainer() {
    if (!toastContainer || !document.body.contains(toastContainer)) {
      toastContainer = document.createElement("div");
      toastContainer.className = "toast-container";
      toastContainer.setAttribute("aria-live", "polite");
      document.body.appendChild(toastContainer);
    }
    return toastContainer;
  }

  window.showToast = function (message, type = "info") {
    const container = ensureToastContainer();

    const toast = document.createElement("div");
    toast.className = `toast toast-${type}`;
    toast.setAttribute("role", "status");

    const icon = type === "success" ? "✓" : type === "error" ? "✕" : "ℹ";

    toast.innerHTML = `
      <span class="toast-icon">${icon}</span>
      <span class="toast-message">${String(message)}</span>
    `;

    container.appendChild(toast);

    // Animation trigger
    requestAnimationFrame(() => {
      toast.classList.add("toast-show");
    });

    const removeToast = () => {
      toast.classList.remove("toast-show");
      toast.classList.add("toast-hide");
      setTimeout(() => {
        if (toast.parentNode) {
          toast.parentNode.removeChild(toast);
        }
      }, 300);
    };

    setTimeout(removeToast, 3200);
    toast.addEventListener("click", removeToast);
  };

  // ==========================================
  // CONFIRM MODAL (Promise-based)
  // ==========================================
  let activeModal = null;

  window.showConfirm = function (options = {}) {
    return new Promise((resolve) => {
      const {
        title = "Confirm Action",
        message = "Are you sure you want to proceed?",
        confirmText = "Confirm",
        cancelText = "Cancel",
        isDanger = true
      } = typeof options === "string" ? { message: options } : options;

      // Clean up any existing modal
      if (activeModal && document.body.contains(activeModal)) {
        document.body.removeChild(activeModal);
      }

      const backdrop = document.createElement("div");
      backdrop.className = "confirm-modal-backdrop";
      backdrop.setAttribute("role", "dialog");
      backdrop.setAttribute("aria-modal", "true");
      backdrop.setAttribute("aria-labelledby", "confirmModalTitle");

      const dialog = document.createElement("div");
      dialog.className = "confirm-modal-dialog";

      dialog.innerHTML = `
        <div class="confirm-modal-header">
          <h3 id="confirmModalTitle">${String(title)}</h3>
        </div>
        <div class="confirm-modal-body">
          <p>${String(message)}</p>
        </div>
        <div class="confirm-modal-actions">
          <button type="button" class="secondary-button" id="confirmCancelBtn">${String(cancelText)}</button>
          <button type="button" class="${isDanger ? 'danger-button' : 'page-button'}" id="confirmOkBtn">${String(confirmText)}</button>
        </div>
      `;

      backdrop.appendChild(dialog);
      document.body.appendChild(backdrop);
      activeModal = backdrop;

      // Lock scroll
      const prevOverflow = document.body.style.overflow;
      document.body.style.overflow = "hidden";

      requestAnimationFrame(() => {
        backdrop.classList.add("modal-visible");
      });

      const cleanup = (result) => {
        backdrop.classList.remove("modal-visible");
        document.body.style.overflow = prevOverflow;
        setTimeout(() => {
          if (backdrop.parentNode) {
            backdrop.parentNode.removeChild(backdrop);
          }
          if (activeModal === backdrop) {
            activeModal = null;
          }
        }, 200);
        resolve(result);
      };

      dialog.querySelector("#confirmOkBtn").addEventListener("click", () => cleanup(true));
      dialog.querySelector("#confirmCancelBtn").addEventListener("click", () => cleanup(false));
      backdrop.addEventListener("click", (e) => {
        if (e.target === backdrop) cleanup(false);
      });

      const handleKeydown = (e) => {
        if (e.key === "Escape") {
          document.removeEventListener("keydown", handleKeydown);
          cleanup(false);
        }
      };
      document.addEventListener("keydown", handleKeydown);

      // Focus the cancel button by default to avoid accidental deletion
      dialog.querySelector("#confirmCancelBtn").focus();
    });
  };

})();
