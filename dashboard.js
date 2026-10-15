const STORAGE_KEYS = {
  expenses: "spendwise_expenses",
  budget: "spendwise_budget",
  bills: "spendwise_bills",
  savings: "spendwise_savings"
};

// ==========================================
// HELPER FUNCTIONS
// ==========================================

function readArray(key) {
  try {
    const data = JSON.parse(localStorage.getItem(key) || "[]");
    return Array.isArray(data) ? data : [];
  } catch (error) {
    console.error(`Unable to read ${key}:`, error);
    return [];
  }
}

function formatCurrency(amount) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(Number(amount) || 0);
}

function setText(id, value) {
  const element = document.getElementById(id);
  if (element) {
    element.textContent = value;
  }
}

function isCurrentMonth(dateString) {
  if (!dateString) return false;

  const date = new Date(`${dateString}T00:00:00`);
  const now = new Date();

  return (
    !Number.isNaN(date.getTime()) &&
    date.getMonth() === now.getMonth() &&
    date.getFullYear() === now.getFullYear()
  );
}

// ==========================================
// LOAD APPLICATION DATA
// ==========================================

function getDashboardData() {
  const expenses = readArray(STORAGE_KEYS.expenses);
  const bills = readArray(STORAGE_KEYS.bills);
  const savings = readArray(STORAGE_KEYS.savings);

  const rawBudget = Number(
    localStorage.getItem(STORAGE_KEYS.budget) || 0
  );

  const budget = Number.isFinite(rawBudget) && rawBudget > 0
    ? rawBudget
    : 0;

  const validExpenses = expenses.filter(expense =>
    Number.isFinite(Number(expense.amount)) &&
    Number(expense.amount) >= 0
  );

  const monthlyExpenses = validExpenses.filter(expense =>
    isCurrentMonth(expense.date)
  );

  const toPaise = (v) => Math.round((Number(v) || 0) * 100);
  const fromPaise = (p) => Math.round(p) / 100;

  const totalExpensesPaise = validExpenses.reduce(
    (sum, expense) => sum + toPaise(expense.amount),
    0
  );
  const totalExpenses = fromPaise(totalExpensesPaise);

  const monthlySpentPaise = monthlyExpenses.reduce(
    (sum, expense) => sum + toPaise(expense.amount),
    0
  );
  const monthlySpent = fromPaise(monthlySpentPaise);

  const averageExpense = validExpenses.length > 0
    ? fromPaise(Math.round(totalExpensesPaise / validExpenses.length))
    : 0;

  const pendingBills = bills.filter(
    bill => bill.status === "Pending"
  );

  const paidBills = bills.filter(
    bill => bill.status === "Paid"
  );

  const pendingBillsAmount = fromPaise(
    pendingBills.reduce(
      (sum, bill) => sum + Math.max(0, toPaise(bill.amount)),
      0
    )
  );

  const validSavings = savings.filter(goal =>
    Number.isFinite(Number(goal.target)) &&
    Number(goal.target) >= 0
  );

  const totalSaved = fromPaise(
    validSavings.reduce(
      (sum, goal) => sum + Math.max(0, toPaise(goal.saved)),
      0
    )
  );

  const totalTargets = fromPaise(
    validSavings.reduce(
      (sum, goal) => sum + toPaise(goal.target),
      0
    )
  );

  const activeGoals = validSavings.filter(
    goal => Number(goal.saved || 0) < Number(goal.target)
  );

  return {
    expenses: validExpenses,
    monthlyExpenses,
    totalExpenses,
    monthlySpent,
    averageExpense,
    budget,
    pendingBills,
    paidBills,
    bills,
    pendingBillsAmount,
    totalSaved,
    totalTargets,
    activeGoals
  };
}

// ==========================================
// FINANCIAL OVERVIEW
// ==========================================

function renderFinancialOverview(data) {
  setText("totalAmount", formatCurrency(data.totalExpenses));
  setText("totalCount", data.expenses.length);
  setText("averageAmount", formatCurrency(data.averageExpense));
  setText("monthlySpent", formatCurrency(data.monthlySpent));

  setText(
    "currentDate",
    new Date().toLocaleDateString("en-IN", {
      day: "numeric",
      month: "long",
      year: "numeric"
    })
  );
}

// ==========================================
// MONTHLY BUDGET
// ==========================================

