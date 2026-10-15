import { initializeApp } from "https://www.gstatic.com/firebasejs/12.4.0/firebase-app.js";
import {
  getAuth,
  onAuthStateChanged,
  signOut
} from "https://www.gstatic.com/firebasejs/12.4.0/firebase-auth.js";

const firebaseConfig = {
  apiKey: "AIzaSyCWTUOhloVBMpYz-tsXogB18JaEwH9vPls",
  authDomain: "spendwise-tracker-66cf5.firebaseapp.com",
  projectId: "spendwise-tracker-66cf5",
  storageBucket: "spendwise-tracker-66cf5.firebasestorage.app",
  messagingSenderId: "491268384533",
  appId: "1:491268384533:web:effcbffde7f8fc975fab1c",
  measurementId: "G-9FF0HMLT2S"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

let pageLoaded = false;

function resolveUserName(user) {
  let name = localStorage.getItem("spendwise_user_name") || "";
  if (!name && user) {
    name = user.displayName || "";
  }
  if (!name && user && user.email) {
    const prefix = user.email.split("@")[0].replace(/[0-9._-]+/g, " ").trim();
    if (prefix) {
      name = prefix.split(" ").map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");
    } else {
      name = user.email.split("@")[0];
    }
  }
  return name.trim();
}

onAuthStateChanged(auth, (user) => {
  if (!user) {
    window.location.replace("login.html");
    return;
  }

  // Restore user's avatar across sessions with universal fallback
  const userKey = `spendwise_avatar_${user.uid}`;
  const photo = localStorage.getItem(userKey) ||
                localStorage.getItem("spendwise_user_photo") ||
                localStorage.getItem("spendwise_global_avatar") ||
                user.photoURL || "";

  if (photo) {
    localStorage.setItem(userKey, photo);
    localStorage.setItem("spendwise_user_photo", photo);
    localStorage.setItem("spendwise_global_avatar", photo);
  }

  // Restore user name
  const name = resolveUserName(user);
  if (name) {
    localStorage.setItem("spendwise_user_name", name);
  }

  if (window.syncTopbarProfile) {
    window.syncTopbarProfile();
  }

  // Bind all logout triggers
  const logoutButtons = document.querySelectorAll("#logoutButton, #sidebarLogoutButton, .sidebar-logout");
  logoutButtons.forEach((btn) => {
    btn.onclick = async () => {
      try {
        localStorage.removeItem("spendwise_user_name");
        localStorage.removeItem("spendwise_user_photo");
        await signOut(auth);
        window.location.replace("login.html");
      } catch (error) {
        console.error("Logout failed:", error);
        if (window.showToast) {
          window.showToast("Unable to log out. Please try again.", "error");
        } else {
          alert("Unable to log out. Please try again.");
        }
      }
    };
  });

  if (!pageLoaded) {
    pageLoaded = true;
    const script = document.createElement("script");
    script.src = "expenses.js";
    script.onerror = () => {
      pageLoaded = false;
      if (window.showToast) {
        window.showToast("Unable to load expenses.js.", "error");
      } else {
        alert("Unable to load expenses.js.");
      }
    };
    document.body.appendChild(script);
  }
});
