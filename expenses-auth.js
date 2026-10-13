
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

onAuthStateChanged(auth, (user) => {
  if (!user) {
    window.location.replace("login.html");
    return;
  }

  document.getElementById("logoutButton").addEventListener("click", async () => {
    try {
      await signOut(auth);
      window.location.replace("login.html");
    } catch (error) {
      console.error(error);
      alert("Unable to log out. Please try again.");
    }
  });

  const script = document.createElement("script");
  script.src = "expenses.js";
  script.onerror = () => alert("Unable to load the Expenses page JavaScript.");
  document.body.appendChild(script);
});
