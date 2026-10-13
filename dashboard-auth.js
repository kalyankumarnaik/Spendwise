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

onAuthStateChanged(auth, (user) => {
  if (!user) {
    window.location.replace("login.html");
    return;
  }

  const logoutButton = document.getElementById("logoutButton");
  if (logoutButton) {
    logoutButton.addEventListener("click", async () => {
      try {
        await signOut(auth);
        window.location.replace("login.html");
      } catch (error) {
        console.error("Logout failed:", error);
        alert("Unable to log out. Please try again.");
      }
    });
  }

  if (!pageLoaded) {
    pageLoaded = true;
    // Load expense-tracking JavaScript only after authentication.
    const script = document.createElement("script");
    script.src = "dashboard.js";
    document.body.appendChild(script);
  }
});
