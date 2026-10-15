const budgetForm = document.getElementById("budgetForm");
const budgetInput = document.getElementById("monthlyBudget");
const budgetAmount = document.getElementById("budgetAmount");
const budgetSpent = document.getElementById("budgetSpent");
const budgetRemaining = document.getElementById("budgetRemaining");
const budgetMessage = document.getElementById("budgetMessage");
const budgetProgressBar = document.getElementById("budgetProgressBar");
const budgetPercentage = document.getElementById("budgetPercentage");
const budgetStatus = document.getElementById("budgetStatus");

function notify(msg, type = "info") {
  if (window.showToast) {
    window.showToast(msg, type);
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

function getMonthlyExpenses() {
  let expenses = [];

  try {
    expenses = JSON.parse(
      localStorage.getItem("spendwise_expenses") || "[]"
    );
  } catch (error) {
    console.error("Could not read expenses:", error);
  }

  const now = new Date();

  const totalPaise = expenses
    .filter((expense) => {
      if (!expense.date) return false;

      const date = new Date(expense.date + "T00:00:00");

      return (
        date.getMonth() === now.getMonth() &&
        date.getFullYear() === now.getFullYear()
      );
    })
    .reduce(
      (total, expense) => total + Math.round(Number(expense.amount || 0) * 100),
      0
    );

  return Math.round(totalPaise) / 100;
}

function renderBudget() {
  const rawBudget = Number(
    localStorage.getItem("spendwise_budget") || 0
  );
  const budget = Math.round((Number.isFinite(rawBudget) && rawBudget > 0 ? rawBudget : 0) * 100) / 100;

  const spent = getMonthlyExpenses();
  const remaining = Math.round((budget - spent) * 100) / 100;
  const percentage = budget > 0 ? (spent / budget) * 100 : 0;

  budgetAmount.textContent = formatCurrency(budget);
  budgetSpent.textContent = formatCurrency(spent);
  budgetRemaining.textContent = formatCurrency(remaining);

  budgetProgressBar.style.width =
    `${Math.min(percentage, 100)}%`;

  budgetPercentage.textContent = `${percentage.toFixed(1)}% used`;

  if (budget <= 0) {
    budgetStatus.textContent = "Set a monthly budget to begin.";
  } else if (remaining < 0) {
    budgetStatus.textContent =
      `Budget exceeded by ${formatCurrency(Math.abs(remaining))}.`;
  } else {
    budgetStatus.textContent =
      `${formatCurrency(remaining)} remaining this month.`;
  }
}

budgetForm.addEventListener("submit", (event) => {
  event.preventDefault();

  const rawAmount = Number(budgetInput.value);

  if (!Number.isFinite(rawAmount) || rawAmount <= 0) {
    const err = "Please enter an amount greater than zero.";
    budgetMessage.textContent = err;
    notify(err, "error");
    return;
  }

  const amount = Math.round(rawAmount * 100) / 100;

  try {
    localStorage.setItem("spendwise_budget", String(amount));

    renderBudget();
    const successMsg = "Monthly budget saved successfully!";
    budgetMessage.textContent = successMsg;
    notify(successMsg, "success");
    budgetInput.value = "";
  } catch (error) {
    console.error("Unable to save budget:", error);
    const failMsg = "Unable to save. Please check your browser storage settings.";
    budgetMessage.textContent = failMsg;
    notify(failMsg, "error");
  }
});

renderBudget();

// Auto-refresh when returning to page or when storage changes in another tab
window.addEventListener("pageshow", renderBudget);
window.addEventListener("storage", (e) => {
  if (!e.key || e.key === "spendwise_budget" || e.key === "spendwise_expenses") {
    renderBudget();
  }
});