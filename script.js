
"use strict";

/* =========================================
   SPENDWISE - SMART EXPENSE TRACKER
   Data is currently stored in browser localStorage.
========================================= */

const $ = (id) => document.getElementById(id);

const STORAGE_KEYS = {
  expenses: "spendwise_expenses",
  budget: "spendwise_budget",
  bills: "spendwise_bills",
  savings: "spendwise_savings"
};

const money = (amount) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR"
  }).format(Number(amount) || 0);

const localDateString = (date = new Date()) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

function loadData(key, fallback) {
  try {
    const stored = localStorage.getItem(key);
    if (stored === null) return fallback;

    const parsed = JSON.parse(stored);
    return Array.isArray(fallback)
      ? (Array.isArray(parsed) ? parsed : fallback)
      : parsed;
  } catch (error) {
    console.error(`Unable to read ${key}:`, error);
    return fallback;
  }
}

function saveData(key, data) {
  try {
    localStorage.setItem(key, JSON.stringify(data));
    return true;
  } catch (error) {
    console.error(`Unable to save ${key}:`, error);
    alert("Your data could not be saved. Check your browser storage.");
    return false;
  }
}

// Escape user-entered values before inserting them into HTML.
function escapeHTML(value) {
  return String(value ?? "").replace(/[&<>"']/g, (character) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;"
  })[character]);
}

let expenses = loadData(STORAGE_KEYS.expenses, []);
let bills = loadData(STORAGE_KEYS.bills, []);
let savings = loadData(STORAGE_KEYS.savings, []);
let budget = Number(loadData(STORAGE_KEYS.budget, 0)) || 0;
let editingExpenseId = null;

/* =========================================
   ELEMENT REFERENCES
========================================= */

const expenseForm = $("expenseForm");
const titleInput = $("title");
const categoryInput = $("category");
const amountInput = $("amount");
const dateInput = $("date");

const searchInput = $("search");
const filterCategory = $("filterCategory");
const startDateInput = $("startDate");
const endDateInput = $("endDate");

const budgetForm = $("budgetForm");
const budgetAmountInput = $("budgetAmount");

const billForm = $("billForm");
const savingForm = $("savingForm");

/* =========================================
   INITIAL SETUP
========================================= */

function initializeApp() {
  if ($("currentDate")) {
    $("currentDate").textContent = new Date().toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric"
    });
  }

  const today = localDateString();

  if (dateInput && !dateInput.value) dateInput.value = today;
  if ($("billDueDate")) $("billDueDate").value = today;
  if ($("savingDate")) $("savingDate").value = today;

  if (budgetAmountInput && budget > 0) {
    budgetAmountInput.value = budget;
  }

  expenseForm.addEventListener("submit", handleExpenseSubmit);
  $("cancelButton").addEventListener("click", resetExpenseForm);

  searchInput.addEventListener("input", renderExpenses);
  filterCategory.addEventListener("change", renderExpenses);

  // Date filters: these IDs now exist in index.html.
  startDateInput.addEventListener("change", () => {
    if (
      startDateInput.value &&
      endDateInput.value &&
      startDateInput.value > endDateInput.value
    ) {
      endDateInput.value = "";
    }
    renderExpenses();
  });

  endDateInput.addEventListener("change", () => {
    if (
      startDateInput.value &&
      endDateInput.value &&
      endDateInput.value < startDateInput.value
    ) {
      startDateInput.value = "";
    }
    renderExpenses();
  });

  $("clearFiltersButton").addEventListener("click", () => {
    searchInput.value = "";
    filterCategory.value = "";
    startDateInput.value = "";
    endDateInput.value = "";
    renderExpenses();
  });

  $("exportButton").addEventListener("click", exportCSV);

  budgetForm.addEventListener("submit", handleBudgetSubmit);

  $("toggleBillForm").addEventListener("click", () => {
    billForm.hidden = !billForm.hidden;
  });
  billForm.addEventListener("submit", handleBillSubmit);

  $("toggleSavingForm").addEventListener("click", () => {
    savingForm.hidden = !savingForm.hidden;
  });
  savingForm.addEventListener("submit", handleSavingSubmit);

  renderExpenses();
  renderBudget();
  renderBills();
  renderSavings();
  drawCategoryChart();

  // Firebase sign-out is handled by dashboard-auth.js.
}

function getMonthKey(dateString) {
  return String(dateString || "").slice(0, 7);
}

/* =========================================
   EXPENSES: ADD, EDIT, DELETE
========================================= */

