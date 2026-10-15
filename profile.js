import { initializeApp, getApps, getApp } from
  "https://www.gstatic.com/firebasejs/12.4.0/firebase-app.js";

import {
  getAuth,
  onAuthStateChanged,
  signOut,
  updateProfile
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

// DOM Elements
const profileName = document.getElementById("profileName");
const profileEmail = document.getElementById("profileEmail");
const profileMessage = document.getElementById("profileMessage");

const editDisplayName = document.getElementById("editDisplayName");
const editPhotoURL = document.getElementById("editPhotoURL");
const profileForm = document.getElementById("profileForm");
const saveProfileBtn = document.getElementById("saveProfileBtn");

const avatarPreviewContainer = document.getElementById("avatarPreviewContainer");
const avatarImage = document.getElementById("avatarImage");
const avatarPlaceholder = document.getElementById("avatarPlaceholder");
const choosePhotoBtn = document.getElementById("choosePhotoBtn");
const removePhotoBtn = document.getElementById("removePhotoBtn");
const avatarFileInput = document.getElementById("avatarFileInput");
const avatarPresets = document.getElementById("avatarPresets");

let currentAvatar = "";

function notify(msg, type = "info") {
  if (window.showToast) {
    window.showToast(msg, type);
  } else {
    alert(msg);
  }
}

// Update Active Preset Highlight
function updatePresetSelection(val) {
  if (!avatarPresets) return;
  const isEmoji = val && !val.startsWith("data:") && !val.startsWith("http://") && !val.startsWith("https://");
  avatarPresets.querySelectorAll(".preset-btn").forEach((btn) => {
    if (isEmoji && btn.getAttribute("data-avatar") === val) {
      btn.classList.add("active");
    } else {
      btn.classList.remove("active");
    }
  });
}

// Render Avatar (handles image URL, base64 data URL, or emoji string)
function renderAvatar(val) {
  if (!val) {
    if (avatarImage) {
      avatarImage.src = "";
      avatarImage.style.display = "none";
    }
    if (avatarPlaceholder) {
      avatarPlaceholder.textContent = "👤";
      avatarPlaceholder.style.display = "flex";
    }
    if (removePhotoBtn) removePhotoBtn.style.display = "none";
  } else {
    const isImg = val.startsWith("data:image") || val.startsWith("http://") || val.startsWith("https://");

    if (isImg) {
      if (avatarImage) {
        avatarImage.src = val;
        avatarImage.style.display = "block";
      }
      if (avatarPlaceholder) {
        avatarPlaceholder.style.display = "none";
      }
    } else {
      // Emoji character
      if (avatarImage) {
        avatarImage.src = "";
        avatarImage.style.display = "none";
      }
      if (avatarPlaceholder) {
        avatarPlaceholder.textContent = val;
        avatarPlaceholder.style.display = "flex";
      }
    }

    if (removePhotoBtn) removePhotoBtn.style.display = "inline-flex";
  }

  // Update topbar avatar immediately on the current page
  const topAvatars = document.querySelectorAll(".top-profile .avatar");
  topAvatars.forEach((topAvatar) => {
    if (!val) {
      topAvatar.textContent = "👤";
    } else if (val.startsWith("data:image") || val.startsWith("http://") || val.startsWith("https://")) {
      topAvatar.innerHTML = `<img src="${val}" alt="Profile Photo" style="width:100%;height:100%;border-radius:50%;object-fit:cover;display:block;">`;
    } else {
      topAvatar.textContent = val;
    }
  });
}

// Compress uploaded photo to a lightweight canvas thumbnail (< 25KB)
function compressImage(srcDataUrl, maxSize, callback) {
  const img = new Image();
  img.onload = () => {
    try {
      const canvas = document.createElement("canvas");
      let w = img.width;
      let h = img.height;
      if (w > h) {
        if (w > maxSize) {
          h = Math.round((h * maxSize) / w);
          w = maxSize;
        }
      } else {
        if (h > maxSize) {
          w = Math.round((w * maxSize) / h);
          h = maxSize;
        }
      }
      canvas.width = Math.max(1, w);
      canvas.height = Math.max(1, h);
      const ctx = canvas.getContext("2d");
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      callback(canvas.toDataURL("image/jpeg", 0.85));
    } catch (e) {
      console.warn("Image compression fallback:", e);
      callback(srcDataUrl);
    }
  };
  img.onerror = () => callback(srcDataUrl);
  img.src = srcDataUrl;
}

// Immediately persist avatar to localStorage, sync topbar, and notify
function saveAvatar(avatarVal, successMsg = "Profile picture updated!") {
  currentAvatar = avatarVal;
  const user = auth.currentUser;
  const uid = user ? user.uid : "local";

  if (avatarVal) {
    try {
      localStorage.setItem(`spendwise_avatar_${uid}`, avatarVal);
      localStorage.setItem("spendwise_user_photo", avatarVal);
      localStorage.setItem("spendwise_global_avatar", avatarVal);
    } catch (err) {
      console.error("Storage write error:", err);
      notify("Storage quota exceeded. Please choose a smaller photo.", "error");
      return;
    }
  } else {
    localStorage.removeItem(`spendwise_avatar_${uid}`);
    localStorage.removeItem("spendwise_user_photo");
    localStorage.removeItem("spendwise_global_avatar");
  }

  renderAvatar(currentAvatar);
  updatePresetSelection(currentAvatar);

  if (window.syncTopbarProfile) {
    window.syncTopbarProfile();
  }

  // If user is logged into Firebase and uses an HTTP/HTTPS URL, sync photoURL
  if (user) {
    if (avatarVal.startsWith("http://") || avatarVal.startsWith("https://")) {
      updateProfile(user, { photoURL: avatarVal }).catch((err) =>
        console.warn("Firebase photo URL sync note:", err)
      );
    } else if (!avatarVal) {
      updateProfile(user, { photoURL: "" }).catch((err) =>
        console.warn("Firebase photo URL clear note:", err)
      );
    }
  }

  if (successMsg) {
    notify(successMsg, "success");
  }
}

// Listen for Auth State
onAuthStateChanged(auth, (user) => {
  if (!user) {
    window.location.replace("login.html");
    return;
  }

  const userKey = `spendwise_avatar_${user.uid}`;
  const name = user.displayName || localStorage.getItem("spendwise_user_name") || "";
  const photo = localStorage.getItem(userKey) ||
                localStorage.getItem("spendwise_user_photo") ||
                localStorage.getItem("spendwise_global_avatar") ||
                user.photoURL || "";

  if (profileName) profileName.textContent = name || "Not provided";
  if (profileEmail) profileEmail.textContent = user.email || "Not available";
  if (editDisplayName) editDisplayName.value = name;

  if (photo && (photo.startsWith("http://") || photo.startsWith("https://"))) {
    if (editPhotoURL) editPhotoURL.value = photo;
  }

  currentAvatar = photo;
  renderAvatar(currentAvatar);
  updatePresetSelection(currentAvatar);

  if (photo) {
    localStorage.setItem(userKey, photo);
    localStorage.setItem("spendwise_user_photo", photo);
    localStorage.setItem("spendwise_global_avatar", photo);
  }
  if (name) localStorage.setItem("spendwise_user_name", name);
  if (window.syncTopbarProfile) window.syncTopbarProfile();
});

function processImageFile(file) {
  if (!file) return;

  const isImageMime = file.type && file.type.startsWith("image/");
  const isImageExt = /\.(jpe?g|png|webp|gif|svg|bmp|ico|jfif)$/i.test(file.name || "");
  if (!isImageMime && !isImageExt) {
    notify("Please choose an image file (JPG, PNG, WebP).", "error");
    if (avatarFileInput) avatarFileInput.value = "";
    return;
  }

  if (file.size > 15 * 1024 * 1024) {
    notify("Image is too large. Please select a photo under 15MB.", "error");
    if (avatarFileInput) avatarFileInput.value = "";
    return;
  }

  if (choosePhotoBtn) {
    choosePhotoBtn.textContent = "Uploading...";
  }

  const reader = new FileReader();
  reader.onload = (event) => {
    compressImage(event.target.result, 240, (compressedDataUrl) => {
      if (choosePhotoBtn) {
        choosePhotoBtn.textContent = "📷 Choose Photo";
      }
      if (editPhotoURL) editPhotoURL.value = "";
      if (avatarFileInput) avatarFileInput.value = "";

      saveAvatar(compressedDataUrl, "Profile picture updated successfully!");
    });
  };
  reader.onerror = (err) => {
    console.error("FileReader error:", err);
    if (choosePhotoBtn) {
      choosePhotoBtn.textContent = "📷 Choose Photo";
    }
    if (avatarFileInput) avatarFileInput.value = "";
    notify("Failed to read image file. Please try another.", "error");
  };
  reader.readAsDataURL(file);
}

// Drag-and-drop and keyboard support for avatar circle
if (avatarPreviewContainer) {
  avatarPreviewContainer.addEventListener("keydown", (e) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      if (avatarFileInput) avatarFileInput.click();
    }
  });

  avatarPreviewContainer.addEventListener("dragover", (e) => {
    e.preventDefault();
    avatarPreviewContainer.style.borderColor = "#167a55";
    avatarPreviewContainer.style.transform = "scale(1.08)";
  });
  avatarPreviewContainer.addEventListener("dragleave", () => {
    avatarPreviewContainer.style.borderColor = "";
    avatarPreviewContainer.style.transform = "";
  });
  avatarPreviewContainer.addEventListener("drop", (e) => {
    e.preventDefault();
    avatarPreviewContainer.style.borderColor = "";
    avatarPreviewContainer.style.transform = "";
    const droppedFile = e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files[0];
    if (droppedFile) {
      processImageFile(droppedFile);
    }
  });
}

