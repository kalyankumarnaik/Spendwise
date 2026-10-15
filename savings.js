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

const toPaise = (val) => Math.round((Number(val) || 0) * 100);
const fromPaise = (paise) => Math.round(paise) / 100;

function notify(msg, type = "info") {
  if (window.showToast) {
    window.showToast(msg, type);
  }
}

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
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(Number(amount) || 0);
}

function renderSavingsGoals() {
  const goals = getSavingsGoals();

  savingsGoalsList.replaceChildren();

  // Precise total calculation using integer paise
  const totalSavedPaise = goals.reduce((sum, goal) => sum + toPaise(goal.saved), 0);
  const totalTargetsPaise = goals.reduce((sum, goal) => sum + toPaise(goal.target), 0);

  totalSavedElement.textContent = formatCurrency(fromPaise(totalSavedPaise));
  totalTargetsElement.textContent = formatCurrency(fromPaise(totalTargetsPaise));
  activeGoalsElement.textContent = goals.filter(
    goal => toPaise(goal.saved) < toPaise(goal.target)
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

    const remainingPaise = Math.max(0, toPaise(goal.target) - toPaise(goal.saved));
    const remaining = document.createElement("p");
    remaining.textContent = `Remaining: ${formatCurrency(fromPaise(remainingPaise))}`;

    const date = document.createElement("p");
    date.textContent = `Target date: ${goal.date}`;

    const percentage = goal.target > 0
      ? Math.min(100, (toPaise(goal.saved) / toPaise(goal.target)) * 100)
      : 0;

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
    addButton.className = "page-button";

    addButton.addEventListener("click", () => {
      const rawAdd = Number(addAmount.value);

      if (!Number.isFinite(rawAdd) || rawAdd <= 0) {
        notify("Enter an amount greater than zero.", "error");
        return;
      }

      const addPaise = toPaise(rawAdd);
      const updatedGoals = getSavingsGoals().map(item => {
        if (item.id === goal.id) {
          const newSavedPaise = Math.min(toPaise(item.target), toPaise(item.saved) + addPaise);
          return {
            ...item,
            saved: fromPaise(newSavedPaise)
          };
        }
        return item;
      });

      try {
        saveSavingsGoals(updatedGoals);
        notify(`Added ${formatCurrency(fromPaise(addPaise))} to "${goal.name}"!`, "success");
        renderSavingsGoals();
      } catch (error) {
        console.error(error);
        notify("Unable to save your progress.", "error");
      }
    });

    const deleteButton = document.createElement("button");
    deleteButton.type = "button";
    deleteButton.textContent = "Delete Goal";
    deleteButton.className = "danger-button";

    deleteButton.addEventListener("click", async () => {
      let confirmed = false;
      if (window.showConfirm) {
        confirmed = await window.showConfirm({
          title: "Delete Savings Goal",
          message: `Are you sure you want to delete the goal "${goal.name}"?`,
          confirmText: "Delete",
          cancelText: "Cancel",
          isDanger: true
        });
      } else {
        confirmed = confirm(`Delete the goal "${goal.name}"?`);
      }

      if (!confirmed) return;

      try {
        saveSavingsGoals(
          getSavingsGoals().filter(item => item.id !== goal.id)
        );
        notify("Savings goal deleted.", "info");
        renderSavingsGoals();
      } catch (error) {
        console.error(error);
        notify("Unable to delete the goal.", "error");
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
  const rawTarget = Number(targetAmount.value);
  const rawSaved = Number(initialSaved.value);
  const date = targetDate.value;

  if (
    !name ||
    !Number.isFinite(rawTarget) ||
    rawTarget <= 0 ||
    !Number.isFinite(rawSaved) ||
    rawSaved < 0 ||
    rawSaved > rawTarget ||
    !date
  ) {
    const errorMsg = "Enter valid details. Your initial savings cannot exceed the target.";
    savingsMessage.textContent = errorMsg;
    notify(errorMsg, "error");
    return;
  }

  const target = fromPaise(toPaise(rawTarget));
  const saved = fromPaise(toPaise(rawSaved));
  const goals = getSavingsGoals();

  goals.push({
    id: crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
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
    notify("Savings goal created successfully!", "success");
    renderSavingsGoals();
  } catch (error) {
    console.error(error);
    savingsMessage.textContent = "Unable to save your savings goal.";
    notify("Unable to save your savings goal.", "error");
  }
});

renderSavingsGoals();

// Auto-refresh when returning to page or when storage changes in another tab
window.addEventListener("pageshow", renderSavingsGoals);
window.addEventListener("storage", (e) => {
  if (!e.key || e.key === SAVINGS_KEY) {
    renderSavingsGoals();
  }
});