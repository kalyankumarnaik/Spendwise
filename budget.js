const budgetForm = document.getElementById("budgetForm");
const budgetInput = document.getElementById("monthlyBudget");
const budgetAmount = document.getElementById("budgetAmount");
const budgetSpent = document.getElementById("budgetSpent");
const budgetRemaining = document.getElementById("budgetRemaining");
const budgetMessage = document.getElementById("budgetMessage");
const budgetProgressBar = document.getElementById("budgetProgressBar");
const budgetPercentage = document.getElementById("budgetPercentage");
const budgetStatus = document.getElementById("budgetStatus");

function formatCurrency(amount) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2
  }).format(amount);
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

  return expenses
    .filter((expense) => {
      if (!expense.date) return false;

      const date = new Date(expense.date + "T00:00:00");

      return (
        date.getMonth() === now.getMonth() &&
        date.getFullYear() === now.getFullYear()
      );
    })
    .reduce(
      (total, expense) => total + Number(expense.amount || 0),
      0
    );
}

function renderBudget() {
  const budget = Number(
    localStorage.getItem("spendwise_budget") || 0
  );

  const spent = getMonthlyExpenses();
  const remaining = budget - spent;
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

  const amount = Number(budgetInput.value);

  if (!Number.isFinite(amount) || amount <= 0) {
    budgetMessage.textContent =
      "Please enter an amount greater than zero.";
    return;
  }

  try {
    localStorage.setItem("spendwise_budget", String(amount));

    renderBudget();
    budgetMessage.textContent = "Monthly budget saved successfully!";
    budgetInput.value = "";
  } catch (error) {
    console.error("Unable to save budget:", error);
    budgetMessage.textContent =
      "Unable to save. Please check your browser storage settings.";
  }
});

renderBudget();