function renderBudget(data) {
  const remaining = data.budget - data.monthlySpent;

  const percentage = data.budget > 0
    ? (data.monthlySpent / data.budget) * 100
    : 0;

  // IDs for the existing dashboard and optional budget cards.
  setText("budgetAmount", formatCurrency(data.budget));
  setText("budgetSpent", formatCurrency(data.monthlySpent));
  setText("budgetRemaining", formatCurrency(remaining));

  // Supports either an element or a progress-bar element.
  const progress = document.getElementById("budgetProgress");

  if (progress) {
    progress.style.width = `${Math.min(percentage, 100)}%`;
    progress.setAttribute("role", "progressbar");
    progress.setAttribute("aria-valuemin", "0");
    progress.setAttribute("aria-valuemax", "100");
    progress.setAttribute(
      "aria-valuenow",
      String(Math.min(percentage, 100))
    );
  }

  const message = document.getElementById("budgetMessage");

  if (message) {
    if (data.budget <= 0) {
      message.textContent = "Set a monthly budget to start tracking.";
    } else if (remaining < 0) {
      message.textContent =
        `Budget exceeded by ${formatCurrency(Math.abs(remaining))}.`;
    } else {
      message.textContent =
        `${percentage.toFixed(1)}% of your monthly budget used. ` +
        `${formatCurrency(remaining)} remaining.`;
    }
  }
}

// ==========================================
// BILLS & PAYMENTS
// ==========================================

function renderBills(data) {
  setText("totalBills", data.bills.length);
  setText("pendingBills", data.pendingBills.length);
  setText("paidBills", data.paidBills.length);
  setText("pendingBillsTotal", formatCurrency(data.pendingBillsAmount));
}

// ==========================================
// SAVINGS & INVESTMENTS
// ==========================================

function renderSavings(data) {
  setText("totalSaved", formatCurrency(data.totalSaved));
  setText("totalSavings", formatCurrency(data.totalSaved));
  setText("totalTargets", formatCurrency(data.totalTargets));
  setText("activeGoals", data.activeGoals.length);

  const progressElement = document.getElementById("savingsProgress");
  const percentage = data.totalTargets > 0
    ? (data.totalSaved / data.totalTargets) * 100
    : 0;

  if (progressElement) {
    progressElement.style.width = `${Math.min(percentage, 100)}%`;
  }

  setText("savingsPercentage", `${percentage.toFixed(1)}% of savings targets`);
}

// ==========================================
// RECENT TRANSACTIONS
// IMPORTANT: Uses proper table rows and cells.
// The index.html table body must have
// id="recentTransactions".
// ==========================================

function renderRecentExpenses(expenses) {
  const tableBody = document.getElementById("recentTransactions");
  const emptyMessage = document.getElementById("emptyMessage");

  if (!tableBody) {
    console.warn(
      'Recent transactions table body with id="recentTransactions" was not found.'
    );
    return;
  }

  tableBody.replaceChildren();

  const recent = [...expenses]
    .sort((a, b) => {
      const dateA = a.date ? new Date(`${a.date}T00:00:00`).getTime() : 0;
      const dateB = b.date ? new Date(`${b.date}T00:00:00`).getTime() : 0;
      return dateB - dateA;
    })
    .slice(0, 5);

  if (emptyMessage) {
    emptyMessage.hidden = recent.length > 0;
  }

  recent.forEach(expense => {
    const row = document.createElement("tr");

    // Column 1: Expense name and secondary date.
    const expenseCell = document.createElement("td");

const title = document.createElement("strong");
title.textContent = expense.title || "Expense";

expenseCell.appendChild(title);
    // Column 2: Category.
    const categoryCell = document.createElement("td");
    categoryCell.textContent = expense.category || "Other";

    // Column 3: Amount.
    const amountCell = document.createElement("td");
    amountCell.textContent = formatCurrency(expense.amount);

    // Column 4: Date.
    const dateCell = document.createElement("td");
    dateCell.textContent = expense.date || "—";

    row.append(
      expenseCell,
      categoryCell,
      amountCell,
      dateCell
    );

    tableBody.appendChild(row);
  });
}

// ==========================================
// SPENDING ANALYTICS
// ==========================================