function handleExpenseSubmit(event) {
  event.preventDefault();

  const title = titleInput.value.trim();
  const category = categoryInput.value;
  const amount = Number(amountInput.value);
  const date = dateInput.value;

  if (!title || !category || !Number.isFinite(amount) ||
      amount <= 0 || !date) {
    alert("Please enter a valid expense.");
    return;
  }

  if (editingExpenseId !== null) {
    expenses = expenses.map((expense) =>
      expense.id === editingExpenseId
        ? { ...expense, title, category, amount, date }
        : expense
    );
  } else {
    expenses.push({
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      title,
      category,
      amount,
      date
    });
  }

  if (!saveData(STORAGE_KEYS.expenses, expenses)) return;

  resetExpenseForm();
  renderExpenses();
  renderBudget();
  drawCategoryChart();
}

function resetExpenseForm() {
  expenseForm.reset();
  dateInput.value = localDateString();
  editingExpenseId = null;

  $("formHeading").textContent = "Add New Expense";
  $("submitButton").textContent = "Add Expense";
  $("cancelButton").hidden = true;
}

function editExpense(id) {
  const expense = expenses.find((item) => item.id === id);
  if (!expense) return;

  editingExpenseId = id;
  titleInput.value = expense.title;
  categoryInput.value = expense.category;
  amountInput.value = expense.amount;
  dateInput.value = expense.date;

  $("formHeading").textContent = "Edit Expense";
  $("submitButton").textContent = "Update Expense";
  $("cancelButton").hidden = false;

  expenseForm.scrollIntoView({ behavior: "smooth", block: "start" });
}

function deleteExpense(id) {
  if (!confirm("Are you sure you want to delete this expense?")) return;

  expenses = expenses.filter((expense) => expense.id !== id);

  if (!saveData(STORAGE_KEYS.expenses, expenses)) return;

  if (editingExpenseId === id) resetExpenseForm();

  renderExpenses();
  renderBudget();
  drawCategoryChart();
}

/* =========================================
   EXPENSE FILTERING AND RENDERING
========================================= */

function getFilteredExpenses() {
  const search = searchInput.value.trim().toLowerCase();
  const category = filterCategory.value;
  const startDate = startDateInput.value;
  const endDate = endDateInput.value;

  return expenses
    .filter((expense) => {
      const matchesSearch = expense.title.toLowerCase().includes(search);
      const matchesCategory = !category || expense.category === category;
      const matchesStart = !startDate || expense.date >= startDate;
      const matchesEnd = !endDate || expense.date <= endDate;

      return matchesSearch && matchesCategory &&
        matchesStart && matchesEnd;
    })
    .sort((a, b) => b.date.localeCompare(a.date));
}

function renderExpenses() {
  const filtered = getFilteredExpenses();
  const list = $("expenseList");

  list.innerHTML = "";

  filtered.forEach((expense) => {
    const row = document.createElement("tr");

    row.innerHTML = `
      <td>${escapeHTML(expense.title)}</td>
      <td>${escapeHTML(expense.category)}</td>
      <td>${money(expense.amount)}</td>
      <td>${escapeHTML(expense.date)}</td>
      <td>
        <button type="button" data-action="edit"
          data-id="${escapeHTML(expense.id)}">Edit</button>
        <button type="button" data-action="delete"
          data-id="${escapeHTML(expense.id)}">Delete</button>
      </td>
    `;

    list.appendChild(row);
  });

  list.querySelectorAll("button[data-action]").forEach((button) => {
    button.addEventListener("click", () => {
      const id = button.dataset.id;

      if (button.dataset.action === "edit") editExpense(id);
      if (button.dataset.action === "delete") deleteExpense(id);
    });
  });

  $("emptyMessage").hidden = filtered.length > 0;
  $("emptyMessage").textContent = filtered.length
    ? ""
    : (expenses.length ? "No expenses match your filters." : "No expenses added yet.");

  // Summary cards show all expenses, not only filtered results.
  const total = expenses.reduce((sum, item) => sum + Number(item.amount), 0);
  const count = expenses.length;

  $("totalAmount").textContent = money(total);
  $("totalCount").textContent = String(count);
  $("averageAmount").textContent = money(count ? total / count : 0);
}

/* =========================================
   MONTHLY BUDGET
========================================= */

function handleBudgetSubmit(event) {
  event.preventDefault();

  const value = Number(budgetAmountInput.value);

  if (!Number.isFinite(value) || value <= 0) {
    alert("Please enter a budget greater than zero.");
    return;
  }

  budget = value;

  if (!saveData(STORAGE_KEYS.budget, budget)) return;

  renderBudget();
}

