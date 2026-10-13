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

  const totalExpenses = validExpenses.reduce(
    (sum, expense) => sum + Number(expense.amount),
    0
  );

  const monthlySpent = monthlyExpenses.reduce(
    (sum, expense) => sum + Number(expense.amount),
    0
  );

  const averageExpense = validExpenses.length > 0
    ? totalExpenses / validExpenses.length
    : 0;

  const pendingBills = bills.filter(
    bill => bill.status === "Pending"
  );

  const paidBills = bills.filter(
    bill => bill.status === "Paid"
  );

  const pendingBillsAmount = pendingBills.reduce(
    (sum, bill) => sum + Math.max(0, Number(bill.amount) || 0),
    0
  );

  const validSavings = savings.filter(goal =>
    Number.isFinite(Number(goal.target)) &&
    Number(goal.target) >= 0
  );

  const totalSaved = validSavings.reduce(
    (sum, goal) => sum + Math.max(0, Number(goal.saved) || 0),
    0
  );

  const totalTargets = validSavings.reduce(
    (sum, goal) => sum + Number(goal.target),
    0
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

  visibleEntries.forEach(([category, amount], index) => {
    const y = 12 + index * (barHeight + gap);

    if (y + barHeight > height) return;

    // Category label.
    ctx.fillStyle = "#334155";
    ctx.font = "13px Arial";
    ctx.textAlign = "left";
    ctx.textBaseline = "middle";
    ctx.fillText(
      category.length > 15 ? category.slice(0, 14) + "…" : category,
      4,
      y + barHeight / 2
    );

    // Background track.
    ctx.fillStyle = "#e2e8f0";
    ctx.fillRect(labelWidth, y, barWidth, barHeight);

    // Spending bar.
    ctx.fillStyle = "#2563eb";
    ctx.fillRect(
      labelWidth,
      y,
      Math.max(2, barWidth * amount / maxAmount),
      barHeight
    );

    // Amount label.
    ctx.fillStyle = "#334155";
    ctx.font = "12px Arial";
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

function renderDashboard() {
  const data = getDashboardData();

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