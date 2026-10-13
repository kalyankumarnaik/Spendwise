const savingsForm = document.getElementById("savingsForm");
const goalName = document.getElementById("goalName");
const targetAmount = document.getElementById("targetAmount");
const initialSaved = document.getElementById("initialSaved");
const targetDate = document.getElementById("targetDate");
const savingsMessage = document.getElementById("savingsMessage");
const savingsGoalsList = document.getElementById("savingsGoalsList");
const emptySavingsMessage = document.getElementById("emptySavingsMessage");

const totalSavedElement = document.getElementById("totalSaved");
const totalTargetsElement = document.getElementById("totalTargets");
const activeGoalsElement = document.getElementById("activeGoals");

const SAVINGS_KEY = "spendwise_savings";

function getSavingsGoals() {
  try {
    return JSON.parse(localStorage.getItem(SAVINGS_KEY) || "[]");
  } catch {
    return [];
  }
}

function saveSavingsGoals(goals) {
  localStorage.setItem(SAVINGS_KEY, JSON.stringify(goals));
}

function formatCurrency(amount) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2
  }).format(amount);
}

function renderSavingsGoals() {
  const goals = getSavingsGoals();

  savingsGoalsList.replaceChildren();

  const totalSaved = goals.reduce(
    (sum, goal) => sum + Number(goal.saved || 0), 0
  );

  const totalTargets = goals.reduce(
    (sum, goal) => sum + Number(goal.target || 0), 0
  );

  totalSavedElement.textContent = formatCurrency(totalSaved);
  totalTargetsElement.textContent = formatCurrency(totalTargets);
  activeGoalsElement.textContent = goals.filter(
    goal => Number(goal.saved) < Number(goal.target)
  ).length;

  emptySavingsMessage.hidden = goals.length > 0;

  goals.forEach(goal => {
    const card = document.createElement("article");
    card.className = "content-card savings-goal-card";

    const heading = document.createElement("h3");
    heading.textContent = goal.name;

    const target = document.createElement("p");
    target.textContent = `Target: ${formatCurrency(goal.target)}`;

    const saved = document.createElement("p");
    saved.textContent = `Saved: ${formatCurrency(goal.saved)}`;

    const remaining = document.createElement("p");
    remaining.textContent =
      `Remaining: ${formatCurrency(Math.max(0, goal.target - goal.saved))}`;

    const date = document.createElement("p");
    date.textContent = `Target date: ${goal.date}`;

    const percentage = Math.min(
      100, (goal.saved / goal.target) * 100
    );

    const progressTrack = document.createElement("div");
    progressTrack.className = "savings-progress-track";

    const progressBar = document.createElement("div");
    progressBar.className = "savings-progress-bar";
    progressBar.style.width = `${percentage}%`;

    progressTrack.appendChild(progressBar);

    const progressText = document.createElement("p");
    progressText.textContent = `${percentage.toFixed(1)}% completed`;

    const addAmount = document.createElement("input");
    addAmount.type = "number";
    addAmount.min = "0.01";
    addAmount.step = "0.01";
    addAmount.placeholder = "Amount to add (₹)";
    addAmount.setAttribute("aria-label", `Add savings to ${goal.name}`);

    const addButton = document.createElement("button");
    addButton.type = "button";
    addButton.textContent = "Add Savings";

    addButton.addEventListener("click", () => {
      const amount = Number(addAmount.value);

      if (!Number.isFinite(amount) || amount <= 0) {
        alert("Enter an amount greater than zero.");
        return;
      }

      const updatedGoals = getSavingsGoals().map(item => {
        if (item.id === goal.id) {
          return {
            ...item,
            saved: Math.min(item.target, item.saved + amount)
          };
        }
        return item;
      });

      try {
        saveSavingsGoals(updatedGoals);
        renderSavingsGoals();
      } catch (error) {
        console.error(error);
        alert("Unable to save your progress.");
      }
    });

    const deleteButton = document.createElement("button");
    deleteButton.type = "button";
    deleteButton.textContent = "Delete Goal";

    deleteButton.addEventListener("click", () => {
      if (!confirm(`Delete the goal "${goal.name}"?`)) return;

      try {
        saveSavingsGoals(
          getSavingsGoals().filter(item => item.id !== goal.id)
        );
        renderSavingsGoals();
      } catch (error) {
        console.error(error);
        alert("Unable to delete the goal.");
      }
    });

    card.append(
      heading,
      target,
      saved,
      remaining,
      date,
      progressTrack,
      progressText,
      addAmount,
      addButton,
      deleteButton
    );

    savingsGoalsList.appendChild(card);
  });
}

savingsForm.addEventListener("submit", event => {
  event.preventDefault();

  const name = goalName.value.trim();
  const target = Number(targetAmount.value);
  const saved = Number(initialSaved.value);
  const date = targetDate.value;

  if (
    !name ||
    !Number.isFinite(target) ||
    target <= 0 ||
    !Number.isFinite(saved) ||
    saved < 0 ||
    saved > target ||
    !date
  ) {
    savingsMessage.textContent =
      "Enter valid details. Your initial savings cannot exceed the target.";
    return;
  }

  const goals = getSavingsGoals();

  goals.push({
    id: crypto.randomUUID(),
    name,
    target,
    saved,
    date
  });

  try {
    saveSavingsGoals(goals);
    savingsForm.reset();
    initialSaved.value = "0";
    savingsMessage.textContent = "Savings goal created successfully!";
    renderSavingsGoals();
  } catch (error) {
    console.error(error);
    savingsMessage.textContent = "Unable to save your savings goal.";
  }
});

renderSavingsGoals();