
"use strict";

const $ = (id) => document.getElementById(id);
const STORAGE_KEY = "spendwise_expenses";
let expenses = [];
let editingId = null;

const money = (value) => new Intl.NumberFormat("en-IN", {
  style: "currency", currency: "INR"
}).format(Number(value) || 0);

function today() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function loadExpenses() {
  try {
    const data = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
    expenses = Array.isArray(data) ? data : [];
  } catch {
    expenses = [];
  }
}

function persistExpenses() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(expenses));
    return true;
  } catch (error) {
    console.error(error);
    alert("Unable to save expenses. Check browser storage.");
    return false;
  }
}

function filteredExpenses() {
  const search = $("expenseSearch").value.trim().toLowerCase();
  const category = $("categoryFilter").value;
  const from = $("fromDate").value;
  const to = $("toDate").value;

  return expenses.filter((e) =>
    String(e.title || "").toLowerCase().includes(search) &&
    (!category || e.category === category) &&
    (!from || e.date >= from) &&
    (!to || e.date <= to)
  ).sort((a, b) => String(b.date).localeCompare(String(a.date)));
}

function renderExpenses() {
  const tbody = $("expenseTableBody");
  tbody.replaceChildren();

  const rows = filteredExpenses();

  rows.forEach((expense) => {
    const tr = document.createElement("tr");

    [expense.title, expense.category, money(expense.amount), expense.date]
      .forEach((value) => {
        const td = document.createElement("td");
        td.textContent = value ?? "";
        tr.appendChild(td);
      });

    const actions = document.createElement("td");
    actions.className = "expense-actions";

    const edit = document.createElement("button");
    edit.type = "button";
    edit.textContent = "Edit";
    edit.className = "secondary-button";
    edit.addEventListener("click", () => startEdit(expense.id));

    const del = document.createElement("button");
    del.type = "button";
    del.textContent = "Delete";
    del.className = "secondary-button";
    del.addEventListener("click", () => deleteExpense(expense.id));

    actions.append(edit, del);
    tr.appendChild(actions);
    tbody.appendChild(tr);
  });

  $("noExpensesMessage").hidden = rows.length > 0;
  $("noExpensesMessage").textContent = expenses.length
    ? "No expenses match your filters."
    : "No expenses added yet.";

  const total = expenses.reduce((sum, e) => sum + Number(e.amount || 0), 0);
  $("expenseTotal").textContent = money(total);
  $("expenseCount").textContent = String(expenses.length);
  $("expenseAverage").textContent = money(expenses.length ? total / expenses.length : 0);
}

function resetForm() {
  $("expenseForm").reset();
  $("expenseDate").value = today();
  editingId = null;
  $("formHeading").textContent = "Add Expense";
  $("saveExpenseButton").textContent = "Add Expense";
  $("cancelEditButton").hidden = true;
}

function startEdit(id) {
  const expense = expenses.find((e) => e.id === id);
  if (!expense) return;

  editingId = id;
  $("expenseTitle").value = expense.title;
  $("expenseCategory").value = expense.category;
  $("expenseAmount").value = expense.amount;
  $("expenseDate").value = expense.date;
  $("formHeading").textContent = "Edit Expense";
  $("saveExpenseButton").textContent = "Update Expense";
  $("cancelEditButton").hidden = false;
  $("expenseForm").scrollIntoView({ behavior: "smooth", block: "start" });
}

function deleteExpense(id) {
  if (!confirm("Delete this expense?")) return;
  expenses = expenses.filter((e) => e.id !== id);
  if (!persistExpenses()) return;
  if (editingId === id) resetForm();
  renderExpenses();
}

$("expenseForm").addEventListener("submit", (event) => {
  event.preventDefault();

  const title = $("expenseTitle").value.trim();
  const category = $("expenseCategory").value;
  const amount = Number($("expenseAmount").value);
  const date = $("expenseDate").value;

  if (!title || !category || !date || !Number.isFinite(amount) || amount <= 0) {
    alert("Please enter valid expense details.");
    return;
  }

  if (editingId !== null) {
    expenses = expenses.map((e) =>
      e.id === editingId ? { ...e, title, category, amount, date } : e
    );
  } else {
    expenses.push({
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      title, category, amount, date
    });
  }

  if (!persistExpenses()) return;
  resetForm();
  renderExpenses();
});

$("cancelEditButton").addEventListener("click", resetForm);

["expenseSearch", "categoryFilter", "fromDate", "toDate"].forEach((id) => {
  $(id).addEventListener("input", () => {
    if ($("fromDate").value && $("toDate").value &&
        $("fromDate").value > $("toDate").value) {
      if (id === "fromDate") $("toDate").value = "";
      else $("fromDate").value = "";
    }
    renderExpenses();
  });
});

$("clearExpenseFilters").addEventListener("click", () => {
  $("expenseSearch").value = "";
  $("categoryFilter").value = "";
  $("fromDate").value = "";
  $("toDate").value = "";
  renderExpenses();
});

$("exportExpensesButton").addEventListener("click", () => {
  const rows = filteredExpenses();

  if (!rows.length) {
    alert("There are no expenses to export.");
    return;
  }

  const csvCell = (v) => `"${String(v ?? "").replace(/"/g, '""')}"`;
  const csv = [
    ["Expense", "Category", "Amount", "Date"],
    ...rows.map((e) => [e.title, e.category, e.amount, e.date])
  ].map((row) => row.map(csvCell).join(",")).join("\r\n");

  const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `spendwise-expenses-${today()}.csv`;
  link.click();
  URL.revokeObjectURL(url);
});

$("currentDate").textContent = new Date().toLocaleDateString("en-IN", {
  day: "numeric", month: "long", year: "numeric"
});

$("expenseDate").value = today();
loadExpenses();
renderExpenses();