// Keyboard support for Choose Photo label button
if (choosePhotoBtn) {
  choosePhotoBtn.addEventListener("keydown", (e) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      if (avatarFileInput) avatarFileInput.click();
    }
  });
}

// Handle file input selection with instant auto-save and topbar sync
if (avatarFileInput) {
  avatarFileInput.addEventListener("change", (e) => {
    const file = e.target.files && e.target.files[0];
    if (file) {
      processImageFile(file);
    }
  });
}

// Avatar Presets Click Handler: Instant save & topbar sync
if (avatarPresets) {
  avatarPresets.querySelectorAll(".preset-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      const emoji = btn.getAttribute("data-avatar");
      if (!emoji) return;

      if (editPhotoURL) editPhotoURL.value = "";
      if (avatarFileInput) avatarFileInput.value = "";

      saveAvatar(emoji, `Avatar set to ${emoji}!`);
    });
  });
}

// Remove Photo Handler: Instant reset & topbar sync
if (removePhotoBtn) {
  removePhotoBtn.addEventListener("click", () => {
    if (editPhotoURL) editPhotoURL.value = "";
    if (avatarFileInput) avatarFileInput.value = "";
    saveAvatar("", "Profile picture removed.");
  });
}

// Direct Web URL Input Handler
if (editPhotoURL) {
  editPhotoURL.addEventListener("input", () => {
    const url = editPhotoURL.value.trim();
    if (url && (url.startsWith("http://") || url.startsWith("https://"))) {
      currentAvatar = url;
      renderAvatar(currentAvatar);
      updatePresetSelection(currentAvatar);
    }
  });
}