function renderBudget() {
  const currentMonth = localDateString().slice(0, 7);

  const spent = expenses
    .filter((expense) => getMonthKey(expense.date) === currentMonth)
    .reduce((sum, expense) => sum + Number(expense.amount), 0);

  $("monthlySpent").textContent = money(spent);

  const progress = $("budgetProgress");
  const percentage = budget > 0 ? (spent / budget) * 100 : 0;

  progress.max = 100;
  progress.value = Math.min(percentage, 100);

  if (budget <= 0) {
    $("budgetMessage").textContent = "Set a budget to track your spending.";
  } else if (spent > budget) {
    $("budgetMessage").textContent =
      `Budget exceeded by ${money(spent - budget)}.`;
  } else {
    $("budgetMessage").textContent =
      `${percentage.toFixed(1)}% of your budget used. ${money(budget - spent)} remaining.`;
  }
}

/* =========================================
   CATEGORY ANALYTICS
========================================= */

function drawCategoryChart() {
  const canvas = $("categoryChart");
  const message = $("chartMessage");
  const context = canvas.getContext("2d");

  const totals = {};

  expenses.forEach((expense) => {
    totals[expense.category] =
      (totals[expense.category] || 0) + Number(expense.amount);
  });

  const entries = Object.entries(totals)
    .filter(([, amount]) => amount > 0)
    .sort((a, b) => b[1] - a[1]);

  // Account for high-density screens and canvas resizing.
  const width = Math.max(canvas.clientWidth, 280);
  const height = 260;
  const ratio = window.devicePixelRatio || 1;

  canvas.style.width = "100%";
  canvas.style.height = `${height}px`;
  canvas.width = width * ratio;
  canvas.height = height * ratio;

  context.setTransform(ratio, 0, 0, ratio, 0, 0);
  context.clearRect(0, 0, width, height);

  if (!entries.length) {
    message.hidden = false;
    return;
  }

  message.hidden = true;

  const colors = [
    "#18794e", "#3b82f6", "#f59e0b", "#8b5cf6",
    "#ef4444", "#14b8a6", "#ec4899", "#64748b", "#84cc16"
  ];

  const total = entries.reduce((sum, [, amount]) => sum + amount, 0);
  const centerX = Math.min(width * 0.28, 115);
  const centerY = height / 2;
  const radius = Math.min(78, height * 0.30, width * 0.23);

  let startAngle = -Math.PI / 2;

  entries.forEach(([, amount], index) => {
    const slice = (amount / total) * Math.PI * 2;

    context.beginPath();
    context.moveTo(centerX, centerY);
    context.arc(centerX, centerY, radius, startAngle, startAngle + slice);
    context.closePath();
    context.fillStyle = colors[index % colors.length];
    context.fill();

    startAngle += slice;
  });

  const legendX = centerX + radius + 20;
  const availableWidth = width - legendX - 8;
  const maxVisible = Math.max(1, Math.floor((height - 12) / 26));
  const visibleEntries = entries.slice(0, maxVisible);

  context.font = "12px Arial";
  context.textBaseline = "middle";

  visibleEntries.forEach(([category, amount], index) => {
    const y = 18 + index * 26;

    context.fillStyle = colors[index % colors.length];
    context.fillRect(legendX, y - 5, 10, 10);

    context.fillStyle = "#263238";
    const label = `${category}: ${money(amount)}`;
    const maxChars = Math.max(10, Math.floor(availableWidth / 7));
    const shortened = label.length > maxChars
      ? `${label.slice(0, maxChars - 1)}…`
      : label;

    context.fillText(shortened, legendX + 16, y);
  });

  if (entries.length > visibleEntries.length) {
    context.fillStyle = "#64748b";
    context.fillText(
      `+${entries.length - visibleEntries.length} more categories`,
      legendX,
      height - 12
    );
  }
}

window.addEventListener("resize", drawCategoryChart);

/* =========================================
   CSV EXPORT
========================================= */

function exportCSV() {
  const filtered = getFilteredExpenses();

  if (!filtered.length) {
    alert("There are no expenses to export.");
    return;
  }

  const headers = ["Expense", "Category", "Amount", "Date"];

  const rows = filtered.map((expense) => [
    expense.title,
    expense.category,
    expense.amount,
    expense.date
  ]);

  const csvCell = (value) =>
    `"${String(value ?? "").replace(/"/g, '""')}"`;

  const csv = [headers, ...rows]
    .map((row) => row.map(csvCell).join(","))
    .join("\r\n");

  const blob = new Blob(["\uFEFF" + csv], {
    type: "text/csv;charset=utf-8;"
  });

  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = url;
  link.download = `spendwise-expenses-${localDateString()}.csv`;
  document.body.appendChild(link);
  link.click();
  link.remove();

  URL.revokeObjectURL(url);
}

/* =========================================
   BILLS AND PAYMENTS
========================================= */

