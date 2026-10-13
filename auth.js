
import { initializeApp } from
  "https://www.gstatic.com/firebasejs/12.4.0/firebase-app.js";

import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  sendPasswordResetEmail,
  updateProfile,
  onAuthStateChanged
} from
  "https://www.gstatic.com/firebasejs/12.4.0/firebase-auth.js";

// 1. Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyCWTUOhloVBMpYz-tsXogB18JaEwH9vPls",
  authDomain: "spendwise-tracker-66cf5.firebaseapp.com",
  projectId: "spendwise-tracker-66cf5",
  storageBucket: "spendwise-tracker-66cf5.firebasestorage.app",
  messagingSenderId: "491268384533",
  appId: "1:491268384533:web:effcbffde7f8fc975fab1c",
  measurementId: "G-9FF0HMLT2S"
};

// 2. Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

// 3. Login page elements
const authForm = document.getElementById("authForm");
const loginTab = document.getElementById("loginTab");
const registerTab = document.getElementById("registerTab");
const nameGroup = document.getElementById("nameGroup");
const displayNameInput = document.getElementById("displayName");
const emailInput = document.getElementById("email");
const passwordInput = document.getElementById("password");
const formTitle = document.getElementById("formTitle");
const formDescription = document.getElementById("formDescription");
const submitButton = document.getElementById("submitButton");
const forgotPasswordButton =
  document.getElementById("forgotPassword");
const authMessage = document.getElementById("authMessage");

let isRegistering = false;

function showMessage(message, isError = false) {
  authMessage.textContent = message;
  authMessage.style.color = isError ? "#c62828" : "#176b4b";
}

function setLoading(loading) {
  submitButton.disabled = loading;
  loginTab.disabled = loading;
  registerTab.disabled = loading;
  forgotPasswordButton.disabled = loading;

  submitButton.textContent = loading
    ? "Please wait..."
    : isRegistering
      ? "Create Account"
      : "Login";
}

// 4. Switch between login and registration
function setMode(registerMode) {
  isRegistering = registerMode;

  nameGroup.hidden = !registerMode;
  displayNameInput.required = registerMode;

  loginTab.classList.toggle("active", !registerMode);
  registerTab.classList.toggle("active", registerMode);

  formTitle.textContent = registerMode
    ? "Create your account"
    : "Welcome back!";

  formDescription.textContent = registerMode
    ? "Register to start managing your money."
    : "Log in to access your dashboard.";

  submitButton.textContent = registerMode
    ? "Create Account"
    : "Login";

  passwordInput.autocomplete = registerMode
    ? "new-password"
    : "current-password";

  forgotPasswordButton.hidden = registerMode;
  showMessage("");
}

loginTab.addEventListener("click", () => setMode(false));
registerTab.addEventListener("click", () => setMode(true));

// 5. Redirect users who are already signed in
onAuthStateChanged(auth, (user) => {
  if (user) {
    window.location.replace("index.html");
  }
});

// 6. Register or log in
authForm.addEventListener("submit", async (event) => {
  event.preventDefault();

  const email = emailInput.value.trim();
  const password = passwordInput.value;
  const displayName = displayNameInput.value.trim();

  if (isRegistering && !displayName) {
    showMessage("Please enter your name.", true);
    return;
  }

  setLoading(true);
  showMessage("");

  try {
    if (isRegistering) {
      const credential = await createUserWithEmailAndPassword(
        auth,
        email,
        password
      );

      await updateProfile(credential.user, {
        displayName: displayName
      });

      showMessage("Account created successfully. Opening SpendWise...");

      window.location.replace("index.html");
    } else {
      await signInWithEmailAndPassword(
        auth,
        email,
        password
      );

      window.location.replace("index.html");
    }
  } catch (error) {
    console.error("Authentication error:", error);

    const messages = {
      "auth/email-already-in-use":
        "This email is already registered. Try logging in.",
      "auth/invalid-email":
        "Please enter a valid email address.",
      "auth/weak-password":
        "Choose a stronger password with at least 6 characters.",
      "auth/invalid-credential":
        "Incorrect email or password.",
      "auth/user-not-found":
        "No account found. Please register first.",
      "auth/too-many-requests":
        "Too many attempts. Please wait and try again.",
      "auth/network-request-failed":
        "Network error. Check your internet connection."
    };

    showMessage(
      messages[error.code] ||
      "Unable to complete the request. Please try again.",
      true
    );
  } finally {
    setLoading(false);
  }
});

// 7. Forgot password
forgotPasswordButton.addEventListener("click", async () => {
  const email = emailInput.value.trim();

  if (!email) {
    showMessage("Enter your email address first.", true);
    emailInput.focus();
    return;
  }

  forgotPasswordButton.disabled = true;

  try {
    await sendPasswordResetEmail(auth, email);

    showMessage(
      "If an account exists for this email, a password reset email will be sent."
    );
  } catch (error) {
    console.error("Password reset error:", error);

    if (
      error.code === "auth/invalid-email" ||
      error.code === "auth/missing-email"
    ) {
      showMessage("Please enter a valid email address.", true);
    } else {
      showMessage(
        "Could not send the reset email. Check your settings and try again.",
        true
      );
    }
  } finally {
    forgotPasswordButton.disabled = false;
  }
});

// Start in login mode
setMode(false);
