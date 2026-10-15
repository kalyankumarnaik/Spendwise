const billForm = document.getElementById("billForm");
const billTitle = document.getElementById("billTitle");
const billAmount = document.getElementById("billAmount");
const billDueDate = document.getElementById("billDueDate");
const billMessage = document.getElementById("billMessage");
const billsTableBody = document.getElementById("billsTableBody");
const emptyBillsMessage = document.getElementById("emptyBillsMessage");

const totalBills = document.getElementById("totalBills");
const pendingBills = document.getElementById("pendingBills");
const paidBills = document.getElementById("paidBills");

const BILL_KEY = "spendwise_bills";

const toPaise = (val) => Math.round((Number(val) || 0) * 100);
const fromPaise = (paise) => Math.round(paise) / 100;

function notify(msg, type = "info") {
  if (window.showToast) {
    window.showToast(msg, type);
  }
}

function getBills() {
  try {
    return JSON.parse(localStorage.getItem(BILL_KEY) || "[]");
  } catch {
    return [];
  }
}

function saveBills(bills) {
  localStorage.setItem(BILL_KEY, JSON.stringify(bills));
}

function formatCurrency(amount) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(Number(amount) || 0);
}

function renderBills() {
  const bills = getBills();

  billsTableBody.replaceChildren();

  totalBills.textContent = bills.length;
  pendingBills.textContent = bills.filter(
    bill => bill.status === "Pending"
  ).length;
  paidBills.textContent = bills.filter(
    bill => bill.status === "Paid"
  ).length;

  emptyBillsMessage.hidden = bills.length > 0;

  bills.forEach(bill => {
    const row = document.createElement("tr");

    const titleCell = document.createElement("td");
    titleCell.textContent = bill.title;

    const amountCell = document.createElement("td");
    amountCell.textContent = formatCurrency(bill.amount);

    const dateCell = document.createElement("td");
    dateCell.textContent = bill.dueDate;

    const statusCell = document.createElement("td");
    statusCell.textContent = bill.status;

    const actionCell = document.createElement("td");
    actionCell.className = "expense-actions";

    if (bill.status === "Pending") {
      const paidButton = document.createElement("button");
      paidButton.type = "button";
      paidButton.textContent = "Mark Paid";
      paidButton.className = "page-button";
      paidButton.style.padding = "6px 12px";
      paidButton.style.fontSize = "13px";

      paidButton.addEventListener("click", () => {
        updateBillStatus(bill.id);
      });

      actionCell.appendChild(paidButton);
    }

    const deleteButton = document.createElement("button");
    deleteButton.type = "button";
    deleteButton.textContent = "Delete";
    deleteButton.className = "danger-button";
    deleteButton.style.padding = "6px 12px";
    deleteButton.style.fontSize = "13px";

    deleteButton.addEventListener("click", () => {
      deleteBill(bill.id);
    });

    actionCell.appendChild(deleteButton);

    row.append(
      titleCell,
      amountCell,
      dateCell,
      statusCell,
      actionCell
    );

    billsTableBody.appendChild(row);
  });
}

billForm.addEventListener("submit", event => {
  event.preventDefault();

  const title = billTitle.value.trim();
  const rawAmount = Number(billAmount.value);
  const dueDate = billDueDate.value;

  if (!title || !Number.isFinite(rawAmount) || rawAmount <= 0 || !dueDate) {
    billMessage.textContent = "Please enter valid bill details.";
    notify("Please enter valid bill details.", "error");
    return;
  }

  // Precise 2-decimal rounded amount
  const amount = fromPaise(toPaise(rawAmount));
  const bills = getBills();

  bills.push({
    id: crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    title,
    amount,
    dueDate,
    status: "Pending"
  });

  try {
    saveBills(bills);
    billForm.reset();
    billMessage.textContent = "Bill added successfully!";
    notify("Bill added successfully!", "success");
    renderBills();
  } catch (error) {
    console.error(error);
    billMessage.textContent = "Unable to save the bill.";
    notify("Unable to save the bill.", "error");
  }
});

function updateBillStatus(id) {
  const bills = getBills().map(bill =>
    bill.id === id ? { ...bill, status: "Paid" } : bill
  );

  try {
    saveBills(bills);
    notify("Bill marked as paid!", "success");
    renderBills();
  } catch (error) {
    console.error(error);
    notify("Unable to update bill status.", "error");
  }
}

async function deleteBill(id) {
  const bill = getBills().find(b => b.id === id);
  const billName = bill ? `"${bill.title}"` : "this bill";

  let confirmed = false;
  if (window.showConfirm) {
    confirmed = await window.showConfirm({
      title: "Delete Bill",
      message: `Are you sure you want to delete ${billName}?`,
      confirmText: "Delete",
      cancelText: "Cancel",
      isDanger: true
    });
  } else {
    confirmed = confirm(`Are you sure you want to delete ${billName}?`);
  }

  if (!confirmed) return;

  const bills = getBills().filter(b => b.id !== id);

  try {
    saveBills(bills);
    notify("Bill deleted.", "info");
    renderBills();
  } catch (error) {
    console.error(error);
    notify("Unable to delete the bill.", "error");
  }
}

renderBills();

// Auto-refresh when returning to page or when storage changes in another tab
window.addEventListener("pageshow", renderBills);
window.addEventListener("storage", (e) => {
  if (!e.key || e.key === BILL_KEY) {
    renderBills();
  }
});