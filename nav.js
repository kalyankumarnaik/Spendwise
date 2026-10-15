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

// Sync profile photo and name in topbar across all pages (globally available)
function syncTopbarProfile() {
  let photo = localStorage.getItem("spendwise_user_photo") ||
              localStorage.getItem("spendwise_global_avatar");
  const name = localStorage.getItem("spendwise_user_name");

  // Fallback: if spendwise_user_photo is missing, search for any user avatar key
  if (!photo) {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith("spendwise_avatar_")) {
        const val = localStorage.getItem(key);
        if (val) {
          photo = val;
          localStorage.setItem("spendwise_user_photo", photo);
          localStorage.setItem("spendwise_global_avatar", photo);
          break;
        }
      }
    }
  }

  // 1. Update Topbar Profile Avatars
  const avatarEls = document.querySelectorAll(".top-profile .avatar");
  avatarEls.forEach((avatarEl) => {
    if (photo) {
      if (photo.startsWith("data:image") || photo.startsWith("http://") || photo.startsWith("https://")) {
        avatarEl.innerHTML = `<img src="${photo}" alt="Profile Photo" style="width:100%;height:100%;border-radius:50%;object-fit:cover;display:block;">`;
      } else {
        avatarEl.textContent = photo;
      }
    } else {
      avatarEl.textContent = "👤";
    }
  });

  // 2. Update Sidebar Profile Navigation Icons
  const sidebarAvatars = document.querySelectorAll(".sidebar-bottom a[href*='profile.html'] span:first-child");
  sidebarAvatars.forEach((el) => {
    if (photo) {
      if (photo.startsWith("data:image") || photo.startsWith("http://") || photo.startsWith("https://")) {
        el.innerHTML = `<img src="${photo}" alt="" style="width:20px;height:20px;border-radius:50%;object-fit:cover;display:inline-block;vertical-align:middle;">`;
      } else {
        el.textContent = photo;
      }
    } else {
      el.textContent = "👤";
    }
  });

  // 3. Update Topbar Name
  const nameEls = document.querySelectorAll(".top-profile span:last-child");
  if (name) {
    nameEls.forEach((nameEl) => {
      nameEl.textContent = name;
    });
  }

  // 4. Update Dashboard Greeting if present
  const greetingEl = document.getElementById("welcomeGreeting");
  if (greetingEl && name) {
    const formatted = name.trim().charAt(0).toUpperCase() + name.trim().slice(1);
    greetingEl.textContent = `Hello, ${formatted}! Welcome to SpendWise.`;
  }
}

window.syncTopbarProfile = syncTopbarProfile;

// Initial execution and event listeners
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", syncTopbarProfile);
} else {
  syncTopbarProfile();
}
window.addEventListener("pageshow", syncTopbarProfile);
window.addEventListener("storage", syncTopbarProfile);

// PWA: Service Worker Registration
if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker
      .register("./sw.js")
      .then((reg) => {
        console.log("SpendWise Service Worker registered successfully.", reg.scope);
      })
      .catch((err) => {
        console.warn("SpendWise Service Worker registration failed:", err);
      });
  });
}