// Form Submission: Save Profile Changes (Display Name & optional Web URL)
if (profileForm) {
  profileForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    let newDisplayName = editDisplayName.value.trim();
    if (!newDisplayName) {
      const emailFallback = (auth.currentUser && auth.currentUser.email) ? auth.currentUser.email.split("@")[0] : "";
      newDisplayName = (profileName && profileName.textContent !== "Not provided") ? profileName.textContent : (emailFallback || "User");
      editDisplayName.value = newDisplayName;
    }

    if (saveProfileBtn) {
      saveProfileBtn.disabled = true;
      saveProfileBtn.textContent = "Saving...";
    }

    const urlInput = editPhotoURL ? editPhotoURL.value.trim() : "";
    if (urlInput && (urlInput.startsWith("http://") || urlInput.startsWith("https://"))) {
      currentAvatar = urlInput;
    }

    const user = auth.currentUser;
    const uid = user ? user.uid : "local";

    // 1. ALWAYS persist immediately to localStorage so data is NEVER lost!
    localStorage.setItem(`spendwise_avatar_${uid}`, currentAvatar);
    localStorage.setItem("spendwise_user_photo", currentAvatar);
    localStorage.setItem("spendwise_global_avatar", currentAvatar);
    localStorage.setItem("spendwise_user_name", newDisplayName);

    // Update UI text immediately
    if (profileName) profileName.textContent = newDisplayName;
    const topNames = document.querySelectorAll(".top-profile span:last-child");
    topNames.forEach((nameEl) => {
      nameEl.textContent = newDisplayName;
    });

    renderAvatar(currentAvatar);
    updatePresetSelection(currentAvatar);
    if (window.syncTopbarProfile) window.syncTopbarProfile();

    // 2. Sync to Firebase Authentication
    try {
      if (user) {
        const payload = { displayName: newDisplayName };
        // Firebase updateProfile only accepts HTTP/HTTPS URLs (max 2048 chars).
        // Only send photoURL if it's an actual web URL; otherwise send empty or omit.
        if (currentAvatar.startsWith("http://") || currentAvatar.startsWith("https://")) {
          payload.photoURL = currentAvatar;
        } else if (!currentAvatar) {
          payload.photoURL = "";
        }

        await updateProfile(user, payload);
      }

      notify("Profile updated successfully!", "success");
      if (profileMessage) {
        profileMessage.textContent = "Profile updated successfully!";
        profileMessage.style.color = "var(--primary)";
      }
    } catch (err) {
      console.warn("Firebase sync note:", err);
      // Local profile is already saved and active!
      notify("Profile updated successfully!", "success");
      if (profileMessage) {
        profileMessage.textContent = "Profile updated successfully!";
        profileMessage.style.color = "var(--primary)";
      }
    } finally {
      if (saveProfileBtn) {
        saveProfileBtn.disabled = false;
        saveProfileBtn.textContent = "Save Profile Changes";
      }
    }
  });
}

// Navigation & Logout
const backButton = document.getElementById("backButton");
if (backButton) {
  backButton.addEventListener("click", () => {
    window.location.href = "index.html";
  });
}

async function handleLogout() {
  try {
    // Clear active session identifiers, but KEEP spendwise_avatar_${uid}
    // so the user's avatar persists when they log back in!
    localStorage.removeItem("spendwise_user_name");
    localStorage.removeItem("spendwise_user_photo");
    await signOut(auth);
    window.location.replace("login.html");
  } catch (error) {
    console.error("Logout error:", error);
    if (profileMessage) {
      profileMessage.textContent = "Unable to log out. Please try again.";
      profileMessage.style.color = "var(--danger)";
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
