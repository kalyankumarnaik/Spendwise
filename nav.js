// SpendWise - Navigation & Responsive Sidebar Controller

document.addEventListener("DOMContentLoaded", () => {
  const sidebar = document.querySelector(".sidebar");
  const toggle = document.getElementById("sidebarToggle");

  if (!sidebar || !toggle) return;

  // Ensure a single overlay element exists
  let overlay = document.querySelector(".sidebar-overlay");
  if (!overlay) {
    overlay = document.createElement("div");
    overlay.className = "sidebar-overlay";
    overlay.setAttribute("aria-hidden", "true");
    document.body.appendChild(overlay);
  }

  function setSidebar(open) {
    sidebar.classList.toggle("open", open);
    overlay.classList.toggle("visible", open);
    toggle.textContent = open ? "✕" : "☰";
    toggle.setAttribute("aria-expanded", String(open));
    toggle.setAttribute(
      "aria-label",
      open ? "Close navigation" : "Open navigation"
    );

    if (open && window.innerWidth <= 850) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
  }

  toggle.addEventListener("click", () => {
    setSidebar(!sidebar.classList.contains("open"));
  });

  overlay.addEventListener("click", () => {
    setSidebar(false);
  });

  sidebar.querySelectorAll(".nav-link").forEach((link) => {
    link.addEventListener("click", () => {
      if (window.innerWidth <= 850) {
        setSidebar(false);
      }
    });
  });

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && sidebar.classList.contains("open")) {
      setSidebar(false);
    }
  });

  window.addEventListener("resize", () => {
    if (window.innerWidth > 850) {
      setSidebar(false);
      document.body.style.overflow = "";
    }
  });
});
