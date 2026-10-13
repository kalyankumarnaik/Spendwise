import { initializeApp, getApps, getApp } from
  "https://www.gstatic.com/firebasejs/12.4.0/firebase-app.js";

import {
  getAuth,
  onAuthStateChanged,
  signOut
} from
  "https://www.gstatic.com/firebasejs/12.4.0/firebase-auth.js";

const firebaseConfig = {
  apiKey: "AIzaSyCWTUOhloVBMpYz-tsXogB18JaEwH9vPls",
  authDomain: "spendwise-tracker-66cf5.firebaseapp.com",
  projectId: "spendwise-tracker-66cf5",
  storageBucket: "spendwise-tracker-66cf5.firebasestorage.app",
  messagingSenderId: "491268384533",
  appId: "1:491268384533:web:effcbffde7f8fc975fab1c",
  measurementId: "G-9FF0HMLT2S"
};

const app = getApps().length ? getApp() : initializeApp(firebaseConfig);
const auth = getAuth(app);

const profileName = document.getElementById("profileName");
const profileEmail = document.getElementById("profileEmail");
const profileMessage = document.getElementById("profileMessage");

onAuthStateChanged(auth, (user) => {
  if (!user) {
    window.location.replace("login.html");
    return;
  }

  profileName.textContent = user.displayName || "Not provided";
  profileEmail.textContent = user.email || "Not available";
});

const backButton = document.getElementById("backButton");
if (backButton) {
  backButton.addEventListener("click", () => {
    window.location.href = "index.html";
  });
}

async function handleLogout() {
  try {
    await signOut(auth);
    window.location.replace("login.html");
  } catch (error) {
    console.error(error);
    if (profileMessage) {
      profileMessage.textContent = "Unable to log out. Please try again.";
    }
  }
}

const logoutBtn = document.getElementById("logoutButton");
if (logoutBtn) {
  logoutBtn.addEventListener("click", handleLogout);
}

const sidebarLogoutBtn = document.getElementById("sidebarLogoutButton");
if (sidebarLogoutBtn) {
  sidebarLogoutBtn.addEventListener("click", handleLogout);
}