function handleBillSubmit(event) {
  event.preventDefault();

  const name = $("billName").value.trim();
  const amount = Number($("billAmount").value);
  const dueDate = $("billDueDate").value;
  const status = $("billStatus").value;
  const notes = $("billNotes").value.trim();

  if (!name || !Number.isFinite(amount) || amount <= 0 || !dueDate) {
    alert("Please enter valid bill details.");
    return;
  }

  bills.push({
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    name,
    amount,
    dueDate,
    status,
    notes
  });

  if (!saveData(STORAGE_KEYS.bills, bills)) return;

  billForm.reset();
  $("billDueDate").value = localDateString();
  $("billForm").hidden = true;
  renderBills();
}

function renderBills() {
  const list = $("billList");
  list.innerHTML = "";

  bills.sort((a, b) => a.dueDate.localeCompare(b.dueDate));

  let pendingTotal = 0;

  bills.forEach((bill) => {
    if (bill.status === "Pending") pendingTotal += Number(bill.amount);

    const item = document.createElement("article");
    item.className = "card";

    item.innerHTML = `
      <h3>${escapeHTML(bill.name)}</h3>
      <p>Amount: ${money(bill.amount)}</p>
      <p>Due date: ${escapeHTML(bill.dueDate)}</p>
      <p>Status: ${escapeHTML(bill.status)}</p>
      ${bill.notes ? `<p>${escapeHTML(bill.notes)}</p>` : ""}
      <button type="button" data-action="toggle-bill"
        data-id="${escapeHTML(bill.id)}">
        Mark ${bill.status === "Paid" ? "Pending" : "Paid"}
      </button>
      <button type="button" data-action="delete-bill"
        data-id="${escapeHTML(bill.id)}">Delete</button>
    `;

    list.appendChild(item);
  });

  $("pendingBillsTotal").textContent = money(pendingTotal);
  $("emptyBillsMessage").hidden = bills.length > 0;

  list.querySelectorAll("button[data-action]").forEach((button) => {
    button.addEventListener("click", () => {
      const id = button.dataset.id;

      if (button.dataset.action === "toggle-bill") {
        bills = bills.map((bill) =>
          bill.id === id
            ? { ...bill, status: bill.status === "Paid" ? "Pending" : "Paid" }
            : bill
        );
      } else {
        if (!confirm("Delete this bill?")) return;
        bills = bills.filter((bill) => bill.id !== id);
      }

      if (saveData(STORAGE_KEYS.bills, bills)) renderBills();
    });
  });
}

/* =========================================
   SAVINGS AND INVESTMENTS
========================================= */

function handleSavingSubmit(event) {
  event.preventDefault();

  const name = $("savingName").value.trim();
  const type = $("savingType").value;
  const amount = Number($("savingAmount").value);
  const date = $("savingDate").value;
  const notes = $("savingNotes").value.trim();

  if (!name || !type || !Number.isFinite(amount) || amount <= 0 || !date) {
    alert("Please enter valid savings details.");
    return;
  }

  savings.push({
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    name,
    type,
    amount,
    date,
    notes
  });

  if (!saveData(STORAGE_KEYS.savings, savings)) return;

  savingForm.reset();
  $("savingDate").value = localDateString();
  $("savingForm").hidden = true;
  renderSavings();
}

function renderSavings() {
  const list = $("savingList");
  list.innerHTML = "";

  savings.sort((a, b) => b.date.localeCompare(a.date));

  const total = savings.reduce(
    (sum, item) => sum + Number(item.amount), 0
  );

  $("totalSavings").textContent = money(total);
  $("emptySavingsMessage").hidden = savings.length > 0;

  savings.forEach((saving) => {
    const item = document.createElement("article");
    item.className = "card";

    item.innerHTML = `
      <h3>${escapeHTML(saving.name)}</h3>
      <p>Type: ${escapeHTML(saving.type)}</p>
      <p>Amount: ${money(saving.amount)}</p>
      <p>Date: ${escapeHTML(saving.date)}</p>
      ${saving.notes ? `<p>${escapeHTML(saving.notes)}</p>` : ""}
      <button type="button" data-delete-saving="${escapeHTML(saving.id)}">
        Delete
      </button>
    `;

    list.appendChild(item);
  });

  list.querySelectorAll("[data-delete-saving]").forEach((button) => {
    button.addEventListener("click", () => {
      const id = button.dataset.deleteSaving;

      if (!confirm("Delete this savings record?")) return;

      savings = savings.filter((item) => item.id !== id);

      if (saveData(STORAGE_KEYS.savings, savings)) renderSavings();
    });
  });
}

/* =========================================
   START APPLICATION
========================================= */

initializeApp();
