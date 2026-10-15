# SpendWise — Smart Expense Tracker 💰

SpendWise is a responsive, feature-packed Progressive Web Application (PWA) designed for seamless personal finance management, monthly budget tracking, recurring bills monitoring, and savings goal planning.

---

## ✨ Key Features

1. **📊 Financial Overview & Dashboard**:
   - Dynamic user greeting: `Hello, <Name>! Welcome to SpendWise.`
   - Real-time calculations: Total expenses, transaction counts, and average spend using integer-paise arithmetic (prevents floating-point rounding errors).
   - Monthly budget usage bar with remaining balance notifications.
   - Upcoming bills status and savings targets summary.
   - Interactive HTML5 canvas spending analytics chart with categorized color-coding and rounded bars.
   - Quick-access table displaying recent transactions.

2. **💳 Expense Tracking & CSV Export**:
   - Add, edit, and delete transactions with instant DOM updates.
   - Filter by search keyword, expense category, and custom date range.
   - One-click UTF-8 BOM CSV export for Excel, Google Sheets, or Numbers.

3. **🎯 Monthly Budget**:
   - Set spending limits with progress indicators and real-time status alerts.
   - Cross-page and multi-tab synchronization (`storage` and `pageshow` listeners).

4. **📅 Bills & Payments**:
   - Track pending and paid bills with due date monitoring.
   - One-click "Mark Paid" status toggle.
   - Custom accessible confirmation modal before deletion.

5. **🏦 Savings & Investments**:
   - Create milestone goals with target amounts and dates.
   - Incrementally deposit savings with animated progress bars.

6. **👤 Profile & Avatar System**:
   - Native OS file picker to upload custom photos (JPG, PNG, WebP) with client-side canvas compression (< 25 KB).
   - Emoji avatar presets (👨‍💼, 👩‍💼, 🧑‍💻, 🚀, 🦁, 💎, 🦊, 🎯).
   - Real-time circular avatar rendering in the topbar (`.top-profile .avatar`) and sidebar across all pages.
   - Dual-storage resilience (`localStorage` + Firebase Authentication).

7. **📱 Progressive Web App (PWA)**:
   - Installable on mobile devices (iOS / Android) and desktop (Chrome / Edge).
   - Cache-first Service Worker (`sw.js` - `spendwise-v3`) with full offline functionality.
   - Standalone manifest with custom scalable SVG icon (`icon.svg`).

---

## 🚀 How to Run Locally

### Option 1: Built-in Zero-Dependency Node Server
SpendWise includes a native, zero-dependency Node.js static server:
```bash
npm start
# or
node server.js
```
Open **`http://localhost:3000`** in your browser.

### Option 2: Any Static Web Server
SpendWise is 100% client-side compatible and runs on any web server:
- Python: `python -m http.server 3000`
- VS Code: Open with the "Live Server" extension
- PHP: `php -S localhost:3000`

---

## 🌐 How to Publish / Deploy

SpendWise is pre-configured with deployment configs for all major hosting providers:

### 1. Firebase Hosting (Recommended)
SpendWise is already configured for the Firebase project `spendwise-tracker-66cf5`.
```bash
# 1. Install Firebase CLI (if not already installed)
npm install -g firebase-tools

# 2. Log in
firebase login

# 3. Deploy
firebase deploy
```
Your app will be live at `https://spendwise-tracker-66cf5.web.app`!

### 2. Vercel
Configuration file: [`vercel.json`](./vercel.json)
- **Method A (CLI)**:
  ```bash
  npm i -g vercel
  vercel
  ```
- **Method B (Dashboard)**: Push this folder to a GitHub repository, open [vercel.com](https://vercel.com), click "Import Project", and deploy. Clean URLs and service worker cache headers are pre-configured.

### 3. Netlify
Configuration file: [`netlify.toml`](./netlify.toml)
- **Method A (Drag & Drop)**: Log in to [netlify.com](https://netlify.com) and drag the project folder into Netlify Drop.
- **Method B (GitHub Integration)**: Connect your repository; Netlify will read `netlify.toml` automatically.

### 4. GitHub Pages
Configuration file: [`.nojekyll`](./.nojekyll)
1. Push this project to a GitHub repository.
2. Go to **Settings** > **Pages**.
3. Under **Build and deployment**, select **Source: Deploy from a branch**, choose `main` branch and `/ (root)`, then click **Save**.

---

## 📂 Project Architecture

```
d:\Projects\spendwise/
├── index.html              # Main Dashboard
├── expenses.html           # Expense tracking, filtering & export
├── budget.html             # Monthly budget manager
├── bills.html              # Recurring bills & payment status
├── savings.html            # Savings milestone goals
├── profile.html            # User profile, custom photo & avatars
├── login.html              # Firebase authentication (Sign in / Sign up)
├── 404.html                # Custom themed error page
├── style.css               # Unified responsive stylesheet
├── login.css               # Clean authentication stylesheet
├── icon.svg                # Vector brand logo & PWA icon
├── manifest.json           # Web App Manifest
├── sw.js                   # Service Worker (offline cache v3)
├── nav.js                  # Global sidebar navigation & topbar avatar sync
├── ui.js                   # Non-blocking toasts & custom confirm modal
├── server.js               # Zero-dependency local Node.js static server
├── package.json            # Project manifest & npm start script
├── firebase.json           # Firebase Hosting configuration
├── .firebaserc             # Firebase target project binding
├── vercel.json             # Vercel deployment configuration
├── netlify.toml            # Netlify deployment configuration
└── .nojekyll               # GitHub Pages Jekyll bypass
```

---

## 🔒 Security & Best Practices

- **Zero Unhandled Errors**: All forms validate inputs, verify numeric ranges, and sanitize text nodes.
- **Quota Safeguards**: Photos are compressed via HTML5 Canvas thumbnails (< 25 KB) to eliminate `localStorage` quota exceptions.
- **No Blocking Alerts**: Browser `window.alert` is replaced by smooth toasts (`showToast`) and accessible confirm dialogs (`showConfirm`).
- **No Leakage**: Sign-out properly flushes active session tokens while safely retaining user preferences.