function renderCategoryChart(expenses) {
  const canvas = document.getElementById("categoryChart");

  if (!canvas) return;

  const ctx = canvas.getContext("2d");

  if (!ctx) return;

  const totals = {};

  expenses
    .filter(expense => isCurrentMonth(expense.date))
    .forEach(expense => {
      const category = expense.category || "Other";
      totals[category] =
        (totals[category] || 0) + Number(expense.amount || 0);
    });

  // Make canvas dimensions match its visible size.
  const rect = canvas.getBoundingClientRect();
  const width = Math.max(300, Math.floor(rect.width || 650));
  const height = 260;
  const pixelRatio = window.devicePixelRatio || 1;

  canvas.width = width * pixelRatio;
  canvas.height = height * pixelRatio;
  canvas.style.height = `${height}px`;

  ctx.scale(pixelRatio, pixelRatio);
  ctx.clearRect(0, 0, width, height);

  const entries = Object.entries(totals)
    .sort((a, b) => b[1] - a[1]);

  if (entries.length === 0) {
    ctx.fillStyle = "#64748b";
    ctx.font = "14px Arial";
    ctx.textAlign = "center";
    ctx.fillText(
      "Add expenses to view your analytics.",
      width / 2,
      height / 2
    );
    return;
  }

  const visibleEntries = entries.slice(0, 6);
  const labelWidth = Math.min(120, width * 0.30);
  const amountWidth = 100;
  const barWidth = Math.max(40, width - labelWidth - amountWidth - 24);
  const maxAmount = Math.max(...visibleEntries.map(item => item[1]), 1);
  const barHeight = 26;
  const gap = 15;

  const categoryColors = {
    "Food": "#167a55",
    "Travel": "#0d9488",
    "Shopping": "#8b5cf6",
    "Bills": "#3b82f6",
    "Education": "#f59e0b",
    "Health": "#ef4444",
    "Entertainment": "#ec4899",
    "Investment": "#10b981",
    "Other": "#64748b"
  };

  visibleEntries.forEach(([category, amount], index) => {
    const y = 12 + index * (barHeight + gap);

    if (y + barHeight > height) return;

    const fillWidth = Math.max(4, (barWidth * amount) / maxAmount);
    const color = categoryColors[category] || "#167a55";

    // Category label.
    ctx.fillStyle = "#1e293b";
    ctx.font = "600 13px -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";
    ctx.textAlign = "left";
    ctx.textBaseline = "middle";
    ctx.fillText(
      category.length > 15 ? category.slice(0, 14) + "…" : category,
      4,
      y + barHeight / 2
    );

    // Background track.
    ctx.fillStyle = "#f1f5f9";
    if (ctx.roundRect) {
      ctx.beginPath();
      ctx.roundRect(labelWidth, y, barWidth, barHeight, 6);
      ctx.fill();
    } else {
      ctx.fillRect(labelWidth, y, barWidth, barHeight);
    }

    // Spending bar.
    ctx.fillStyle = color;
    if (ctx.roundRect) {
      ctx.beginPath();
      ctx.roundRect(labelWidth, y, fillWidth, barHeight, 6);
      ctx.fill();
    } else {
      ctx.fillRect(labelWidth, y, fillWidth, barHeight);
    }

    // Amount label.
    ctx.fillStyle = "#334155";
    ctx.font = "600 12px -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";
    ctx.fillText(
      formatCurrency(amount),
      labelWidth + barWidth + 8,
      y + barHeight / 2
    );
  });
}

// ==========================================
// RENDER THE COMPLETE DASHBOARD
// ==========================================

function updateDashboardGreeting() {
  const greetingEl = document.getElementById("welcomeGreeting");
  if (!greetingEl) return;
  const name = localStorage.getItem("spendwise_user_name") || "";
  if (name.trim()) {
    greetingEl.textContent = `Hello, ${name.trim()}! Welcome to SpendWise.`;
  }
}

function renderDashboard() {
  const data = getDashboardData();

  updateDashboardGreeting();
  renderFinancialOverview(data);
  renderBudget(data);
  renderBills(data);
  renderSavings(data);
  renderRecentExpenses(data.expenses);
  renderCategoryChart(data.expenses);
}

// Initial render.
renderDashboard();

// Refresh when returning to the dashboard.
window.addEventListener("pageshow", renderDashboard);

// Refresh when localStorage changes in another browser tab.
window.addEventListener("storage", renderDashboard);

// Redraw chart after resizing the browser.
window.addEventListener("resize", () => {
  renderCategoryChart(getDashboardData().expenses);
});